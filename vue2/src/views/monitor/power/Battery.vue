<template>
  <div v-loading="loading" class="tab-screen">
    <UnsupportedMask :unsupported="!d.supported" :reason="d.note" title="该电源无电池">
      <card-grid min="200px" gap="8px">
        <StatCard dense icon="el-icon-odometer" label="电池电量"
          :value="`${num1(d.soc)}%`" :percent="d.soc" color="#67c23a" />
        <StatCard dense icon="el-icon-time" label="续航时间"
          :value="`${num0(d.runtimeMin)} min`" sub="预计可支撑时间" color="#409eff" />
        <StatCard dense icon="el-icon-first-aid-kit" label="健康度"
          :value="`${num1(d.healthPct)}%`" :percent="d.healthPct" color="#e6a23c" />
        <StatCard dense icon="el-icon-cpu" label="电池状态"
          :value="val(d.status)" :sub="`循环 ${num0(d.cycleCount)} 次`"
          :color="statusColor(d.status)" />
      </card-grid>

      <card-grid class="fill" min="300px" gap="8px">
        <SectionCard dense scrollable title="电池详情" icon="el-icon-info" class="fill">
          <InfoTable :rows="detailRows" :columns="2" />
        </SectionCard>
      </card-grid>
    </UnsupportedMask>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import UnsupportedMask from "@/components/monitor/UnsupportedMask.vue";
import { getPowerBattery } from "@/api/monitor-power";

const STATUS_COLORS = {
  Normal: "#67c23a", Healthy: "#67c23a", OK: "#67c23a", Floating: "#67c23a", Full: "#67c23a",
  Charging: "#409eff",
  Warning: "#e6a23c", Degraded: "#e6a23c", Discharging: "#e6a23c",
  Fault: "#f56c6c", Failed: "#f56c6c", Critical: "#f56c6c",
};

export default {
  name: "PowerBattery",
  components: { StatCard, SectionCard, CardGrid, InfoTable, UnsupportedMask },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    detailRows() {
      const d = this.d;
      return [
        { label: "电压", value: this.unit(d.voltage, "V") },
        { label: "电流", value: this.unit(d.current, "A") },
        { label: "温度", value: d.temperature == null ? "-" : `${this.num1(d.temperature)}℃` },
        { label: "循环次数", value: this.num0(d.cycleCount) },
        { label: "上次自检", value: this.val(d.lastSelfTest) },
        { label: "电池状态", value: this.val(d.status), color: this.statusColor(d.status) },
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
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)} ${u}`;
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getPowerBattery(this.deviceId);
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
