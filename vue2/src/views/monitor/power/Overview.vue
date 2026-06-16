<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="负载率"
          :value="`${num1(d.loadPct)}%`" :percent="d.loadPct" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-lightning" label="有功功率"
          :value="`${num1(d.activePowerKw)} kW`"
          :sub="`视在 ${num1(d.apparentPowerKva)} kVA`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="今日电量"
          :value="`${num1(d.energyTodayKwh)} kWh`"
          :sub="`累计 ${num1(d.energyTotalKwh)} kWh`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-warning-outline" label="温度"
          :value="`${num1(d.temperature)}℃`"
          :sub="`功率因数 ${num1(d.powerFactor)}`" color="#f56c6c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard :title="isUps ? '状态与电池' : '运行状态'" icon="el-icon-cpu">
          <InfoTable :rows="statusRows" />
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getPowerOverview } from "@/api/monitor-power";

const STATUS_COLORS = {
  Normal: "#67c23a", Online: "#67c23a", Healthy: "#67c23a", OK: "#67c23a", Running: "#67c23a",
  Charging: "#409eff", Floating: "#67c23a", OnLine: "#67c23a",
  Warning: "#e6a23c", Degraded: "#e6a23c", OnBattery: "#e6a23c", Discharging: "#e6a23c",
  Fault: "#f56c6c", Failed: "#f56c6c", Offline: "#f56c6c", Critical: "#f56c6c",
};

export default {
  name: "PowerOverview",
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
    isUps() {
      return (
        this.d.deviceType === "UPS" ||
        this.d.batterySoc !== undefined ||
        this.d.batteryStatus !== undefined
      );
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "设备类型", value: this.val(d.deviceType) },
        { label: "厂商", value: this.val(d.vendor) },
        { label: "IP 地址", value: this.val(d.ip) },
        { label: "环境", value: this.val(d.env) },
        { label: "额定功率", value: this.unit(d.ratedPowerKw, "kW") },
        { label: "功率因数", value: this.num1(d.powerFactor) },
        { label: "输入电压", value: this.unit(d.inputVoltage, "V") },
        { label: "输出电压", value: this.unit(d.outputVoltage, "V") },
        { label: "频率", value: this.unit(d.frequencyHz, "Hz") },
        { label: "电流", value: this.unit(d.current, "A") },
        { label: "视在功率", value: this.unit(d.apparentPowerKva, "kVA") },
        { label: "累计电量", value: this.unit(d.energyTotalKwh, "kWh") },
        { label: "更新时间", value: this.val(d.updatedAt) },
      ];
    },
    statusRows() {
      const d = this.d;
      const rows = [
        { label: "运行状态", value: this.val(d.status), color: this.statusColor(d.status) },
        { label: "负载率", value: d.loadPct == null ? "-" : `${this.num1(d.loadPct)}%` },
        { label: "有功功率", value: this.unit(d.activePowerKw, "kW") },
        { label: "今日电量", value: this.unit(d.energyTodayKwh, "kWh") },
        { label: "温度", value: d.temperature == null ? "-" : `${this.num1(d.temperature)}℃` },
      ];
      if (this.isUps) {
        rows.push(
          { label: "电池电量", value: d.batterySoc == null ? "-" : `${this.num1(d.batterySoc)}%`, color: "#67c23a" },
          { label: "续航时间", value: d.batteryRuntimeMin == null ? "-" : `${this.num0(d.batteryRuntimeMin)} min` },
          { label: "电池状态", value: this.val(d.batteryStatus), color: this.statusColor(d.batteryStatus) }
        );
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
    unit(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)} ${u}`;
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getPowerOverview(this.deviceId);
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
