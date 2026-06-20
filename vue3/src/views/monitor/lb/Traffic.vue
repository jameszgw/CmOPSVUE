<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="TrendCharts" label="QPS" :value="num(d.qps)" color="#409eff" dense />
      <StatCard icon="Timer" label="P99 延迟" :value="`${num(latency.p99)} ms`"
        :sub="`最大 ${num(latency.max)} ms`" color="#e6a23c" dense />
      <StatCard icon="Top" label="入流量速率" :value="bytes.inRate || '-'"
        :sub="`累计入 ${bytes.totalIn || '-'}`" color="#67c23a" dense />
      <StatCard icon="Bottom" label="出流量速率" :value="bytes.outRate || '-'"
        :sub="`累计出 ${bytes.totalOut || '-'}`" color="#909399" dense />
    </CardGrid>

    <SectionCard title="流量趋势" icon="TrendCharts" dense class="fill">
      <template #extra>最近 {{ trend.times?.length || 0 }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>

    <CardGrid min="300px" gap="8px">
      <SectionCard title="状态码分布" icon="PieChart" dense>
        <div v-for="item in statusList" :key="item.key" class="dist-row">
          <span class="dist-row__dot" :style="{ background: item.color }"></span>
          <span class="dist-row__label">{{ item.label }}</span>
          <el-progress :percentage="item.percent" :stroke-width="12"
            :color="item.color" :show-text="false" class="dist-row__bar" />
          <span class="dist-row__num">{{ item.percent }}%</span>
        </div>
      </SectionCard>
      <SectionCard title="延迟分布" icon="Timer" dense>
        <InfoTable :rows="latencyRows" />
      </SectionCard>
    </CardGrid>

    <SectionCard title="流量统计" icon="DataLine" dense>
      <InfoTable :rows="bytesRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getLbTraffic } from "@/api/monitor-lb";

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
const pct = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));

const trend = computed(() => d.value.trend || {});
const statusDist = computed(() => d.value.statusDist || {});
const latency = computed(() => d.value.latency || {});
const bytes = computed(() => d.value.bytes || {});

const statusList = computed(() => {
  const s = statusDist.value;
  return [
    { key: "c2xx", label: "2xx", percent: pct(s.c2xx), color: "#67c23a" },
    { key: "c3xx", label: "3xx", percent: pct(s.c3xx), color: "#409eff" },
    { key: "c4xx", label: "4xx", percent: pct(s.c4xx), color: "#e6a23c" },
    { key: "c5xx", label: "5xx", percent: pct(s.c5xx), color: "#f56c6c" },
  ];
});

const latencyRows = computed(() => {
  const x = latency.value;
  return [
    { label: "P50", value: `${num(x.p50)} ms` },
    { label: "P90", value: `${num(x.p90)} ms` },
    { label: "P99", value: `${num(x.p99)} ms`, color: "#e6a23c" },
    { label: "最大", value: `${num(x.max)} ms`, color: "#f56c6c" },
  ];
});

const bytesRows = computed(() => {
  const x = bytes.value;
  return [
    { label: "入流量速率", value: x.inRate ?? "-" },
    { label: "出流量速率", value: x.outRate ?? "-" },
    { label: "累计入流量", value: x.totalIn ?? "-" },
    { label: "累计出流量", value: x.totalOut ?? "-" },
  ];
});

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const t = trend.value;
  const hasLatency = Array.isArray(t.latency) && t.latency.length > 0;
  const series = [
    {
      name: "QPS", type: "line", smooth: true, areaStyle: { opacity: 0.15 },
      showSymbol: false, data: t.qps || [],
    },
  ];
  if (hasLatency) {
    series.push({
      name: "延迟 ms", type: "line", smooth: true, yAxisIndex: 1,
      showSymbol: false, data: t.latency || [],
    });
  }
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: hasLatency ? ["QPS", "延迟 ms"] : ["QPS"], right: 10 },
    grid: { left: 50, right: hasLatency ? 50 : 20, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
    yAxis: hasLatency
      ? [{ type: "value", name: "QPS" }, { type: "value", name: "ms" }]
      : { type: "value" },
    series,
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
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getLbTraffic(props.deviceId);
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
.dist-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
    width: 44px;
    flex-shrink: 0;
  }
  &__bar {
    flex: 1;
  }
  &__num {
    margin-left: 10px;
    font-size: 13px;
    color: var(--cm-text-primary);
    white-space: nowrap;
    width: 44px;
    text-align: right;
  }
}
</style>
