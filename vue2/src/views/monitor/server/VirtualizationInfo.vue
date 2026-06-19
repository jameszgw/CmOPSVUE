<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard dense title="虚拟化 / 容器" icon="el-icon-menu" body-class="badge-body">
      <template #extra>
        <el-tag size="mini" :type="isRealSource ? 'success' : 'info'">
          获取方式：{{ d.collectViaLabel || "-" }} · 来源：{{ d.sourceLabel || "-" }}
        </el-tag>
      </template>
      <el-empty v-if="!d.hasData" :description="d.note || '已禁用模拟数据，暂无真实采集数据'" :image-size="120" />
      <span v-else class="badge-hint">已采集到以下虚拟化 / 容器信息</span>
    </SectionCard>

    <template v-if="d.hasData">
      <CardGrid min="420px" gap="8px">
        <SectionCard v-if="d.kvm" dense title="KVM 虚拟机" icon="el-icon-monitor" scrollable
          body-class="dense-table">
          <template #extra>
            总数 {{ num(kvm.vmTotal) }} · 运行 {{ num(kvm.running) }} · 停止 {{ num(kvm.stopped) }}
          </template>
          <el-table class="dense-table" :data="kvm.vms || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template slot-scope="{ row }">
                <el-tag size="small" :type="row.running ? 'success' : 'info'" effect="plain">{{ row.state }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="vCPU" width="80">
              <template slot-scope="{ row }">{{ num(row.vcpus) }}</template>
            </el-table-column>
            <el-table-column label="最大内存" width="110">
              <template slot-scope="{ row }">{{ mb(row.maxMemMb) }}</template>
            </el-table-column>
            <el-table-column label="已用内存" width="110">
              <template slot-scope="{ row }">{{ mb(row.usedMemMb) }}</template>
            </el-table-column>
            <el-table-column label="CPU时间" width="110">
              <template slot-scope="{ row }">{{ sec(row.cpuTimeSec) }}</template>
            </el-table-column>
          </el-table>
        </SectionCard>

        <SectionCard v-if="d.docker" dense title="Docker 容器" icon="el-icon-box" scrollable
          body-class="dense-table">
          <template #extra>
            总数 {{ num(docker.containerTotal) }} · 运行 {{ num(docker.running) }} · 停止 {{ num(docker.stopped) }}
          </template>
          <el-table class="dense-table" :data="docker.containers || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="image" label="镜像" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template slot-scope="{ row }">
                <el-tag size="small" :type="row.running ? 'success' : 'info'" effect="plain">{{ row.state }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="CPU" width="90">
              <template slot-scope="{ row }">{{ row.cpuPct || "-" }}</template>
            </el-table-column>
            <el-table-column label="内存" width="120">
              <template slot-scope="{ row }">{{ row.memUsage || "-" }}</template>
            </el-table-column>
            <el-table-column label="内存%" width="90">
              <template slot-scope="{ row }">{{ row.memPct || "-" }}</template>
            </el-table-column>
            <el-table-column label="网络IO" width="120">
              <template slot-scope="{ row }">{{ row.netIO || "-" }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态描述" min-width="140" show-overflow-tooltip />
          </el-table>
        </SectionCard>

        <SectionCard v-if="d.vsphere" dense title="VMware vCenter" icon="el-icon-cloudy" scrollable>
          <template #extra>
            主机 {{ num(vsphere.hostConnected) }}/{{ num(vsphere.hostTotal) }} ·
            虚机运行 {{ num(vsphere.running) }}/{{ num(vsphere.vmTotal) }}
          </template>
          <div class="vs-sub">ESXi 主机</div>
          <el-table class="dense-table" :data="vsphere.hosts || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="连接状态" width="120">
              <template slot-scope="{ row }">
                <el-tag size="small" :type="row.connectionState === 'connected' ? 'success' : 'info'" effect="plain">{{ row.connectionState }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="powerState" label="电源" width="120" />
          </el-table>
          <div class="vs-sub">虚拟机</div>
          <el-table class="dense-table" :data="vsphere.vms || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="电源状态" width="130">
              <template slot-scope="{ row }">
                <el-tag size="small" :type="row.powerState === 'POWERED_ON' ? 'success' : 'info'" effect="plain">{{ row.powerState }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="vCPU" width="90">
              <template slot-scope="{ row }">{{ num(row.vcpus) }}</template>
            </el-table-column>
            <el-table-column label="内存" width="110">
              <template slot-scope="{ row }">{{ mb(row.memMb) }}</template>
            </el-table-column>
          </el-table>
        </SectionCard>
      </CardGrid>
    </template>
  </div>
</template>

<script>
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerVirtualization } from "@/api/monitor-server";

export default {
  name: "ServerVirtualizationInfo",
  components: { SectionCard, CardGrid },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    isRealSource() {
      return !["simulated", "none"].includes(this.d.source);
    },
    kvm() {
      return this.d.kvm || {};
    },
    docker() {
      return this.d.docker || {};
    },
    vsphere() {
      return this.d.vsphere || {};
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    has(v) {
      return v !== undefined && v !== null;
    },
    num(v) {
      return this.has(v) ? v : "-";
    },
    mb(v) {
      return this.has(v) ? `${v} MB` : "-";
    },
    sec(v) {
      return this.has(v) ? `${v} s` : "-";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerVirtualization(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: @dense-gap;
}
.badge-hint {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.vs-sub {
  font-size: 13px;
  font-weight: 600;
  color: var(--cm-text-primary, @text-primary);
  margin: 8px 0 6px;
  &:first-child {
    margin-top: 0;
  }
}
</style>
