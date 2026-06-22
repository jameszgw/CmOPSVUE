<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-s-grid" :label="`${d.guestLabel || '虚机'}总数`" :value="num0(d.total)" sub="实例总数" color="#409eff" />
      <stat-card dense icon="el-icon-video-play" label="运行中" :value="num0(d.running)" sub="running" color="#67c23a" />
      <stat-card dense icon="el-icon-video-pause" label="已停止" :value="num0(d.stopped)" sub="stopped" :color="d.stopped > 0 ? '#e6a23c' : '#67c23a'" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" :title="`${d.guestLabel || '虚机'}列表`" icon="el-icon-s-grid">
      <template #extra>
        <el-tag size="mini" :type="isReal ? 'success' : 'info'" style="margin-right:6px">{{ isReal ? "真实采集" : "模拟数据" }}</el-tag>
        共 {{ guests.length }} 项
      </template>
      <el-table :data="guests" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="170" fixed />
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="stateColor(row.state || row.powerState)" style="border:none">
              {{ stateLabel(row.state || row.powerState) }}
            </el-tag>
          </template>
        </el-table-column>
        <template v-if="isDocker">
          <el-table-column prop="image" label="镜像" min-width="160" show-overflow-tooltip />
          <el-table-column label="CPU%" width="90" align="right">
            <template slot-scope="{ row }">{{ row.cpuPct != null ? row.cpuPct + "%" : "-" }}</template>
          </el-table-column>
          <el-table-column label="内存" width="100" align="right">
            <template slot-scope="{ row }">{{ row.memMb != null ? row.memMb + " MB" : "-" }}</template>
          </el-table-column>
          <el-table-column prop="ip" label="IP" min-width="120" />
          <el-table-column prop="ports" label="端口" min-width="120" />
          <el-table-column label="重启" width="80" align="center">
            <template slot-scope="{ row }">
              <span :style="{ color: row.restarts > 0 ? '#f56c6c' : '#67c23a' }">{{ num0(row.restarts) }}</span>
            </template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column label="vCPU" width="80" align="center">
            <template slot-scope="{ row }">{{ row.vcpu != null ? row.vcpu : (row.vcpus != null ? row.vcpus : "-") }}</template>
          </el-table-column>
          <el-table-column label="内存" width="100" align="right">
            <template slot-scope="{ row }">{{ memText(row) }}</template>
          </el-table-column>
          <el-table-column prop="host" label="宿主" min-width="110" />
          <el-table-column prop="ip" label="IP" min-width="120" />
          <el-table-column prop="guestOs" label="操作系统" min-width="130" show-overflow-tooltip />
          <el-table-column label="CPU%" width="90" align="right">
            <template slot-scope="{ row }">{{ row.cpuPct != null ? row.cpuPct + "%" : "-" }}</template>
          </el-table-column>
        </template>
        <el-table-column prop="uptime" label="运行时长" width="120" align="center" />
      </el-table>
      <el-empty v-if="!guests.length" description="暂无数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getVirtGuests } from "@/api/monitor-virt";

const STATE_LABEL = { running: "运行", stopped: "停止", exited: "退出", paused: "暂停", POWERED_ON: "运行", POWERED_OFF: "关机", SUSPENDED: "挂起" };

export default {
  name: "VirtGuests",
  components: { StatCard, SectionCard, CardGrid },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    guests() {
      return this.d.guests || [];
    },
    isDocker() {
      return String(this.d.virtType || "").toUpperCase() === "DOCKER";
    },
    isReal() {
      return ["vsphere", "kvm", "docker"].includes(this.d.source);
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
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    stateColor(s) {
      const v = String(s || "").toLowerCase();
      if (["running", "powered_on"].includes(v)) return "#67c23a";
      if (["paused", "suspended"].includes(v)) return "#e6a23c";
      return "#909399";
    },
    stateLabel(s) {
      return STATE_LABEL[s] || s || "-";
    },
    memText(row) {
      if (row.memGb != null) return `${row.memGb} GB`;
      if (row.memMb != null) return `${(Number(row.memMb) / 1024).toFixed(1)} GB`;
      return "-";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && Object.keys(this.d).length;
      if (!hasData) this.loading = true;
      try {
        const res = await getVirtGuests(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: 8px;
  box-sizing: border-box;
}
.kpi-grid {
  flex-shrink: 0;
}
</style>
