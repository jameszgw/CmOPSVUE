<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-cpu" label="CPU 使用率"
        :value="`${num1(d.cpuUsage)}%`" :percent="d.cpuUsage" color="#409eff" />
      <StatCard dense icon="el-icon-sunny" label="SoC 温度"
        :value="`${num0(d.socTemp)}℃`" :sub="`功耗 ${num1(d.powerWatt)} W`" color="#f56c6c" />
      <StatCard dense icon="el-icon-coin" label="内存使用率"
        :value="`${num1(d.memUsage)}%`" :percent="d.memUsage"
        :sub="`总内存 ${num0(d.memTotalMb)} MB`" color="#67c23a" />
      <StatCard dense icon="el-icon-lightning" label="供电电压"
        :value="`${num2(d.supplyVoltage)} V`" :sub="`电流 ${num2(d.supplyCurrent)} A`" color="#e6a23c" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable title="基础信息" icon="el-icon-info" class="fill">
        <template #extra>
          <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
            {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
          </el-tag>
          <el-tag size="mini" :type="statusTag" effect="dark">{{ val(d.status) }}</el-tag>
        </template>
        <InfoTable :rows="basicRows" :columns="2" />
      </SectionCard>
      <SectionCard dense scrollable title="电源与状态" icon="el-icon-warning-outline" class="fill">
        <div class="flag-row">
          <span class="flag-row__label">欠压</span>
          <el-tag size="small" :type="d.underVoltage ? 'danger' : 'success'">
            {{ Number(d.underVoltage) ? "是" : "否" }}
          </el-tag>
        </div>
        <div class="flag-row">
          <span class="flag-row__label">降频</span>
          <el-tag size="small" :type="d.throttled ? 'warning' : 'success'">
            {{ Number(d.throttled) ? "是" : "否" }}
          </el-tag>
        </div>
        <InfoTable :rows="powerRows" />
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getSbcOverview } from "@/api/monitor-sbc";

const STATUS_TAG = {
  Online: "success", Healthy: "success", Normal: "success", Ready: "success",
  Warning: "warning", Degraded: "warning",
  Offline: "danger", Unhealthy: "danger", Failed: "danger",
};

export default {
  name: "SbcOverview",
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
    statusTag() {
      return STATUS_TAG[this.d.status] || "info";
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "名称", value: this.val(d.name) },
        { label: "板型", value: this.val(d.boardModel) },
        { label: "SoC", value: this.val(d.soc) },
        { label: "CPU 架构", value: this.val(d.cpuArch) },
        { label: "IP 地址", value: this.val(d.ip) },
        { label: "环境", value: this.val(d.env) },
        { label: "操作系统", value: this.val(d.osName) },
        { label: "运行时间", value: this.val(d.uptime) },
        { label: "大核频率", value: this.unit(d.bigCoreFreqMhz, "MHz") },
        { label: "小核频率", value: this.unit(d.littleCoreFreqMhz, "MHz") },
        { label: "存储类型", value: this.val(d.storageType) },
        { label: "存储使用", value: this.pct(d.storageUsagePct) },
        { label: "存储寿命", value: this.pct(d.storageWearPct) },
        { label: "功耗", value: this.unit(d.powerWatt, "W", 1) },
      ];
    },
    powerRows() {
      const d = this.d;
      return [
        { label: "供电电压", value: d.supplyVoltage == null ? "-" : `${this.num2(d.supplyVoltage)} V`, color: "#e6a23c" },
        { label: "供电电流", value: d.supplyCurrent == null ? "-" : `${this.num2(d.supplyCurrent)} A`, color: "#409eff" },
        { label: "整机功耗", value: d.powerWatt == null ? "-" : `${this.num1(d.powerWatt)} W`, color: "#67c23a" },
        { label: "SoC 温度", value: d.socTemp == null ? "-" : `${this.num0(d.socTemp)} ℃`, color: "#f56c6c" },
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
    num2(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    pct(v) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)}%`;
    },
    unit(v, u, p = 0) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(p)} ${u}`;
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getSbcOverview(this.deviceId);
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
.flag-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  &__label {
    width: 60px;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
}
</style>
