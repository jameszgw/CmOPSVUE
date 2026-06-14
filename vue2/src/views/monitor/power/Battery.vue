<template>
  <div v-loading="loading" class="tab-pane">
    <el-alert
      v-if="d.supported === false"
      :title="d.note || '该设备不支持电池监控'"
      type="info"
      :closable="false"
      show-icon
    />
    <el-empty v-if="d.supported === false" description="无电池数据" />

    <template v-else-if="d.supported">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="el-icon-odometer" label="电池电量"
            :value="`${num1(d.soc)}%`" :percent="d.soc" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="el-icon-time" label="续航时间"
            :value="`${num0(d.runtimeMin)} min`" sub="预计可支撑时间" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="el-icon-first-aid-kit" label="健康度"
            :value="`${num1(d.healthPct)}%`" :percent="d.healthPct" color="#e6a23c" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="el-icon-cpu" label="电池状态"
            :value="val(d.status)" :sub="`循环 ${num0(d.cycleCount)} 次`"
            :color="statusColor(d.status)" />
        </el-col>
      </el-row>

      <SectionCard title="电池详情" icon="el-icon-info">
        <InfoTable :rows="detailRows" :columns="2" />
      </SectionCard>
    </template>

    <el-empty v-else description="暂无电池数据" />
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getPowerBattery } from "@/api/monitor-power";

const STATUS_COLORS = {
  Normal: "#67c23a", Healthy: "#67c23a", OK: "#67c23a", Floating: "#67c23a", Full: "#67c23a",
  Charging: "#409eff",
  Warning: "#e6a23c", Degraded: "#e6a23c", Discharging: "#e6a23c",
  Fault: "#f56c6c", Failed: "#f56c6c", Critical: "#f56c6c",
};

export default {
  name: "PowerBattery",
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
      this.loading = true;
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
