<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="TrendCharts" label="QPS" :value="num(d.qps)" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Timer" label="P99 延迟" :value="`${num(latency.p99)} ms`"
          :sub="`最大 ${num(latency.max)} ms`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Top" label="入流量速率" :value="bytes.inRate || '-'"
          :sub="`累计入 ${bytes.totalIn || '-'}`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Bottom" label="出流量速率" :value="bytes.outRate || '-'"
          :sub="`累计出 ${bytes.totalOut || '-'}`" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard title="流量趋势" icon="TrendCharts">
      <template #extra>最近 {{ trend.times?.length || 0 }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="状态码分布" icon="PieChart">
          <div v-for="item in statusList" :key="item.key" class="dist-row">
            <span class="dist-row__dot" :style="{ background: item.color }"></span>
            <span class="dist-row__label">{{ item.label }}</span>
            <el-progress :percentage="item.percent" :stroke-width="12"
              :color="item.color" :show-text="false" class="dist-row__bar" />
            <span class="dist-row__num">{{ item.percent }}%</span>
          </div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="延迟分布" icon="Timer">
          <InfoTable :rows="latencyRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="流量统计" icon="DataLine">
      <InfoTable :rows="bytesRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getLbTraffic } from "@/api/monitor-lb";

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
  if (!chart) chart = echarts.init(chartRef.value);
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

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
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
.dist-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    flex-shrink: 0;
  }
  &__label {
    font-size: 13px;
    color: #606266;
    width: 44px;
    flex-shrink: 0;
  }
  &__bar {
    flex: 1;
  }
  &__num {
    margin-left: 10px;
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
    width: 44px;
    text-align: right;
  }
}
</style>
