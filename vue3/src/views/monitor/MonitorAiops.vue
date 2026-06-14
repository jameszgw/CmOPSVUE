<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="aiops-tabs">
      <!-- 异常检测 -->
      <el-tab-pane label="异常检测" name="anomaly">
        <div v-loading="anomalyLoading" class="tab-pane">
          <el-row :gutter="12" class="stat-row">
            <el-col :xs="24" :sm="8">
              <StatCard icon="Warning" label="异常总数" :value="num0(an.total)" color="#409eff" />
            </el-col>
            <el-col :xs="24" :sm="8">
              <StatCard icon="CircleClose" label="严重" :value="num0(an.critical)" color="#f56c6c" />
            </el-col>
            <el-col :xs="24" :sm="8">
              <StatCard icon="WarningFilled" label="警告" :value="num0(an.warning)" color="#e6a23c" />
            </el-col>
          </el-row>

          <SectionCard title="异常检测列表" icon="DataAnalysis">
            <template #extra>共 {{ anomalies.length }} 条</template>
            <el-empty v-if="!anomalies.length" description="暂无异常" />
            <el-table v-else :data="anomalies" size="small" stripe>
              <el-table-column prop="deviceName" label="设备" min-width="140" />
              <el-table-column label="类型" width="110">
                <template #default="{ row }">{{ typeLabel(row.deviceType) }}</template>
              </el-table-column>
              <el-table-column prop="metricLabel" label="指标" min-width="120" />
              <el-table-column label="当前值" width="120">
                <template #default="{ row }">{{ fmtVal(row.currentValue, row.unit) }}</template>
              </el-table-column>
              <el-table-column label="基线" width="120">
                <template #default="{ row }">{{ fmtVal(row.baseline, row.unit) }}</template>
              </el-table-column>
              <el-table-column label="偏离" width="100">
                <template #default="{ row }">
                  <span :style="{ color: devColor(row.deviation) }">{{ num1(row.deviation) }}%</span>
                </template>
              </el-table-column>
              <el-table-column label="级别" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="sevType(row.severity)" effect="dark">
                    {{ row.severityText || row.severity }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="detectedTime" label="检测时间" width="180" />
              <el-table-column prop="method" label="方法" min-width="120" />
            </el-table>
          </SectionCard>
        </div>
      </el-tab-pane>

      <!-- 成本优化 -->
      <el-tab-pane label="成本优化" name="cost">
        <div v-loading="costLoading" class="tab-pane">
          <el-row :gutter="12" class="stat-row">
            <el-col :xs="24" :sm="12" :lg="6">
              <StatCard icon="Money" label="月度成本" :value="cost.totalMonthlyCost || '-'" color="#409eff" />
            </el-col>
            <el-col :xs="24" :sm="12" :lg="6">
              <StatCard icon="Wallet" label="可节省" :value="cost.potentialSavings || '-'" color="#67c23a" />
            </el-col>
            <el-col :xs="24" :sm="12" :lg="6">
              <StatCard icon="PieChart" label="节省占比" :value="`${num1(cost.savingsPct)}%`" color="#e6a23c" />
            </el-col>
            <el-col :xs="24" :sm="12" :lg="6">
              <StatCard icon="Box" label="闲置项" :value="num0(cost.idleCount)" color="#909399" />
            </el-col>
          </el-row>

          <SectionCard title="资源利用率" icon="Histogram">
            <el-empty v-if="!utilization.length" description="暂无数据" />
            <el-row v-else :gutter="12">
              <el-col v-for="(u, i) in utilization" :key="i" :xs="24" :sm="12" :lg="8">
                <div class="util-item">
                  <div class="util-item__head">
                    <span class="util-item__type">{{ typeLabel(u.type) }}</span>
                    <span class="util-item__waste">浪费 {{ u.wasteCost || '-' }}</span>
                  </div>
                  <el-progress :percentage="clamp(u.avgUtil)" :stroke-width="10"
                    :color="utilColor(u.avgUtil)" />
                </div>
              </el-col>
            </el-row>
          </SectionCard>

          <SectionCard title="容量预测" icon="TrendCharts">
            <template #extra>{{ forecastNote }}</template>
            <div ref="chartRef" class="forecast-chart"></div>
          </SectionCard>

          <SectionCard title="闲置资源" icon="Delete">
            <template #extra>共 {{ idleResources.length }} 项</template>
            <el-empty v-if="!idleResources.length" description="暂无闲置资源" />
            <el-table v-else :data="idleResources" size="small" stripe>
              <el-table-column prop="deviceName" label="设备" min-width="140" />
              <el-table-column label="类型" width="110">
                <template #default="{ row }">{{ typeLabel(row.type) }}</template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" min-width="140" />
              <el-table-column prop="idleMetric" label="闲置" min-width="120" />
              <el-table-column prop="monthlyCost" label="月成本" width="110" />
              <el-table-column label="可节省" width="110">
                <template #default="{ row }">
                  <span style="color: #67c23a">{{ row.potentialSaving || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="recommendation" label="建议" min-width="200" />
            </el-table>
          </SectionCard>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAiopsAnomalies, getAiopsCost } from "@/api/monitor-aiops";

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "容器",
  MQ: "消息队列", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
};
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const activeTab = ref("anomaly");
const anomalyLoading = ref(false);
const costLoading = ref(false);
const anomalyData = ref({});
const costData = ref({});

const an = computed(() => anomalyData.value || {});
const cost = computed(() => costData.value || {});
const anomalies = computed(() => an.value.anomalies || []);
const utilization = computed(() => cost.value.utilizationByType || []);
const idleResources = computed(() => cost.value.idleResources || []);
const forecastNote = computed(() => {
  const days = cost.value.forecast?.fullInDays;
  return days === undefined || days === null ? "" : `预计 ${days} 天后达上限`;
});

const num0 = (v) => (v === undefined || v === null ? "-" : Number(v));
const num1 = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const fmtVal = (v, unit) => (v === undefined || v === null ? "-" : `${v}${unit || ""}`);
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));

