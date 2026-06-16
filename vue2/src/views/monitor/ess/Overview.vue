<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="SOC"
          :value="`${num1(d.soc)}%`" :percent="d.soc" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-first-aid-kit" label="SOH"
          :value="`${num1(d.soh)}%`" :percent="d.soh" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-lightning" label="功率"
          :value="`${num1(d.powerKw)} kW`" :sub="`电压 ${num1(d.voltage)} V`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="可用容量"
          :value="`${num1(d.availableKwh)} kWh`"
          :sub="`总容量 ${num1(d.capacityKwh)} kWh`" color="#909399" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP"}[d.source] || "模拟数据" }}
            </el-tag>
            <el-tag size="small" :color="statusColor(d.status)" effect="dark" class="plain-tag">
              {{ d.status || "-" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="温度" icon="el-icon-warning-outline">
          <InfoTable :rows="tempRows" />
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getEssOverview } from "@/api/monitor-ess";

const STATUS_COLORS = {
  Healthy: "#67c23a", Ready: "#67c23a", Normal: "#67c23a", Online: "#67c23a", Idle: "#67c23a",
  Charging: "#409eff", Discharging: "#409eff",
  Warning: "#e6a23c", Degraded: "#e6a23c",
  Unhealthy: "#f56c6c", Failed: "#f56c6c", Offline: "#f56c6c", Fault: "#f56c6c",
};

export default {
  name: "EssOverview",
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
    basicRows() {
      const d = this.d;
      return [
        { label: "储能类型", value: this.val(d.essType) },
        { label: "厂商", value: this.val(d.vendor) },
        { label: "IP 地址", value: this.val(d.ip) },
        { label: "环境", value: this.val(d.env) },
        { label: "额定容量", value: this.unit(d.capacityKwh, "kWh") },
        { label: "运行模式", value: this.val(d.mode) },
        { label: "电压", value: this.unit1(d.voltage, "V") },
        { label: "电流", value: this.unit1(d.current, "A") },
        { label: "效率", value: this.pct(d.efficiencyPct) },
        { label: "循环次数", value: this.num0(d.cycleCount) },
        { label: "更新时间", value: this.val(d.updatedAt) },
      ];
    },
    tempRows() {
      const d = this.d;
      return [
        { label: "最高电芯温度", value: this.unit1(d.cellTempMax, "℃"), color: "#f56c6c" },
        { label: "最低电芯温度", value: this.unit1(d.cellTempMin, "℃"), color: "#409eff" },
        { label: "温差", value: this.unit1(d.cellTempDiff, "℃"), color: "#e6a23c" },
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
    unit(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(0)} ${u}`;
    },
    unit1(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)} ${u}`;
    },
    pct(v) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)}%`;
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getEssOverview(this.deviceId);
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card, @bg-card);
}
</style>
