<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-monitor" label="宿主/节点" :value="num0(d.total)" sub="节点总数" color="#7265e6" />
      <stat-card dense icon="el-icon-circle-check" label="在线" :value="num0(d.online)" sub="Online" color="#67c23a" />
      <stat-card dense icon="el-icon-circle-close" label="离线" :value="num0(offline)" sub="Offline" :color="offline > 0 ? '#f56c6c' : '#67c23a'" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="宿主/节点列表" icon="el-icon-s-grid">
      <template #extra>
        <el-tag size="mini" :type="isReal ? 'success' : 'info'" style="margin-right:6px">{{ isReal ? "真实采集" : "模拟数据" }}</el-tag>
        共 {{ hosts.length }} 个节点
      </template>
      <el-table :data="hosts" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="140" fixed />
        <el-table-column label="IP" min-width="130">
          <template slot-scope="{ row }">{{ row.ip || row.connectionState || "-" }}</template>
        </el-table-column>
        <el-table-column label="角色" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" type="info" effect="plain">{{ roleLabel(row.role || row.powerState) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="statusColor(row.status || row.connectionState)" style="border:none">
              {{ row.status || row.connectionState || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cpuCores" label="CPU 核" width="90" align="center" />
        <el-table-column label="CPU%" width="150">
          <template slot-scope="{ row }">
            <el-progress v-if="row.cpuPct != null" :percentage="clamp(row.cpuPct)" :stroke-width="12" :text-inside="true" :color="pctColor(row.cpuPct)" />
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="memGb" label="内存 GB" width="100" align="center" />
        <el-table-column label="内存%" width="150">
          <template slot-scope="{ row }">
            <el-progress v-if="row.memPct != null" :percentage="clamp(row.memPct)" :stroke-width="12" :text-inside="true" :color="pctColor(row.memPct)" />
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="guestCount" label="承载数" width="90" align="center" />
        <el-table-column prop="version" label="版本" min-width="160" />
        <el-table-column prop="uptime" label="运行时长" width="100" align="center" />
      </el-table>
      <el-empty v-if="!hosts.length" description="暂无数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getVirtHosts } from "@/api/monitor-virt";

const ROLE_LABEL = { hypervisor: "宿主机", manager: "管理节点", worker: "工作节点", POWERED_ON: "运行", POWERED_OFF: "关机" };

export default {
  name: "VirtHosts",
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
    hosts() {
      return this.d.hosts || [];
    },
    offline() {
      return Math.max(0, (Number(this.d.total) || 0) - (Number(this.d.online) || 0));
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
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    statusColor(s) {
      const v = String(s || "").toLowerCase();
      if (["online", "up", "connected"].includes(v)) return "#67c23a";
      if (["warning", "degraded", "maintenance"].includes(v)) return "#e6a23c";
      if (["offline", "down", "disconnected", "notresponding"].includes(v)) return "#f56c6c";
      return "#909399";
    },
    roleLabel(r) {
      return ROLE_LABEL[r] || r || "-";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && Object.keys(this.d).length;
      if (!hasData) this.loading = true;
      try {
        const res = await getVirtHosts(this.deviceId);
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
