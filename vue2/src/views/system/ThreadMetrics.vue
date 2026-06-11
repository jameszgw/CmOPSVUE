<template>
  <div class="page-container">
    <el-card>
      <div class="thread-metrics-container" v-loading="loading">
        <div class="other-title">线程池指标</div>
        <div class="thread-metrics-descriptions">
          <el-descriptions :column="1">
            <el-descriptions-item
              v-for="metric in metrics"
              :key="metric.type"
              :label="formatThreadType(metric.type, 'label')"
            >
              <div class="thread-pool-metrics-wrapper">
                <span class="metrics-label">活跃线程数: </span>
                <span class="metrics-value-wrapper">
                  <span class="metrics-value">{{ metric.activeThreadCount }}</span> 个
                </span>
                <span class="metrics-label">总任务数: </span>
                <span class="metrics-value-wrapper">
                  <span class="metrics-value">{{ metric.totalTaskCount }}</span> 个
                </span>
                <span class="metrics-label">已处理任务数: </span>
                <span class="metrics-value-wrapper">
                  <span class="metrics-value">{{ metric.completedTaskCount }}</span> 个
                </span>
                <span class="metrics-label">队列任务数: </span>
                <span class="metrics-value-wrapper">
                  <span class="metrics-value">{{ metric.queueSize }}</span> 个
                </span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="thread-metrics-handler-container">
          <el-button
            class="reload-button"
            icon="el-icon-refresh"
            :loading="loading"
            @click="init"
          >
            重新加载
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { getSystemThreadMetrics } from "@/api/system";

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
.thread-metrics-container {
  .other-title {
    margin: 16px 0 16px 16px;
    font-weight: 500;
    font-size: 16px;
  }

  .thread-metrics-descriptions {
    margin: 18px 0 0 0;

    /deep/ .el-descriptions-item__label {
      margin-left: 16px;
      width: 145px;
      text-align: end;
    }
  }

  .thread-pool-metrics-wrapper {
    margin-left: 8px;
    font-size: 13px;
  }

  .metrics-value-wrapper {
    margin-right: 8px;
    width: 48px;
    display: inline-block;

    .metrics-value {
      color: #1890ff;
    }
  }

  .reload-button {
    margin: 8px 0 24px 18px;
  }
}
</style>
