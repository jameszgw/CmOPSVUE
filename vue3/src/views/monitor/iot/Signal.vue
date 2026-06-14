<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard title="信号趋势" icon="TrendCharts">
      <template #extra>频段 {{ d.band ?? "-" }} · 底噪 {{ d.noiseFloor ?? "-" }} dBm</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>

    <SectionCard title="信道占用" icon="List">
      <el-empty v-if="!channels.length" description="暂无数据" />
      <el-table v-else :data="channels" size="small" stripe>
        <el-table-column prop="channel" label="信道" width="100" align="center">
          <template #default="{ row }">{{ row.channel ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="频率" min-width="120">
          <template #default="{ row }">{{ row.freq != null ? `${row.freq} MHz` : "-" }}</template>
        </el-table-column>
        <el-table-column label="占用率" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.occupancyPct)" :stroke-width="12"
              :color="pctColor(row.occupancyPct)" />
          </template>
        </el-table-column>
        <el-table-column prop="devices" label="设备数" width="100" align="center">
          <template #default="{ row }">{{ row.devices ?? 0 }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getIotSignal } from "@/api/monitor-iot";

applyChartTheme(echarts);

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const channels = computed(() => d.value.channels || []);
const chartRef = ref(null);
let chart = null;

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const v = d.value;
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["RSSI dBm", "占用率 %"], right: 10 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: v.times || [] },
    yAxis: [
      { type: "value", name: "dBm" },
      { type: "value", name: "%", min: 0, max: 100 },
    ],
    series: [
      {
        name: "RSSI dBm", type: "line", smooth: true, showSymbol: false,
        data: v.rssiSeries || [],
      },
      {
        name: "占用率 %", type: "line", smooth: true, showSymbol: false,
        yAxisIndex: 1, data: v.occupancySeries || [],
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
    const res = await getIotSignal(props.deviceId);
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
.trend-chart {
  height: 300px;
  width: 100%;
}
</style>
