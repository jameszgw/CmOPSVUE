<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-bottom" label="今日充电"
          :value="`${num1(d.todayChargeKwh)} kWh`" sub="今日充入电量" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-top" label="今日放电"
          :value="`${num1(d.todayDischargeKwh)} kWh`" sub="今日放出电量" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-sort" label="吞吐量"
          :value="`${num1(d.throughputKwh)} kWh`" sub="累计吞吐电量" color="#409eff" />
      </el-col>
    </el-row>

    <SectionCard title="充放电曲线" icon="el-icon-data-line">
      <template #extra>最近 {{ trendPoints }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getEssChargeDischarge } from "@/api/monitor-ess";

export default {
  name: "EssChargeDischarge",
  mixins: [chartSkin],
  components: { StatCard, SectionCard },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, chart: null };
  },
  computed: {
    trendPoints() {
      return (this.d.times && this.d.times.length) || 0;
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
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    reinitChartsForSkin() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      this.renderChart();
    },
    renderChart() {
      if (!this.$refs.chartRef) return;
      if (!this.chart) {
        applyChartTheme(echarts);
        this.chart = echarts.init(this.$refs.chartRef, currentChartTheme());
      }
      const d = this.d;
      this.chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["功率 kW", "SOC %"], right: 10 },
        grid: { left: 50, right: 50, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: d.times || [] },
        yAxis: [
          { type: "value", name: "kW" },
          { type: "value", name: "%", position: "right", min: 0, max: 100 },
        ],
        series: [
          {
            name: "功率 kW",
            type: "line",
            smooth: true,
            areaStyle: { opacity: 0.15 },
            showSymbol: false,
            data: d.powerKw || [],
          },
          {
            name: "SOC %",
            type: "line",
            smooth: true,
            showSymbol: false,
            yAxisIndex: 1,
            data: d.socPct || [],
          },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getEssChargeDischarge(this.deviceId);
        this.d = res.content || {};
        await this.$nextTick();
        this.renderChart();
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
.trend-chart {
  height: 300px;
  width: 100%;
}
</style>
