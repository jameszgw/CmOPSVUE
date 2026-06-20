<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-connection" label="端口" :value="`${num0(d.portUp)} / ${num0(d.portTotal)}`"
        :sub="`Up ${num0(d.portUp)} / Down ${num0(d.portDown)}`" color="#409eff" />
      <StatCard dense icon="el-icon-odometer" label="CPU 使用率" :value="`${num1(d.cpuPct)}%`"
        :percent="d.cpuPct" color="#e6a23c" />
      <StatCard dense icon="el-icon-warning-outline" label="丢包率" :value="`${num1(d.totalPacketLoss)}%`"
        :sub="`内存使用率 ${num1(d.memPct)}%`" :color="pctColor(d.totalPacketLoss)" />
      <StatCard dense icon="el-icon-data-line" label="会话使用率" :value="`${num1(d.sessionUsagePct)}%`"
        :percent="d.sessionUsagePct" color="#9254de" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable title="基础信息" icon="el-icon-info">
        <template #extra>
          <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
            {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" />
      </SectionCard>
      <SectionCard dense scrollable title="设备状态" icon="el-icon-set-up">
        <div class="status-grid">
            <div v-for="s in statusItems" :key="s.label" class="status-item">
              <span class="status-item__label">{{ s.label }}</span>
              <el-tag size="small" :color="statusColor(s.value)" effect="dark" class="plain-tag">
                {{ s.value || "-" }}
              </el-tag>
            </div>
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <span class="metric-item__label">温度</span>
              <span class="metric-item__value" :style="{ color: tempColor(d.temperature) }">
                {{ tempText }}<small v-if="hasTemp">℃</small>
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">入流量</span>
              <span class="metric-item__value">{{ val(d.inThroughput) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">出流量</span>
              <span class="metric-item__value">{{ val(d.outThroughput) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">运行时长</span>
              <span class="metric-item__value">{{ val(d.uptime) }}</span>
            </div>
          </div>
        </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getNetDevOverview } from "@/api/monitor-netdev";

export default {
  name: "NetDevOverview",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    hasTemp() {
      return this.d.temperature !== undefined && this.d.temperature !== null;
    },
    tempText() {
      return this.hasTemp ? this.d.temperature : "-";
    },
    basicRows() {
      const v = this.d;
      return [
        { label: "设备类型", value: this.val(v.netDevType) },
        { label: "厂商", value: this.val(v.vendor) },
        { label: "型号", value: this.val(v.model) },
        { label: "IP 地址", value: this.val(v.ip) },
        { label: "状态", value: this.val(v.status) },
        { label: "运行时长", value: this.val(v.uptime) },
      ];
    },
    statusItems() {
      const v = this.d;
      return [
        { label: "风扇状态", value: v.fanStatus },
        { label: "电源状态", value: v.powerStatus },
      ];
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
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    tempColor(v) {
      const n = Number(v) || 0;
      if (n >= 75) return "#f56c6c";
      if (n >= 60) return "#e6a23c";
      return "#303133";
    },
    statusColor(s) {
      if (["up", "online", "normal", "Established", "active", "Normal", "Up", "Online"].includes(s)) return "#67c23a";
      if (["near-full", "degraded", "warning", "Warning"].includes(s)) return "#e6a23c";
      if (["down", "offline", "failed", "Down", "Offline", "Failed"].includes(s)) return "#f56c6c";
      return "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getNetDevOverview(this.deviceId);
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
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  overflow: hidden;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 12px 14px;

  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card, @bg-card);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 12px;

  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 18px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);

    small {
      font-size: 12px;
      font-weight: 400;
      margin-left: 2px;
    }
  }
}
</style>
