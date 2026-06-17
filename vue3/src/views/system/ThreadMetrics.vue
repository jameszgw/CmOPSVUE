<template>
  <ScreenPage title="线程池指标" gap="8px">
    <template #header-extra>
      <el-button size="small" :loading="loading" @click="init">
        <el-icon style="margin-right: 4px"><Refresh /></el-icon>
        重新加载
      </el-button>
    </template>

    <div v-loading="loading" class="metrics-body">
      <el-empty v-if="!metrics.length" description="暂无数据" :image-size="60" />
      <CardGrid v-else min="260px" gap="8px" class="metrics-grid">
        <SectionCard
          v-for="metric in metrics"
          :key="metric.type"
          dense
          :title="formatThreadType(metric.type)"
          icon="Cpu"
        >
          <div class="metric-rows">
            <div class="metric-row">
              <span class="metric-label">活跃线程数</span>
              <span class="metric-value">{{ metric.activeThreadCount }} 个</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">总任务数</span>
              <span class="metric-value">{{ metric.totalTaskCount }} 个</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">已处理任务数</span>
              <span class="metric-value">{{ metric.completedTaskCount }} 个</span>
            </div>
            <div class="metric-row">
              <span class="metric-label">队列任务数</span>
              <span class="metric-value">{{ metric.queueSize }} 个</span>
            </div>
          </div>
        </SectionCard>
      </CardGrid>
    </div>
  </ScreenPage>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getSystemThreadMetrics } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";

// 线程池指标类型 (对齐原 React 版 THREAD_POOL_METRICS_TYPE)
const THREAD_POOL_METRICS_TYPE = {
  TERMINAL: { value: 10, label: "远程终端线程池" },
  TERMINAL_WATCHER: { value: 15, label: "终端监视线程池" },
  EXEC: { value: 20, label: "批量执行线程池" },
  TAIL: { value: 30, label: "文件追踪线程池" },
  SFTP_TRANSFER_RATE: { value: 40, label: "传输进度线程池" },
  SFTP_UPLOAD: { value: 50, label: "文件上传线程池" },
  SFTP_DOWNLOAD: { value: 60, label: "文件下载线程池" },
  SFTP_PACKAGE: { value: 70, label: "文件打包线程池" },
  APP_BUILD: { value: 80, label: "应用构建线程池" },
  RELEASE_MAIN: { value: 90, label: "应用发布主线程池" },
  RELEASE_MACHINE: { value: 100, label: "应用发布机器线程池" },
  SCHEDULER_TASK_MAIN: { value: 110, label: "调度任务主线程池" },
  SCHEDULER_TASK_MACHINE: { value: 120, label: "调度任务机器线程池" },
  PIPELINE: { value: 130, label: "应用流水线线程池" },
};

const loading = ref(false);
const metrics = ref([]);

const formatThreadType = (type) => {
  const matched = Object.values(THREAD_POOL_METRICS_TYPE).find(
    // eslint-disable-next-line eqeqeq
    (item) => item.value == type
  );
  return matched ? matched.label : String(type);
};

const init = async () => {
  loading.value = true;
  try {
    const res = await getSystemThreadMetrics();
    metrics.value = res.content || [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  init();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.metrics-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.metrics-grid {
  align-content: start;
}

.metric-rows {
  display: flex;
  flex-direction: column;
  gap: @space-sm;
}

.metric-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.metric-label {
  color: var(--cm-text-regular);
}

.metric-value {
  color: var(--cm-color-primary);
  font-weight: 500;
}
</style>
