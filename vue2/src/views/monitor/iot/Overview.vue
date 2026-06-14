<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-cpu" label="传感器总数" :value="num0(d.sensorTotal)"
          sub="接入传感器数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-circle-check" label="在线" :value="num0(d.online)"
          sub="在线传感器" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-circle-close" label="离线" :value="num0(d.offline)"
          sub="离线传感器" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-connection" label="平均信号"
          :value="`${num0(d.avgRssi)} dBm`" sub="平均 RSSI" color="#e6a23c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <InfoTable :rows="basicRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="网关 / 状态" icon="el-icon-cpu">
          <InfoTable :rows="statusRows" :columns="2" />
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getIotOverview } from "@/api/monitor-iot";

export default {
  name: "IotOverview",
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
        { label: "物联类型", value: this.val(d.iotType) },
        { label: "协议", value: this.val(d.protocol) },
        { label: "频段", value: this.val(d.band) },
        { label: "频段占用率", value: this.pct(d.bandOccupancyPct) },
        { label: "平均电量", value: this.pct(d.avgBattery) },
        { label: "更新时间", value: this.val(d.updatedAt) },
      ];
    },
    statusRows() {
      const d = this.d;
      const rows = [
        { label: "网关状态", value: this.val(d.gatewayStatus), color: this.statusColor(d.gatewayStatus) },
        { label: "在线 / 离线", value: `${this.num0(d.online)} / ${this.num0(d.offline)}` },
      ];
      if (d.iotType === "INFRARED") {
        rows.push({ label: "今日入侵", value: this.num0(d.intrusionToday), color: this.intrusionColor(d.intrusionToday) });
        rows.push({ label: "布防状态", value: this.armed(d.armed), color: d.armed ? "#67c23a" : "#909399" });
      }
      if (d.iotType === "ENV") {
        rows.push({ label: "温度", value: this.unit(d.temperature, "℃") });
        rows.push({ label: "湿度", value: this.pct(d.humidity) });
        rows.push({ label: "CO₂", value: this.unit(d.co2, "ppm") });
        rows.push({ label: "PM2.5", value: this.unit(d.pm25, "μg/m³") });
      }
      return rows;
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
    pct(v) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)}%`;
    },
    unit(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)} ${u}`;
    },
    armed(v) {
      if (v === undefined || v === null) return "-";
      return v ? "已布防" : "未布防";
    },
    intrusionColor(v) {
      return (Number(v) || 0) > 0 ? "#f56c6c" : "#67c23a";
    },
    statusColor(s) {
      if (["online", "normal", "active", "running", "Online", "Normal", "Healthy", "Ready"].includes(s)) return "#67c23a";
      if (["warning", "degraded", "Warning", "Degraded"].includes(s)) return "#e6a23c";
      if (["offline", "failed", "down", "Offline", "Failed", "Down"].includes(s)) return "#f56c6c";
      return "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getIotOverview(this.deviceId);
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
</style>
