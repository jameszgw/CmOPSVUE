<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard title="趋势" icon="el-icon-data-line">
      <template #extra>最近 {{ trendPoints }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
      <el-empty v-if="!trendPoints" description="暂无趋势数据" />
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAndroidTrend } from "@/api/monitor-android";

export default {
  name: "AndroidTrend",
  mixins: [chartSkin],
  components: { SectionCard },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, chart: null };
  },
  computed: {
    trend() {
      return this.d || {};
    },
    trendPoints() {
      return (this.trend.times && this.trend.times.length) || 0;
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
      const t = this.trend;
      this.chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["在线实例", "平均 FPS", "宿主 CPU", "宿主内存"], right: 10 },
        grid: { left: 50, right: 55, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: [
          { type: "value", name: "实例 / FPS" },
          { type: "value", name: "%", position: "right", max: 100 },
        ],
        series: [
          {
            name: "在线实例",
            type: "line",
            smooth: true,
            showSymbol: false,
            areaStyle: { opacity: 0.12 },
            data: t.onlineInstances || [],
          },
          {
            name: "平均 FPS",
            type: "line",
            smooth: true,
            showSymbol: false,
            data: t.avgFps || [],
          },
          {
            name: "宿主 CPU",
            type: "line",
            smooth: true,
            showSymbol: false,
            yAxisIndex: 1,
            data: t.hostCpuPct || [],
          },
          {
            name: "宿主内存",
            type: "line",
            smooth: true,
            showSymbol: false,
            yAxisIndex: 1,
            data: t.hostMemPct || [],
          },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getAndroidTrend(this.deviceId);
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
.trend-chart {
  height: 320px;
  width: 100%;
}
</style>
