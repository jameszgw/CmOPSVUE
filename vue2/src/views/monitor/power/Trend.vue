<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-odometer" label="当前负载率"
          :value="`${num1(latest.loadPct)}%`" :percent="latest.loadPct" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-lightning" label="当前有功功率"
          :value="`${num1(latest.activePowerKw)} kW`" sub="最新采样值" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-coin" label="当前电量"
          :value="`${num1(latest.energyKwh)} kWh`" sub="最新采样值" color="#67c23a" />
      </el-col>
    </el-row>

    <SectionCard title="电能趋势" icon="el-icon-data-line">
      <template #extra>最近 {{ trendPoints }} 个数据点</template>
      <el-empty v-if="!trendPoints" description="暂无趋势数据" />
      <div v-show="trendPoints" ref="chartRef" class="trend-chart"></div>
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getPowerTrend } from "@/api/monitor-power";

export default {
  name: "PowerTrend",
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
    latest() {
      const d = this.d;
      const last = (arr) => (Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null);
      return {
        loadPct: last(d.loadPct),
        activePowerKw: last(d.activePowerKw),
        energyKwh: last(d.energyKwh),
      };
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
      this.chart.setOption(
        {
          tooltip: { trigger: "axis" },
          legend: { data: ["负载率", "有功功率", "电量"], right: 10 },
          grid: { left: 50, right: 60, top: 40, bottom: 30 },
          xAxis: { type: "category", boundaryGap: false, data: d.times || [] },
          yAxis: [
            { type: "value", name: "%", position: "left", max: 100 },
            { type: "value", name: "kW / kWh", position: "right" },
          ],
          series: [
            {
              name: "负载率",
              type: "line",
              smooth: true,
              showSymbol: false,
              areaStyle: { opacity: 0.15 },
              yAxisIndex: 0,
              data: d.loadPct || [],
            },
            {
              name: "有功功率",
              type: "line",
              smooth: true,
              showSymbol: false,
              yAxisIndex: 1,
              data: d.activePowerKw || [],
            },
            {
              name: "电量",
              type: "line",
              smooth: true,
              showSymbol: false,
              yAxisIndex: 1,
              data: d.energyKwh || [],
            },
          ],
        },
        true
      );
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getPowerTrend(this.deviceId);
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
  height: 320px;
  width: 100%;
}
</style>
