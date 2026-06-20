<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense title="趋势" icon="el-icon-data-line" class="fill">
        <template #extra>最近 {{ trendPoints }} 个数据点</template>
        <div ref="chartRef" class="trend-chart"></div>
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getEssTrend } from "@/api/monitor-ess";

export default {
  name: "EssTrend",
  mixins: [chartSkin],
  components: { SectionCard, CardGrid },
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
        legend: { data: ["SOC %", "SOH %", "功率 kW"], right: 10 },
        grid: { left: 50, right: 50, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: d.times || [] },
        yAxis: [
          { type: "value", name: "%", min: 0, max: 100 },
          { type: "value", name: "kW", position: "right" },
        ],
        series: [
          {
            name: "SOC %",
            type: "line",
            smooth: true,
            showSymbol: false,
            data: d.soc || [],
          },
          {
            name: "SOH %",
            type: "line",
            smooth: true,
            showSymbol: false,
            data: d.soh || [],
          },
          {
            name: "功率 kW",
            type: "line",
            smooth: true,
            showSymbol: false,
            yAxisIndex: 1,
            data: d.powerKw || [],
          },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getEssTrend(this.deviceId);
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
