<template>
  <screen-page title="线程池指标" gap="8px" v-loading="loading">
    <template #header-extra>
      <el-button
        size="small"
        icon="el-icon-refresh"
        :loading="loading"
        @click="init"
      >
        重新加载
      </el-button>
    </template>

    <section-card
      dense
      scrollable
      class="fill"
      title="线程池"
      icon="el-icon-cpu"
    >
      <card-grid min="260px" gap="8px">
        <div
          v-for="metric in metrics"
          :key="metric.type"
          class="pool-card"
        >
          <div class="pool-card__title">{{ formatThreadType(metric.type, "label") }}</div>
          <div class="pool-card__rows">
            <div class="pool-row">
              <span class="pool-row__label">活跃线程数</span>
              <span class="pool-row__value">{{ metric.activeThreadCount }}</span>
            </div>
            <div class="pool-row">
              <span class="pool-row__label">总任务数</span>
              <span class="pool-row__value">{{ metric.totalTaskCount }}</span>
            </div>
            <div class="pool-row">
              <span class="pool-row__label">已处理任务数</span>
              <span class="pool-row__value">{{ metric.completedTaskCount }}</span>
            </div>
            <div class="pool-row">
              <span class="pool-row__label">队列任务数</span>
              <span class="pool-row__value">{{ metric.queueSize }}</span>
            </div>
          </div>
        </div>
      </card-grid>
    </section-card>
  </screen-page>
</template>

<script>
import { getSystemThreadMetrics } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";

// 线程池指标类型 (原 src/utils/index THREAD_POOL_METRICS_TYPE)
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

function enumValueOf(e, value) {
  for (const key in e) {
    const val = e[key];
    if (val && val.value === value) {
      return val;
    }
  }
  return {};
}

export default {
  name: "ThreadMetrics",
  components: { ScreenPage, SectionCard, CardGrid },
  data() {
    return {
      loading: false,
      metrics: [],
    };
  },
  created() {
    this.init();
  },
  methods: {
    async init() {
      this.loading = true;
      try {
        const res = await getSystemThreadMetrics();
        this.metrics = res.content || [];
      } finally {
        this.loading = false;
      }
    },
    formatThreadType(type, field) {
      return enumValueOf(THREAD_POOL_METRICS_TYPE, type)[field];
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.pool-card {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: @radius-base;
  padding: @space-md;
  background: var(--cm-bg-card, @bg-card);

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-bottom: @space-sm;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: @space-xs;
  }
}

.pool-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;

  &__label {
    color: var(--cm-text-regular, @text-regular);
  }

  &__value {
    color: #1890ff;
    font-weight: 600;
  }
}
</style>
