<template>
  <div v-loading="loading" class="tab-screen">
    <CardGrid min="160px" gap="8px" class="row-stats">
      <StatCard dense icon="Top" label="今日充电" :value="`${num(d.todayChargeKwh)} kWh`"
        color="#67c23a" />
      <StatCard dense icon="Bottom" label="今日放电" :value="`${num(d.todayDischargeKwh)} kWh`"
        color="#e6a23c" />
      <StatCard dense icon="DataLine" label="吞吐量" :value="`${num(d.throughputKwh)} kWh`"
        color="#409eff" />
    </CardGrid>

    <SectionCard dense title="充放电曲线" icon="TrendCharts" class="row-mid">
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
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getEssChargeDischarge } from "@/api/monitor-ess";

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

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const v = d.value;
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["功率 kW", "SOC %"], right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: v.times || [] },
    yAxis: [
      { type: "value", name: "kW" },
      { type: "value", name: "SOC %", min: 0, max: 100 },
    ],
    series: [
      {
        name: "功率 kW", type: "line", smooth: true,
        areaStyle: { opacity: 0.15 }, showSymbol: false,
        data: v.powerKw || [],
      },
      {
        name: "SOC %", type: "line", smooth: true, yAxisIndex: 1,
        showSymbol: false, data: v.socPct || [],
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
    const res = await getEssChargeDischarge(props.deviceId);
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
.row-stats {
  flex-shrink: 0;
}
.row-mid {
  flex-shrink: 0;
}
.trend-chart {
  height: @chart-h-md;
  width: 100%;
}
</style>
