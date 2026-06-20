<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard dense title="虚拟化 / 容器" icon="Grid" bodyClass="badge-body">
      <template #extra>
        <el-tag size="small" :type="isRealSource ? 'success' : 'info'">
          获取方式：{{ d.collectViaLabel || "-" }} · 来源：{{ d.sourceLabel || "-" }}
        </el-tag>
      </template>
      <el-empty v-if="!d.hasData" :description="d.note || '已禁用模拟数据，暂无真实采集数据'" />
      <span v-else class="badge-hint">已采集到以下虚拟化 / 容器信息</span>
    </SectionCard>

    <template v-if="d.hasData">
      <CardGrid min="420px" gap="8px">
        <SectionCard v-if="d.kvm" dense title="KVM 虚拟机" icon="Monitor" scrollable
          bodyClass="dense-table">
          <template #extra>
            总数 {{ d.kvm.vmTotal ?? "-" }} · 运行 {{ d.kvm.running ?? "-" }} · 停止 {{ d.kvm.stopped ?? "-" }}
          </template>
          <el-table class="dense-table" :data="d.kvm.vms || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.running ? 'success' : 'info'" effect="plain">{{ row.state }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="vCPU" width="80">
              <template #default="{ row }">{{ num(row.vcpus) }}</template>
            </el-table-column>
            <el-table-column label="最大内存" width="110">
              <template #default="{ row }">{{ mb(row.maxMemMb) }}</template>
            </el-table-column>
            <el-table-column label="已用内存" width="110">
              <template #default="{ row }">{{ mb(row.usedMemMb) }}</template>
            </el-table-column>
            <el-table-column label="CPU时间" width="110">
              <template #default="{ row }">{{ sec(row.cpuTimeSec) }}</template>
            </el-table-column>
          </el-table>
        </SectionCard>

        <SectionCard v-if="d.docker" dense title="Docker 容器" icon="Box" scrollable
          bodyClass="dense-table">
          <template #extra>
            总数 {{ d.docker.containerTotal ?? "-" }} · 运行 {{ d.docker.running ?? "-" }} · 停止 {{ d.docker.stopped ?? "-" }}
          </template>
          <el-table class="dense-table" :data="d.docker.containers || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="image" label="镜像" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.running ? 'success' : 'info'" effect="plain">{{ row.state }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="CPU" width="90">
              <template #default="{ row }">{{ row.cpuPct || "-" }}</template>
            </el-table-column>
            <el-table-column label="内存" width="120">
              <template #default="{ row }">{{ row.memUsage || "-" }}</template>
            </el-table-column>
            <el-table-column label="内存%" width="90">
              <template #default="{ row }">{{ row.memPct || "-" }}</template>
            </el-table-column>
            <el-table-column label="网络IO" width="120">
              <template #default="{ row }">{{ row.netIO || "-" }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态描述" min-width="140" show-overflow-tooltip />
          </el-table>
        </SectionCard>

        <SectionCard v-if="d.vsphere" dense title="VMware vCenter" icon="Cloudy" scrollable>
          <template #extra>
            主机 {{ d.vsphere.hostConnected ?? "-" }}/{{ d.vsphere.hostTotal ?? "-" }} ·
            虚机运行 {{ d.vsphere.running ?? "-" }}/{{ d.vsphere.vmTotal ?? "-" }}
          </template>
          <div class="vs-sub">ESXi 主机</div>
          <el-table class="dense-table" :data="d.vsphere.hosts || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="连接状态" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.connectionState === 'connected' ? 'success' : 'info'" effect="plain">{{ row.connectionState }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="powerState" label="电源" width="120" />
          </el-table>
          <div class="vs-sub">虚拟机</div>
          <el-table class="dense-table" :data="d.vsphere.vms || []" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="电源状态" width="130">
              <template #default="{ row }">
                <el-tag size="small" :type="row.powerState === 'POWERED_ON' ? 'success' : 'info'" effect="plain">{{ row.powerState }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="vCPU" width="90">
              <template #default="{ row }">{{ num(row.vcpus) }}</template>
            </el-table-column>
            <el-table-column label="内存" width="110">
              <template #default="{ row }">{{ mb(row.memMb) }}</template>
            </el-table-column>
          </el-table>
        </SectionCard>
      </CardGrid>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerVirtualization } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const has = (v) => v !== undefined && v !== null;
const num = (v) => (has(v) ? v : "-");
const mb = (v) => (has(v) ? `${v} MB` : "-");
const sec = (v) => (has(v) ? `${v} s` : "-");

// 真实采集来源（非模拟/无数据）则徽标用 success
const isRealSource = computed(() => !["simulated", "none"].includes(d.value.source));

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getServerVirtualization(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
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
  color: var(--cm-text-secondary);
}
.vs-sub {
  font-size: 13px;
  font-weight: 600;
  color: var(--cm-text-primary);
  margin: 8px 0 6px;
  &:first-child {
    margin-top: 0;
  }
}
</style>
