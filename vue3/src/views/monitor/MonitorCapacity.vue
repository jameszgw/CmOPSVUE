<template>
  <ScreenPage v-loading="loading" title="容量规划" gap="8px" class="capacity-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(天)</span>
        <el-input-number v-model="windowDays" :min="1" :max="90" size="small"
          :controls="false" style="width: 80px" @change="loadSummary" />
        <el-button :icon="Refresh" size="small" :loading="loading" @click="loadSummary">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <CardGrid min="200px" gap="8px" class="row-stats">
      <StatCard dense icon="Warning" label="风险项数" :value="num(summary.riskCount)"
        :sub="`窗口 ${num(summary.windowDays)} 天`" color="#f56c6c" />
      <StatCard dense icon="Odometer" label="阈值" :value="`${num(summary.threshold)}%`"
        color="#e6a23c" />
    </CardGrid>

    <!-- 容量风险表 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="容量风险（最近触达优先）" icon="TrendCharts">
      <template #extra>共 {{ risks.length }} 项</template>
      <el-table class="dense-table" height="100%" :data="risks" size="small" stripe>
        <el-table-column prop="deviceName" label="设备" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="metricKey" label="指标" min-width="120" show-overflow-tooltip />
        <el-table-column label="当前值" width="110">
          <template #default="{ row }">
            <span class="val-strong">{{ num1(row.current) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="日增长" width="110">
          <template #default="{ row }">{{ num2(row.slopePerDay) }}</template>
        </el-table-column>
        <el-table-column label="预计触达" width="150">
          <template #default="{ row }">
            <span :style="{ color: daysColor(row.daysToThreshold) }">
              {{ daysLabel(row.daysToThreshold) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="projectedDate" label="预计日期" width="160" />
        <template #empty>
          <el-empty description="暂无容量风险" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>

    <!-- 容量预测查询 -->
    <SectionCard dense title="容量预测查询" icon="DataAnalysis" class="row-forecast">
      <div class="forecast-form">
        <el-input v-model="fDeviceId" placeholder="设备ID" size="small" style="width: 180px" />
        <el-input v-model="fMetricKey" placeholder="指标键（如 diskUsage）" size="small"
          style="width: 200px" />
        <el-input-number v-model="fThreshold" :min="1" :max="100" size="small"
          :controls="false" style="width: 100px" />
        <el-button type="primary" size="small" :loading="forecastLoading"
          :disabled="!fDeviceId" @click="loadForecast">预测</el-button>
        <span v-if="forecast.note" class="forecast-note" :class="{ breach: forecast.willBreachThreshold }">
          {{ forecast.note }}
        </span>
      </div>
    </SectionCard>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getCapacitySummary, getCapacityForecast } from "@/api/monitor-ops";

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "容器",
  MQ: "消息队列", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
};
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const loading = ref(false);
const windowDays = ref(7);
const data = ref({});

const summary = computed(() => data.value || {});
const risks = computed(() => summary.value.risks || []);

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);
const num1 = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const num2 = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));

const daysLabel = (d) => {
  if (d === undefined || d === null) return "-";
  const n = Number(d);
  if (n < 0) return "已超限";
  return `约 ${num1(n)} 天后`;
};
const daysColor = (d) => {
  const n = Number(d);
  if (Number.isNaN(n)) return "var(--cm-text-primary)";
  if (n < 0 || n <= 7) return "#f56c6c";
  if (n <= 30) return "#e6a23c";
  return "#67c23a";
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const res = await getCapacitySummary(windowDays.value);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

// ----- 预测查询 -----
const fDeviceId = ref("");
const fMetricKey = ref("diskUsage");
const fThreshold = ref(90);
const forecastLoading = ref(false);
const forecast = ref({});

const loadForecast = async () => {
  if (!fDeviceId.value) return;
  forecastLoading.value = true;
  try {
    const res = await getCapacityForecast(
      fDeviceId.value,
      fMetricKey.value || "diskUsage",
      windowDays.value,
      fThreshold.value
    );
    forecast.value = res.content || {};
    if (!forecast.value.hasData) ElMessage.info("该指标暂无足够数据");
  } finally {
    forecastLoading.value = false;
  }
};

onMounted(loadSummary);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats,
.row-forecast {
  flex-shrink: 0;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.ctrl-label {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.val-strong {
  font-weight: 600;
  color: var(--cm-text-primary);
}
.forecast-form {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;
}
.forecast-note {
  font-size: 13px;
  color: var(--cm-text-regular);
  &.breach {
    color: var(--cm-color-danger);
    font-weight: 600;
  }
}
</style>
