<template>
  <div v-loading="loading" class="tab-screen">
    <SectionCard dense title="趋势" icon="TrendCharts" class="row-tables fill">
      <template #extra>最近 {{ (d.times || []).length }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getEssTrend } from "@/api/monitor-ess";

applyChartTheme(echarts);

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const chartRef = ref(null);
let chart = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const v = d.value;
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["充电状态 SOC %", "健康度 SOH %", "功率 kW"], right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: v.times || [] },
    yAxis: [
      { type: "value", name: "%", min: 0, max: 100 },
      { type: "value", name: "kW" },
    ],
    series: [
      {
        name: "充电状态 SOC %", type: "line", smooth: true,
        showSymbol: false, data: v.soc || [],
      },
      {
        name: "健康度 SOH %", type: "line", smooth: true,
        showSymbol: false, data: v.soh || [],
      },
      {
        name: "功率 kW", type: "line", smooth: true, yAxisIndex: 1,
        showSymbol: false, data: v.powerKw || [],
      },
    ],
  }, true);
};

const rerenderChart = () => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  renderChart();
};
useChartSkin(rerenderChart);

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getEssTrend(props.deviceId);
    data.value = res.content || {};
    await nextTick();
    renderChart();
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
onBeforeUnmount(() => {
  chart && chart.dispose();
  chart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.row-tables {
  flex: 1;
  min-height: 0;
}
.trend-chart {
  height: @chart-h-md;
  min-height: @chart-h-md;
  width: 100%;
}
</style>
