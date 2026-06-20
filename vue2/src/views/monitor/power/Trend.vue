<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-odometer" label="当前负载率"
        :value="`${num1(latest.loadPct)}%`" :percent="latest.loadPct" color="#409eff" />
      <StatCard dense icon="el-icon-lightning" label="当前有功功率"
        :value="`${num1(latest.activePowerKw)} kW`" sub="最新采样值" color="#e6a23c" />
      <StatCard dense icon="el-icon-coin" label="当前电量"
        :value="`${num1(latest.energyKwh)} kWh`" sub="最新采样值" color="#67c23a" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense title="电能趋势" icon="el-icon-data-line" class="fill">
        <template #extra>最近 {{ trendPoints }} 个数据点</template>
        <el-empty v-if="!trendPoints" description="暂无趋势数据" />
        <div v-show="trendPoints" ref="chartRef" class="trend-chart"></div>
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getPowerTrend } from "@/api/monitor-power";

export default {
  name: "PowerTrend",
  mixins: [chartSkin],
  components: { StatCard, SectionCard, CardGrid },
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
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
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
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  overflow: hidden;
}
.trend-chart {
  height: @chart-h-md;
  width: 100%;
}
</style>
