<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-pie-chart" label="容量使用率" :value="`${num(d.usagePct)}%`"
        :percent="d.usagePct" color="#409eff" />
      <StatCard dense icon="el-icon-odometer" label="IOPS"
        :value="d.iops == null ? '-' : d.iops" sub="每秒读写操作" color="#67c23a" />
      <StatCard dense icon="el-icon-data-line" label="吞吐"
        :value="d.throughput == null ? '-' : d.throughput" sub="读写吞吐量" color="#e6a23c" />
      <StatCard dense icon="el-icon-timer" label="平均延迟"
        :value="`${num(d.avgLatencyMs)} ms`" sub="平均响应时延" color="#909399" />
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
      <SectionCard dense scrollable title="容量概况" icon="el-icon-coin">
        <InfoTable :rows="capacityRows" />
      </SectionCard>
      <template v-if="isCeph">
        <SectionCard dense scrollable title="OSD 状态" icon="el-icon-cpu">
          <InfoTable :rows="osdRows" />
        </SectionCard>
        <SectionCard dense scrollable title="PG 状态" icon="el-icon-s-grid">
          <InfoTable :rows="pgRows" />
        </SectionCard>
      </template>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStorageOverview } from "@/api/monitor-storage";

export default {
  name: "StorageOverview",
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
    isCeph() {
      return this.d.osdTotal != null || this.d.pgTotal != null;
    },
    healthColor() {
      const h = String(this.d.health || "").toUpperCase();
      if (h === "OK" || h === "HEALTHY" || h === "GOOD") return "#67c23a";
      if (h === "WARN" || h === "WARNING" || h === "DEGRADED") return "#e6a23c";
      if (h === "ERR" || h === "ERROR" || h === "CRITICAL") return "#f56c6c";
      return "#909399";
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "存储类型", value: d.storageType },
        { label: "厂商", value: d.vendor },
        { label: "地址", value: d.address },
        { label: "健康状态", value: d.healthText || d.health, color: this.healthColor },
        { label: "存储池数量", value: d.poolCount == null ? "-" : d.poolCount },
      ];
    },
    capacityRows() {
      const d = this.d;
      return [
        { label: "总容量", value: d.totalCapacity },
        { label: "已用容量", value: d.usedCapacity, color: "#e6a23c" },
        { label: "可用容量", value: d.availableCapacity, color: "#67c23a" },
        { label: "使用率", value: `${this.num(d.usagePct)}%` },
      ];
    },
    osdRows() {
      const d = this.d;
      return [
        { label: "OSD 总数", value: d.osdTotal == null ? "-" : d.osdTotal },
        { label: "OSD Up", value: d.osdUp == null ? "-" : d.osdUp, color: "#67c23a" },
        { label: "OSD Down", value: d.osdDown == null ? "-" : d.osdDown, color: d.osdDown ? "#f56c6c" : "#909399" },
        { label: "Monitor 仲裁", value: d.monQuorum },
      ];
    },
    pgRows() {
      const d = this.d;
      return [
        { label: "PG 总数", value: d.pgTotal == null ? "-" : d.pgTotal },
        { label: "Active+Clean", value: d.pgActiveClean == null ? "-" : d.pgActiveClean, color: "#67c23a" },
        { label: "Degraded", value: d.pgDegraded == null ? "-" : d.pgDegraded, color: d.pgDegraded ? "#e6a23c" : "#909399" },
        { label: "Scrub 错误", value: d.scrubErrors == null ? "-" : d.scrubErrors, color: d.scrubErrors ? "#f56c6c" : "#909399" },
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
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getStorageOverview(this.deviceId);
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
</style>
