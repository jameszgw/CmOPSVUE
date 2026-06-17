<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-odometer" label="QPS"
        :value="d.qps == null ? '-' : d.qps" sub="每秒请求数" color="#409eff" />
      <StatCard dense icon="el-icon-timer" label="P99 延迟"
        :value="latency.p99 == null ? '-' : `${num(latency.p99)} ms`"
        :sub="`P50 ${num(latency.p50)} ms`" color="#e6a23c" />
      <StatCard dense icon="el-icon-upload2" label="入站速率"
        :value="bytes.inRate == null ? '-' : bytes.inRate"
        :sub="`总入 ${bytes.totalIn == null ? '-' : bytes.totalIn}`" color="#67c23a" />
      <StatCard dense icon="el-icon-download" label="出站速率"
        :value="bytes.outRate == null ? '-' : bytes.outRate"
        :sub="`总出 ${bytes.totalOut == null ? '-' : bytes.totalOut}`" color="#909399" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense title="流量趋势" icon="el-icon-data-line">
        <template #extra>最近 {{ trendPoints }} 个数据点</template>
        <div ref="chartRef" class="trend-chart"></div>
      </SectionCard>

      <SectionCard dense scrollable title="状态码分布" icon="el-icon-pie-chart">
        <div v-for="it in statusItems" :key="it.key" class="status-item">
          <div class="status-item__head">
            <span class="status-item__dot" :style="{ background: it.color }"></span>
            <span class="status-item__label">{{ it.label }}</span>
            <span class="status-item__val">{{ num(it.value) }}%</span>
          </div>
          <el-progress :percentage="clamp(it.value)" :stroke-width="10"
            :color="it.color" :show-text="false" />
        </div>
      </SectionCard>

      <SectionCard dense scrollable title="延迟分布" icon="el-icon-timer">
        <InfoTable :rows="latencyRows" />
      </SectionCard>

      <SectionCard dense scrollable title="流量统计" icon="el-icon-data-analysis">
        <InfoTable :rows="bytesRows" :columns="2" />
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
import { getLbTraffic } from "@/api/monitor-lb";

export default {
  name: "LbTraffic",
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
    trend() {
      return this.d.trend || {};
    },
    latency() {
      return this.d.latency || {};
    },
    bytes() {
      return this.d.bytes || {};
    },
    statusDist() {
      return this.d.statusDist || {};
    },
    trendPoints() {
      return (this.trend.times && this.trend.times.length) || 0;
    },
    statusItems() {
      const s = this.statusDist;
      return [
        { key: "c2xx", label: "2xx", value: s.c2xx, color: "#67c23a" },
        { key: "c3xx", label: "3xx", value: s.c3xx, color: "#409eff" },
        { key: "c4xx", label: "4xx", value: s.c4xx, color: "#e6a23c" },
        { key: "c5xx", label: "5xx", value: s.c5xx, color: "#f56c6c" },
      ];
    },
    latencyRows() {
      const l = this.latency;
      return [
        { label: "P50 延迟", value: l.p50 == null ? "-" : `${this.num(l.p50)} ms`, color: "#67c23a" },
        { label: "P90 延迟", value: l.p90 == null ? "-" : `${this.num(l.p90)} ms`, color: "#409eff" },
        { label: "P99 延迟", value: l.p99 == null ? "-" : `${this.num(l.p99)} ms`, color: "#e6a23c" },
        { label: "最大延迟", value: l.max == null ? "-" : `${this.num(l.max)} ms`, color: "#f56c6c" },
      ];
    },
    bytesRows() {
      const b = this.bytes;
      return [
        { label: "入站速率", value: b.inRate, color: "#67c23a" },
        { label: "出站速率", value: b.outRate, color: "#409eff" },
        { label: "总入流量", value: b.totalIn },
        { label: "总出流量", value: b.totalOut },
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
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
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
      const t = this.trend;
      const hasLatency = Array.isArray(t.latency) && t.latency.length > 0;
      const legend = ["QPS"];
      const series = [
        {
          name: "QPS",
          type: "line",
          smooth: true,
          areaStyle: { opacity: 0.15 },
          showSymbol: false,
          data: t.qps || [],
        },
      ];
      const yAxis = [{ type: "value", name: "QPS" }];
      if (hasLatency) {
        legend.push("延迟 ms");
        yAxis.push({ type: "value", name: "ms", position: "right" });
        series.push({
          name: "延迟 ms",
          type: "line",
          smooth: true,
          showSymbol: false,
          yAxisIndex: 1,
          data: t.latency || [],
        });
      }
      this.chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: legend, right: 10 },
        grid: { left: 50, right: 50, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis,
        series,
      });
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getLbTraffic(this.deviceId);
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
.status-item {
  margin-bottom: 16px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__val {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
}
</style>
