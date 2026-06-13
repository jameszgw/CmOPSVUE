<template>
  <div v-loading="loading" class="page-container">
    <!-- ① 健康评分 + 统计卡 -->
    <el-row :gutter="12">
      <el-col :xs="24" :lg="8">
        <SectionCard title="系统健康评分" icon="Odometer">
          <template #extra>{{ d.healthLevel || "-" }}</template>
          <div ref="gaugeRef" class="gauge-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-row :gutter="12" class="stat-row">
          <el-col :xs="24" :sm="12">
            <StatCard icon="Monitor" label="设备总数" :value="num(ds.total)"
              :sub="`在线 ${num(ds.online)} / 离线 ${num(ds.offline)}`" color="#409eff" />
          </el-col>
          <el-col :xs="24" :sm="12">
            <StatCard icon="CircleCheck" label="在线设备" :value="num(ds.online)"
              :sub="`共 ${num(ds.total)} 台`" color="#67c23a" />
          </el-col>
          <el-col :xs="24" :sm="12">
            <StatCard icon="Bell" label="活跃告警" :value="num(as.active)"
              :sub="`严重 ${num(as.critical)} / 警告 ${num(as.warning)}`" color="#e6a23c" />
          </el-col>
          <el-col :xs="24" :sm="12">
            <StatCard icon="Warning" label="严重告警" :value="num(as.critical)"
              :sub="`警告 ${num(as.warning)}`" color="#f56c6c" />
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- ② 设备类型分布饼图 + 告警趋势折线 -->
    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="设备类型分布" icon="PieChart">
          <div ref="pieRef" class="trend-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="告警趋势" icon="TrendCharts">
          <template #extra>最近 {{ as.trend?.times?.length || 0 }} 个数据点</template>
          <div ref="trendRef" class="trend-chart"></div>
        </SectionCard>
      </el-col>
    </el-row>

    <!-- ③ 资源水位概览 -->
    <SectionCard title="资源水位概览" icon="DataAnalysis">
      <el-row :gutter="12">
        <el-col v-for="r in resourceRows" :key="r.label" :xs="24" :sm="12" :lg="6">
          <div class="resource-item">
            <div class="resource-item__label">
              <span>{{ r.label }}</span>
              <span class="resource-item__value">{{ num(r.value) }}%</span>
            </div>
            <el-progress :percentage="clamp(r.value)" :color="r.color" :stroke-width="10" :show-text="false" />
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <!-- ④ 问题设备 Top -->
    <SectionCard title="问题设备 Top" icon="WarnTriangleFilled">
      <el-table :data="d.topProblems || []" size="small" stripe>
        <el-table-column prop="deviceName" label="设备" min-width="160" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c">{{ num(row.critical) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="警告" width="100">
          <template #default="{ row }">
            <span style="color: #e6a23c">{{ num(row.warning) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="topIssue" label="主要问题" min-width="200" />
      </el-table>
      <el-empty v-if="!(d.topProblems && d.topProblems.length)" description="暂无问题设备" :image-size="80" />
    </SectionCard>

    <!-- ⑤ 最近告警 -->
    <SectionCard title="最近告警" icon="Bell">
      <el-table :data="d.recentAlerts || []" size="small" stripe>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag size="small" :color="levelColor(row.level)" effect="dark" style="border: none; color: #fff">
              {{ row.levelText || levelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备" min-width="150" />
        <el-table-column prop="metricLabel" label="指标" width="140" />
        <el-table-column prop="message" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="firstTime" label="首次时间" width="180" />
      </el-table>
      <el-empty v-if="!(d.recentAlerts && d.recentAlerts.length)" description="暂无告警" :image-size="80" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getDashboardSummary } from "@/api/monitor-dashboard";

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
  if (!gaugeChart) gaugeChart = echarts.init(gaugeRef.value);
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
  if (!pieChart) pieChart = echarts.init(pieRef.value);
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
  if (!trendChart) trendChart = echarts.init(trendRef.value);
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
.page-container {
  padding: 16px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.gauge-chart {
  height: 240px;
  width: 100%;
}
.trend-chart {
  height: 280px;
  width: 100%;
}
.resource-item {
  padding: 8px 4px 12px;

  &__label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
  }

  &__value {
    font-weight: 600;
    color: #303133;
  }
}
</style>
