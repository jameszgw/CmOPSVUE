<template>
  <div v-loading="loading" class="tab-screen">
    <SectionCard dense class="row-mid" title="电能趋势" icon="TrendCharts">
      <template #extra>最近 {{ trend.times?.length || 0 }} 个数据点</template>
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
import { getPowerTrend } from "@/api/monitor-power";

applyChartTheme(echarts);

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const trend = computed(() => d.value || {});
const chartRef = ref(null);
let chart = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const t = trend.value;
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["负载率%", "有功功率kW", "电能kWh"], right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
    yAxis: [
      { type: "value", name: "%/kW" },
      { type: "value", name: "kWh" },
    ],
    series: [
      { name: "负载率%", type: "line", smooth: true, showSymbol: false, data: t.loadPct || [] },
      { name: "有功功率kW", type: "line", smooth: true, showSymbol: false, data: t.activePowerKw || [] },
      { name: "电能kWh", type: "line", smooth: true, showSymbol: false, yAxisIndex: 1, data: t.energyKwh || [] },
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
    const res = await getPowerTrend(props.deviceId);
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
.row-mid {
  flex-shrink: 0;
}
.trend-chart {
  height: @chart-h-md;
  width: 100%;
}
</style>
