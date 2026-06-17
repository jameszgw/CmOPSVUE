<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="240px" gap="8px" class="stat-grid">
      <StatCard dense icon="Coin" label="内存使用率" :value="`${num(d.usage)}%`"
        :percent="d.usage" :sub="usageSub" color="#409eff" />
      <StatCard dense icon="TrendCharts" label="内存峰值" :value="d.peak ?? '-'"
        sub="历史最高使用量" color="#e6a23c" />
      <StatCard dense icon="PieChart" label="内存碎片率" :value="num(d.fragRatio)"
        :tag="fragTag" color="#909399" />
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="内存使用详情" icon="Coin">
        <InfoTable :rows="detailRows" :columns="2" />
      </SectionCard>

      <SectionCard dense title="内存策略配置" icon="SetUp">
        <InfoTable :rows="policyRows" :columns="2" />
        <div class="policy-desc">
          <div class="policy-desc__title">
            <el-icon><InfoFilled /></el-icon>
            <span>内存淘汰策略说明</span>
          </div>
          <ul class="policy-desc__list">
            <li v-for="p in evictionDocs" :key="p.key">
              <b>{{ p.key }}:</b> {{ p.text }}
            </li>
          </ul>
        </div>
      </SectionCard>

      <SectionCard dense title="内存使用趋势" icon="TrendCharts" class="span-all">
        <template #extra>最近 {{ d.trend?.times?.length || 0 }} 个数据点</template>
        <div ref="chartRef" class="trend-chart"></div>
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
applyChartTheme(echarts);
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getRedisMemory } from "@/api/monitor-redis";

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

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));

const usageSub = computed(() => {
  const dt = d.value.detail || {};
  if (dt.usedMemory == null && dt.totalSystemMemory == null) return "";
  return `${dt.usedMemory ?? "-"} / ${dt.totalSystemMemory ?? "-"}`;
});

const fragTag = computed(() => {
  const r = Number(d.value.fragRatio);
  if (!r) return "";
  if (r > 1.5) return "偏高";
  if (r < 1) return "良好";
  return "普通";
});

const detailRows = computed(() => {
  const t = d.value.detail || {};
  return [
    { label: "已使用内存", value: t.usedMemory, color: "#409eff" },
    { label: "数据集内存", value: t.datasetMemory },
    { label: "RSS内存", value: t.rssMemory },
    { label: "分配器已分配", value: t.allocatorAllocated },
    { label: "内存峰值", value: t.peakMemory, color: "#e6a23c" },
    { label: "分配器活跃", value: t.allocatorActive },
    { label: "系统总内存", value: t.totalSystemMemory },
    { label: "内存碎片率", value: t.fragRatio != null ? Number(t.fragRatio).toFixed(2) : "-" },
  ];
});

const policyRows = computed(() => {
  const p = d.value.policy || {};
  return [
    { label: "最大内存限制", value: p.maxMemory ?? "0B", tag: p.maxMemoryDesc },
    { label: "内存淘汰策略", value: p.evictionPolicy, color: "#409eff" },
  ];
});

const evictionDocs = [
  { key: "noeviction", text: "不淘汰，内存满时返回错误" },
  { key: "allkeys-lru", text: "从所有键中淘汰最近最少使用的键" },
  { key: "volatile-lru", text: "从设置了过期时间的键中淘汰最近最少使用的键" },
  { key: "allkeys-random", text: "从所有键中随机淘汰" },
  { key: "volatile-random", text: "从设置了过期时间的键中随机淘汰" },
  { key: "volatile-ttl", text: "淘汰即将过期的键（TTL最小）" },
];

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const t = d.value.trend || {};
  chart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value}%" } },
    series: [
      {
        name: "内存使用率",
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0.15 },
        showSymbol: false,
        data: t.values || [],
      },
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
  loading.value = true;
  try {
    const res = await getRedisMemory(props.deviceId);
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.stat-grid {
  flex-shrink: 0;
}
.body-grid {
  flex: 1;
  min-height: 0;
  align-content: start;
  overflow: auto;
}
.span-all {
  grid-column: 1 / -1;
}
.policy-desc {
  margin-top: 12px;
  background: var(--cm-bg-muted);
  border-radius: 6px;
  padding: 14px 16px;
  &__title {
    display: flex;
    align-items: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-regular);
    margin-bottom: 10px;
    .el-icon {
      color: var(--cm-color-warning);
      margin-right: 6px;
    }
  }
  &__list {
    margin: 0;
    padding-left: 4px;
    list-style: none;
    li {
      font-size: 12px;
      color: var(--cm-text-secondary);
      line-height: 1.9;
      b {
        color: var(--cm-text-regular);
      }
    }
  }
}
.trend-chart {
  height: @chart-h-md;
  width: 100%;
}
</style>
