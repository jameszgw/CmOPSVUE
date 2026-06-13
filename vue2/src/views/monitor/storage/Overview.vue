<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-pie-chart" label="容量使用率" :value="`${num(d.usagePct)}%`"
          :percent="d.usagePct" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="IOPS"
          :value="d.iops == null ? '-' : d.iops" sub="每秒读写操作" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-data-line" label="吞吐"
          :value="d.throughput == null ? '-' : d.throughput" sub="读写吞吐量" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-timer" label="平均延迟"
          :value="`${num(d.avgLatencyMs)} ms`" sub="平均响应时延" color="#909399" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="容量概况" icon="el-icon-coin">
          <InfoTable :rows="capacityRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <template v-if="isCeph">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="12">
          <SectionCard title="OSD 状态" icon="el-icon-cpu">
            <InfoTable :rows="osdRows" />
          </SectionCard>
        </el-col>
        <el-col :xs="24" :lg="12">
          <SectionCard title="PG 状态" icon="el-icon-s-grid">
            <InfoTable :rows="pgRows" />
          </SectionCard>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStorageOverview } from "@/api/monitor-storage";

export default {
  name: "StorageOverview",
  components: { StatCard, SectionCard, InfoTable },
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
      this.loading = true;
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
