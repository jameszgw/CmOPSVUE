<template>
  <div v-loading="loading" class="tab-screen">
    <SectionCard dense title="趋势" icon="TrendCharts" class="row-mid">
      <template #extra>最近 {{ trend.times?.length || 0 }} 个数据点</template>
      <el-empty v-if="!(trend.times || []).length" description="暂无数据" />
      <div v-show="(trend.times || []).length" ref="chartRef" class="trend-chart"></div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getSbcTrend } from "@/api/monitor-sbc";

applyChartTheme(echarts);

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const trend = computed(() => data.value || {});
const chartRef = ref(null);
let chart = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const t = trend.value;
  chart.setOption(
    {
      tooltip: { trigger: "axis" },
      legend: { data: ["SoC温度", "CPU使用率", "供电电压"], right: 10 },
      grid: { left: 50, right: 55, top: 40, bottom: 30 },
      xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
      yAxis: [
        { type: "value", name: "°C / %" },
        { type: "value", name: "V" },
      ],
      series: [
        {
          name: "SoC温度", type: "line", smooth: true, showSymbol: false,
          areaStyle: { opacity: 0.12 }, data: t.socTemp || [],
        },
        {
          name: "CPU使用率", type: "line", smooth: true, showSymbol: false,
          data: t.cpuUsage || [],
        },
        {
          name: "供电电压", type: "line", smooth: true, showSymbol: false,
          yAxisIndex: 1, data: t.supplyVoltage || [],
        },
      ],
    },
    true
  );
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
    const res = await getSbcTrend(props.deviceId);
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
