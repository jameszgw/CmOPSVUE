<template>
  <ScreenPage v-loading="loading" title="监控总览" gap="8px">
    <template #header-extra>
      <div class="src-tags">
        <span class="src-tags__label">采集来源：</span>
        <el-tag type="success" size="small">真实采集 {{ ds.agentCount || 0 }}</el-tag>
        <el-tag type="info" size="small">模拟数据 {{ ds.simulatedCount || 0 }}</el-tag>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <CardGrid min="220px" gap="8px" class="row-stats">
      <StatCard dense icon="Monitor" label="设备总数" :value="num(ds.total)"
        :sub="`在线 ${num(ds.online)} / 离线 ${num(ds.offline)}`" color="#409eff" />
      <StatCard dense icon="CircleCheck" label="在线设备" :value="num(ds.online)"
        :sub="`共 ${num(ds.total)} 台`" color="#67c23a" />
      <StatCard dense icon="Bell" label="活跃告警" :value="num(as.active)"
        :sub="`严重 ${num(as.critical)} / 警告 ${num(as.warning)}`" color="#e6a23c" />
      <StatCard dense icon="Warning" label="严重告警" :value="num(as.critical)"
        :sub="`警告 ${num(as.warning)}`" color="#f56c6c" />
    </CardGrid>

    <!-- 图表行：健康评分 + 设备分布 + 告警趋势 -->
    <CardGrid min="300px" gap="8px" class="row-charts">
      <SectionCard dense title="系统健康评分" icon="Odometer">
        <template #extra>{{ d.healthLevel || "-" }}</template>
        <div ref="gaugeRef" class="gauge-chart"></div>
      </SectionCard>
      <SectionCard dense title="设备类型分布" icon="PieChart">
        <div ref="pieRef" class="trend-chart"></div>
      </SectionCard>
      <SectionCard dense title="告警趋势" icon="TrendCharts">
        <template #extra>最近 {{ as.trend?.times?.length || 0 }} 个数据点</template>
        <div ref="trendRef" class="trend-chart"></div>
      </SectionCard>
    </CardGrid>

    <!-- 资源水位概览 -->
    <SectionCard dense title="资源水位概览" icon="DataAnalysis" class="row-resource">
      <CardGrid min="200px" gap="8px">
        <div v-for="r in resourceRows" :key="r.label" class="resource-item">
          <div class="resource-item__label">
            <span>{{ r.label }}</span>
            <span class="resource-item__value">{{ num(r.value) }}%</span>
          </div>
          <el-progress :percentage="clamp(r.value)" :color="r.color" :stroke-width="10" :show-text="false" />
        </div>
      </CardGrid>
    </SectionCard>

    <!-- 表格行：问题设备 + 最近告警，并排各自内部滚动 -->
    <CardGrid min="360px" gap="8px" class="row-tables fill">
      <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
        title="问题设备 Top" icon="WarnTriangleFilled">
        <el-table class="dense-table" height="100%" :data="d.topProblems || []" size="small" stripe>
          <el-table-column prop="deviceName" label="设备" min-width="140" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="严重" width="80">
            <template #default="{ row }">
              <span style="color: #f56c6c">{{ num(row.critical) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="警告" width="80">
            <template #default="{ row }">
              <span style="color: #e6a23c">{{ num(row.warning) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="topIssue" label="主要问题" min-width="160" show-overflow-tooltip />
          <template #empty>
            <el-empty description="暂无问题设备" :image-size="60" />
          </template>
        </el-table>
      </SectionCard>

      <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
        title="最近告警" icon="Bell">
        <el-table class="dense-table" height="100%" :data="d.recentAlerts || []" size="small" stripe>
          <el-table-column label="级别" width="80">
            <template #default="{ row }">
              <el-tag size="small" :color="levelColor(row.level)" effect="dark" style="border: none; color: #fff">
                {{ row.levelText || levelText(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deviceName" label="设备" min-width="130" />
          <el-table-column prop="metricLabel" label="指标" width="120" />
          <el-table-column prop="message" label="描述" min-width="180" show-overflow-tooltip />
          <el-table-column prop="firstTime" label="首次时间" width="160" />
          <template #empty>
            <el-empty description="暂无告警" :image-size="60" />
          </template>
        </el-table>
      </SectionCard>
    </CardGrid>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getDashboardSummary } from "@/api/monitor-dashboard";

applyChartTheme(echarts);

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const ds = computed(() => d.value.deviceStats || {});
const as = computed(() => d.value.alertStats || {});

const gaugeRef = ref(null);
const pieRef = ref(null);
const trendRef = ref(null);
let gaugeChart = null;
let pieChart = null;
let trendChart = null;
let timer = null;

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "容器",
  MQ: "消息队列", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
  POWER: "电能", ESS: "储能", IOT: "物联", SBC: "单板机", ANDROID: "安卓",
};

const num = (v) => (v === undefined || v === null ? "-" : v);
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const levelColor = (level) => {
  if (level === "critical") return "#f56c6c";
  if (level === "warning") return "#e6a23c";
  return "#67c23a";
};
const levelText = (level) =>
  level === "critical" ? "严重" : level === "warning" ? "警告" : "正常";

const healthColor = (score) => {
  const s = Number(score) || 0;
  if (s < 60) return "#f56c6c";
  if (s < 85) return "#e6a23c";
  return "#67c23a";
};

const resourceRows = computed(() => {
  const r = d.value.resource || {};
  return [
    { label: "平均 CPU", value: r.avgCpu, color: "#409eff" },
    { label: "平均内存", value: r.avgMemory, color: "#67c23a" },
    { label: "平均磁盘", value: r.avgDisk, color: "#e6a23c" },
    { label: "平均网络", value: r.avgNetwork, color: "#909399" },
  ];
});

const renderGauge = () => {
  if (!gaugeRef.value) return;
  if (!gaugeChart) gaugeChart = echarts.init(gaugeRef.value, currentChartTheme());
  const score = Number(d.value.healthScore) || 0;
  gaugeChart.setOption({
    series: [
      {
        type: "gauge",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        radius: "92%",
        center: ["50%", "58%"],
        axisLine: {
          lineStyle: {
            width: 14,
            color: [
              [0.6, "#f56c6c"],
              [0.85, "#e6a23c"],
              [1, "#67c23a"],
            ],
          },
        },
        pointer: { itemStyle: { color: healthColor(score) } },
        axisTick: { show: false },
        splitLine: { length: 12, lineStyle: { color: "#fff", width: 2 } },
        axisLabel: { distance: 18, color: "#909399", fontSize: 10 },
        detail: {
          valueAnimation: true,
          formatter: "{value}",
          color: healthColor(score),
          fontSize: 30,
          fontWeight: 700,
          offsetCenter: [0, "40%"],
        },
        data: [{ value: score }],
      },
    ],
  });
};

const renderPie = () => {
  if (!pieRef.value) return;
  if (!pieChart) pieChart = echarts.init(pieRef.value, currentChartTheme());
  const byType = ds.value.byType || {};
  const items = Object.keys(byType)
    .filter((k) => Number(byType[k]) > 0)
    .map((k) => ({ name: typeLabel(k), value: Number(byType[k]) }));
  pieChart.setOption({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { type: "scroll", orient: "vertical", right: 10, top: "middle", textStyle: { fontSize: 12 } },
    series: [
      {
        type: "pie",
        radius: ["40%", "68%"],
        center: ["38%", "52%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontWeight: "bold" } },
        data: items,
      },
    ],
  });
};

const renderTrend = () => {
  if (!trendRef.value) return;
  if (!trendChart) trendChart = echarts.init(trendRef.value, currentChartTheme());
  const t = as.value.trend || {};
  trendChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["严重", "警告"], right: 10 },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      { name: "严重", type: "line", smooth: true, showSymbol: false, itemStyle: { color: "#f56c6c" },
        areaStyle: { opacity: 0.12 }, data: t.critical || [] },
      { name: "警告", type: "line", smooth: true, showSymbol: false, itemStyle: { color: "#e6a23c" },
        areaStyle: { opacity: 0.12 }, data: t.warning || [] },
    ],
  });
};

const renderAll = () => {
  renderGauge();
  renderPie();
  renderTrend();
};

const rerenderAllCharts = () => {
  if (gaugeChart) {
    gaugeChart.dispose();
    gaugeChart = null;
  }
  if (pieChart) {
    pieChart.dispose();
    pieChart = null;
  }
  if (trendChart) {
    trendChart.dispose();
    trendChart = null;
  }
  renderAll();
};

useChartSkin(rerenderAllCharts);

const resizeAll = () => {
  gaugeChart && gaugeChart.resize();
  pieChart && pieChart.resize();
  trendChart && trendChart.resize();
};

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const res = await getDashboardSummary();
    data.value = res.content || {};
    await nextTick();
    renderAll();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
  timer = setInterval(() => load(true), 5000);
  window.addEventListener("resize", resizeAll);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
  window.removeEventListener("resize", resizeAll);
  gaugeChart && gaugeChart.dispose();
  pieChart && pieChart.dispose();
  trendChart && trendChart.dispose();
  gaugeChart = pieChart = trendChart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.src-tags {
  display: flex;
  align-items: center;
  gap: @space-sm;
  font-size: 13px;

  &__label {
    color: var(--cm-text-regular);
  }
}

// 各区块默认不收缩；表格行占据剩余空间并内部滚动
.row-stats,
.row-charts,
.row-resource {
  flex-shrink: 0;
}

.row-tables {
  flex: 1;
  min-height: 0;
}

.gauge-chart,
.trend-chart {
  height: @chart-h-sm;
  width: 100%;
}

.resource-item {
  padding: @space-xs @space-xs @space-sm;

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: var(--cm-text-regular);
    margin-bottom: @space-sm;
  }

  &__value {
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
</style>
