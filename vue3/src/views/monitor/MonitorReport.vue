<template>
  <ScreenPage v-loading="loading" title="运维报告" gap="8px" class="report-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(天)</span>
        <el-input-number v-model="windowDays" :min="1" :max="365" size="small"
          :controls="false" style="width: 90px" />
        <el-button type="primary" size="small" :icon="DocumentChecked" @click="load">生成报告</el-button>
        <el-button size="small" :icon="Download" @click="exportReport('md')">导出Markdown</el-button>
        <el-button size="small" :icon="Download" @click="exportReport('csv')">导出CSV</el-button>
        <el-button :icon="Refresh" size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <div v-if="generatedAt" class="meta-row">
      生成时间：{{ generatedAt }} ·　统计窗口：最近 {{ num(summary.windowDays) }} 天
    </div>

    <el-empty v-if="!hasData && !loading" description="点击「生成报告」获取数据" :image-size="80" />

    <template v-else>
      <!-- 资源 -->
      <SectionCard dense title="资源概览" icon="Monitor">
        <CardGrid min="200px" gap="8px">
          <StatCard dense icon="Box" label="设备总数" :value="num(overview.deviceStats?.total)"
            color="#409eff" />
          <StatCard dense icon="CircleCheckFilled" label="在线" :value="num(overview.deviceStats?.online)"
            :sub="`离线 ${num(overview.deviceStats?.offline)}`" color="#67c23a" />
          <StatCard dense icon="Odometer" label="健康评分" :value="num1(overview.healthScore)"
            :sub="overview.healthLevel || '-'" :color="healthColor(overview.healthScore)" />
        </CardGrid>
      </SectionCard>

      <!-- 告警 -->
      <SectionCard dense title="告警统计" icon="Bell">
        <CardGrid min="180px" gap="8px">
          <StatCard dense icon="Warning" label="活跃" :value="num(alert.activeTotal)" color="#e6a23c" />
          <StatCard dense icon="CircleCloseFilled" label="严重" :value="num(alert.critical)" color="#f56c6c" />
          <StatCard dense icon="WarningFilled" label="警告" :value="num(alert.warning)" color="#e6a23c" />
          <StatCard dense icon="CircleCheckFilled" label="已恢复" :value="num(alert.resolved)" color="#67c23a" />
          <StatCard dense icon="Select" label="已确认" :value="num(alert.acknowledged)" color="#409eff" />
        </CardGrid>
      </SectionCard>

      <!-- SLO -->
      <SectionCard dense title="SLO 可用率" icon="DataLine">
        <CardGrid min="200px" gap="8px">
          <StatCard dense icon="TrendCharts" label="平均可用率(%)" :value="pct(slo.avgAvailability)"
            :color="availColor(slo.avgAvailability)" />
          <StatCard dense icon="CircleCheckFilled" label="达标" :value="num(slo.metCount)" color="#67c23a" />
          <StatCard dense icon="CircleCloseFilled" label="未达标" :value="num(slo.breachedCount)" color="#f56c6c" />
        </CardGrid>
      </SectionCard>

      <!-- 容量 -->
      <SectionCard dense title="容量规划" icon="Histogram">
        <CardGrid min="200px" gap="8px">
          <StatCard dense icon="Warning" label="风险项数" :value="num(capacity.riskCount)"
            :color="capacity.riskCount > 0 ? '#e6a23c' : '#67c23a'" />
        </CardGrid>
      </SectionCard>

      <!-- 拨测 -->
      <SectionCard dense title="拨测合成监控" icon="Connection">
        <CardGrid min="200px" gap="8px">
          <StatCard dense icon="Aim" label="任务" :value="num(dialtest.taskTotal)" color="#409eff" />
          <StatCard dense icon="CircleCheckFilled" label="正常" :value="num(dialtest.up)" color="#67c23a" />
          <StatCard dense icon="CircleCloseFilled" label="异常" :value="num(dialtest.down)" color="#f56c6c" />
        </CardGrid>
      </SectionCard>
    </template>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Refresh, Download, DocumentChecked } from "@element-plus/icons-vue";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getReportSummary, getReportExportUrl } from "@/api/monitor-ops";

const loading = ref(false);
const windowDays = ref(7);
const summary = ref({});

const hasData = computed(() => !!summary.value && Object.keys(summary.value).length > 0);
const generatedAt = computed(() => summary.value.generatedAt || "");
const overview = computed(() => summary.value.overview || {});
const alert = computed(() => summary.value.alert || {});
const slo = computed(() => summary.value.slo || {});
const capacity = computed(() => summary.value.capacity || {});
const dialtest = computed(() => summary.value.dialtest || {});

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);
const num1 = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const pct = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));

const healthColor = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "#409eff";
  if (n >= 90) return "#67c23a";
  if (n >= 70) return "#e6a23c";
  return "#f56c6c";
};
const availColor = (v) => {
  const n = Number(v);
  if (n >= 99) return "#67c23a";
  if (n >= 90) return "#e6a23c";
  return "#f56c6c";
};

const load = async () => {
  loading.value = true;
  try {
    const res = await getReportSummary(windowDays.value);
    summary.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

const exportReport = (format) => {
  window.open(getReportExportUrl(format, windowDays.value));
};

onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;
}
.ctrl-label {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.meta-row {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--cm-text-secondary);
}
</style>
