<template>
  <ScreenPage v-loading="loading" title="日志检索" gap="8px" class="logsearch-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(分)</span>
        <el-input-number v-model="windowMin" :min="5" :max="1440" size="small"
          :controls="false" style="width: 90px" @change="loadStats" />
        <el-button :icon="Refresh" size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <CardGrid min="200px" gap="8px" class="row-stats">
      <StatCard dense icon="Tickets" label="总数" :value="num(stats.total)"
        :sub="`窗口 ${num(stats.windowMin)} 分钟`" color="#409eff" />
      <StatCard dense icon="CircleCloseFilled" label="错误" :value="num(stats.error)"
        color="#f56c6c" />
      <StatCard dense icon="WarningFilled" label="警告" :value="num(stats.warn)"
        color="#e6a23c" />
      <StatCard dense icon="InfoFilled" label="信息" :value="num(stats.info)"
        color="#909399" />
    </CardGrid>

    <!-- 日志表 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="日志检索" icon="Document">
      <template #extra>
        <div class="filter-row">
          <el-input v-model="filterDeviceId" placeholder="设备ID" size="small" clearable
            style="width: 140px" @keyup.enter="load" />
          <el-select v-model="filterLevel" size="small" style="width: 110px" @change="load">
            <el-option label="全部" value="" />
            <el-option label="ERROR" value="ERROR" />
            <el-option label="WARN" value="WARN" />
            <el-option label="INFO" value="INFO" />
            <el-option label="DEBUG" value="DEBUG" />
          </el-select>
          <el-input v-model="filterKeyword" placeholder="关键字" size="small" clearable
            style="width: 160px" @keyup.enter="load" />
          <el-button type="primary" size="small" @click="load">查询</el-button>
          <span class="total-tag">共 {{ total }} 条</span>
        </div>
      </template>
      <el-table class="dense-table" height="100%" :data="items" size="small" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="deviceName" label="设备" min-width="140" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" min-width="120" show-overflow-tooltip />
        <el-table-column label="级别" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="levelType(row.level)" effect="dark">
              {{ row.level || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="log-content">{{ row.content }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无日志记录" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getLogSearch, getLogStats } from "@/api/monitor-ops";

const loading = ref(false);
const windowMin = ref(60);
const stats = ref({});
const data = ref({});

const filterDeviceId = ref("");
const filterLevel = ref("");
const filterKeyword = ref("");

const items = computed(() => data.value.items || []);
const total = computed(() => data.value.total ?? items.value.length);

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);

const levelType = (l) => {
  const k = String(l || "").toUpperCase();
  if (k === "ERROR") return "danger";
  if (k === "WARN" || k === "WARNING") return "warning";
  if (k === "INFO") return "primary";
  return "info";
};

const loadStats = async () => {
  try {
    const res = await getLogStats(windowMin.value);
    stats.value = res.content || {};
  } catch (e) {
    stats.value = {};
  }
};

const loadSearch = async () => {
  loading.value = true;
  try {
    const res = await getLogSearch({
      deviceId: filterDeviceId.value || undefined,
      level: filterLevel.value || undefined,
      keyword: filterKeyword.value || undefined,
      limit: 200,
    });
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

const load = async () => {
  await Promise.all([loadStats(), loadSearch()]);
};

onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats {
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
.filter-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.total-tag {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.log-content {
  white-space: normal;
  word-break: break-all;
}
</style>
