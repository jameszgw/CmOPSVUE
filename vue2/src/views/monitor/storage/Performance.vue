<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-odometer" label="总 IOPS"
        :value="totalIops" sub="读写 IOPS 合计" color="#409eff" />
      <StatCard dense icon="el-icon-pie-chart" label="缓存命中率" :value="`${num(d.cacheHitRate)}%`"
        :percent="d.cacheHitRate" color="#67c23a" />
      <StatCard dense icon="el-icon-files" label="队列深度"
        :value="d.queueDepth == null ? '-' : d.queueDepth" sub="平均 I/O 队列深度" color="#e6a23c" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable title="IOPS" icon="el-icon-odometer">
        <InfoTable :rows="iopsRows" />
      </SectionCard>
      <SectionCard dense scrollable title="吞吐" icon="el-icon-data-line">
        <InfoTable :rows="throughputRows" />
      </SectionCard>
      <SectionCard dense scrollable title="延迟" icon="el-icon-timer">
        <InfoTable :rows="latencyRows" />
      </SectionCard>
      <SectionCard dense title="IOPS 趋势图" icon="el-icon-data-line">
        <template #extra>最近 {{ trendCount }} 个数据点</template>
        <div ref="chartRef" class="trend-chart"></div>
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
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStoragePerformance } from "@/api/monitor-storage";

export default {
  name: "StoragePerformance",
  mixins: [chartSkin],
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, chart: null };
  },
  computed: {
    totalIops() {
      const i = this.d.iops || {};
      return i.total == null ? "-" : i.total;
    },
    trendCount() {
      const t = this.d.trend || {};
      return (t.times && t.times.length) || 0;
    },
    iopsRows() {
      const i = this.d.iops || {};
      return [
        { label: "读 IOPS", value: i.read == null ? "-" : i.read, color: "#409eff" },
        { label: "写 IOPS", value: i.write == null ? "-" : i.write, color: "#e6a23c" },
        { label: "总 IOPS", value: i.total == null ? "-" : i.total },
      ];
    },
    throughputRows() {
      const t = this.d.throughput || {};
      return [
        { label: "读吞吐", value: t.read, color: "#409eff" },
        { label: "写吞吐", value: t.write, color: "#e6a23c" },
      ];
    },
    latencyRows() {
      const l = this.d.latency || {};
      return [
        { label: "读延迟", value: `${this.num(l.readMs)} ms` },
        { label: "写延迟", value: `${this.num(l.writeMs)} ms` },
        { label: "P99 延迟", value: `${this.num(l.p99Ms)} ms`, color: "#e6a23c" },
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
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    num(v) {
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
      const t = this.d.trend || {};
      this.chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["读 IOPS", "写 IOPS"], right: 10 },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: { type: "value" },
        series: [
          { name: "读 IOPS", type: "line", smooth: true, areaStyle: { opacity: 0.15 },
            showSymbol: false, data: t.readIops || [] },
          { name: "写 IOPS", type: "line", smooth: true, areaStyle: { opacity: 0.15 },
            showSymbol: false, data: t.writeIops || [] },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getStoragePerformance(this.deviceId);
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
  height: @chart-h-sm;
  width: 100%;
}
</style>