const devColor = (v) => {
  const n = Number(v);
  if (n > 150) return "#f56c6c";
  if (n > 80) return "#e6a23c";
  return "#303133";
};
const utilColor = (v) => {
  const n = Number(v) || 0;
  if (n < 30) return "#f56c6c";
  if (n < 60) return "#e6a23c";
  return "#67c23a";
};
const sevType = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "critical" || k === "high") return "danger";
  if (k === "warning" || k === "medium") return "warning";
  return "success";
};

const chartRef = ref(null);
let chart = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  const f = cost.value.forecast || {};
  chart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["实际", "预测"], right: 10 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: f.times || [] },
    yAxis: { type: "value" },
    series: [
      { name: "实际", type: "line", smooth: true, showSymbol: false,
        areaStyle: { opacity: 0.12 }, data: f.actual || [] },
      { name: "预测", type: "line", smooth: true, showSymbol: false,
        lineStyle: { type: "dashed" }, data: f.predicted || [] },
    ],
  });
};

const loadAnomalies = async () => {
  anomalyLoading.value = true;
  try {
    const res = await getAiopsAnomalies();
    anomalyData.value = res.content || {};
  } finally {
    anomalyLoading.value = false;
  }
};

const loadCost = async () => {
  costLoading.value = true;
  try {
    const res = await getAiopsCost();
    costData.value = res.content || {};
    await nextTick();
    renderChart();
  } finally {
    costLoading.value = false;
  }
};

const loadAll = () => {
  loadAnomalies();
  loadCost();
};

let timer = null;
onMounted(() => {
  loadAll();
  timer = setInterval(loadAll, 5000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
  chart && chart.dispose();
  chart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.page-container {
  padding: 16px;
}
.aiops-tabs {
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  padding: 0 16px 8px;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.forecast-chart {
  height: 300px;
  width: 100%;
}
.util-item {
  border: 1px solid var(--cm-border-light);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__type {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
  &__waste {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
}
</style>
