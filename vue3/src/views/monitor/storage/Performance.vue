<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Odometer" label="总 IOPS" :value="kfmt(d.iops?.total)"
        :sub="`读 ${kfmt(d.iops?.read)} / 写 ${kfmt(d.iops?.write)}`" color="#409eff" dense />
      <StatCard icon="Histogram" label="缓存命中率" :value="`${num(d.cacheHitRate)}%`"
        :percent="d.cacheHitRate" color="#67c23a" dense />
      <StatCard icon="Files" label="队列深度" :value="d.queueDepth ?? '-'"
        sub="IO 队列深度" color="#e6a23c" dense />
    </CardGrid>

    <CardGrid min="300px" gap="8px">
      <SectionCard title="IOPS" icon="Odometer" dense>
        <InfoTable :rows="iopsRows" />
      </SectionCard>
      <SectionCard title="吞吐" icon="DataLine" dense>
        <InfoTable :rows="throughputRows" />
      </SectionCard>
      <SectionCard title="延迟" icon="Timer" dense>
        <InfoTable :rows="latencyRows" />
      </SectionCard>
    </CardGrid>

    <SectionCard title="IOPS 趋势图" icon="TrendCharts" dense>
      <template #extra>最近 {{ d.trend?.times?.length || 0 }} 个数据点</template>
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
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStoragePerformance } from "@/api/monitor-storage";

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

const num = (v) => (v === undefined || v === null || v === "" ? "-" : Number(v).toFixed(1));
const kfmt = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return `${n}`;
};

const iopsRows = computed(() => {
  const o = d.value.iops || {};
  return [
    { label: "读 IOPS", value: kfmt(o.read), color: "#67c23a" },
    { label: "写 IOPS", value: kfmt(o.write), color: "#409eff" },
    { label: "总 IOPS", value: kfmt(o.total) },
  ];
});
const throughputRows = computed(() => {
  const o = d.value.throughput || {};
  return [
    { label: "读吞吐", value: o.read || "-", color: "#67c23a" },
    { label: "写吞吐", value: o.write || "-", color: "#409eff" },
  ];
});
const latencyRows = computed(() => {
  const o = d.value.latency || {};
  return [
    { label: "读延迟", value: `${num(o.readMs)} ms` },
    { label: "写延迟", value: `${num(o.writeMs)} ms` },
    { label: "P99 延迟", value: `${num(o.p99Ms)} ms`, color: "#e6a23c" },
  ];
});

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const t = d.value.trend || {};
  chart.setOption({
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
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getStoragePerformance(props.deviceId);
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

.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.trend-chart {
  height: @chart-h-md;
  width: 100%;
}
</style>
