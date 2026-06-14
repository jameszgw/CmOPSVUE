<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-connection" label="频段" :value="val(d.band)"
          sub="工作频段" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-mic" label="噪声底" :value="`${num0(d.noiseFloor)} dBm`"
          sub="Noise Floor" color="#e6a23c" />
      </el-col>
    </el-row>

    <SectionCard title="信号趋势" icon="el-icon-data-line">
      <template #extra>最近 {{ trendPoints }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>

    <SectionCard title="信道占用" icon="el-icon-menu">
      <template #extra>共 {{ channels.length }} 个信道</template>
      <el-empty v-if="!channels.length" description="暂无数据" />
      <el-table v-else :data="channels" size="small" stripe>
        <el-table-column label="信道" width="120">
          <template slot-scope="{ row }">{{ val(row.channel) }}</template>
        </el-table-column>
        <el-table-column label="频率" width="140">
          <template slot-scope="{ row }">{{ val(row.freq) }}</template>
        </el-table-column>
        <el-table-column label="占用率" min-width="200">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.occupancyPct)" :stroke-width="10"
              :color="pctColor(row.occupancyPct)" />
          </template>
        </el-table-column>
        <el-table-column label="设备数" width="110" align="center">
          <template slot-scope="{ row }">{{ num0(row.devices) }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getIotSignal } from "@/api/monitor-iot";

export default {
  name: "IotSignal",
  mixins: [chartSkin],
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, chart: null };
  },
  computed: {
    channels() {
      return this.d.channels || [];
    },
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
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
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
        legend: { data: ["信号 dBm", "占用率 %"], right: 10 },
        grid: { left: 50, right: 50, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: d.times || [] },
        yAxis: [
          { type: "value", name: "dBm" },
          { type: "value", name: "%", position: "right", min: 0, max: 100 },
        ],
        series: [
          {
            name: "信号 dBm",
            type: "line",
            smooth: true,
            showSymbol: false,
            data: d.rssiSeries || [],
          },
          {
            name: "占用率 %",
            type: "line",
            smooth: true,
            showSymbol: false,
            yAxisIndex: 1,
            areaStyle: { opacity: 0.15 },
            data: d.occupancySeries || [],
          },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getIotSignal(this.deviceId);
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
