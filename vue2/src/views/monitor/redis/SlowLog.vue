<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-timer" label="慢日志总数" :value="d.total == null ? '-' : d.total"
          sub="条记录" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-time" label="平均耗时" :value="d.avgTime || '-'"
          :sub="avgSub" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-warning-outline" label="最大耗时" :value="d.maxTime || '-'"
          :sub="maxSub" color="#f56c6c" />
      </el-col>
    </el-row>

    <SectionCard title="慢日志列表" icon="el-icon-timer">
      <template #extra>最近 {{ logCount }} 条记录</template>
      <el-empty v-if="d.total === 0" description="暂无慢日志记录" />
      <div v-for="(log, i) in d.logs || []" :key="log.id" class="log-card">
        <div class="log-card__head">
          <span class="log-card__seq">#{{ i + 1 }}</span>
          <span class="log-card__id">ID: <b>{{ log.id }}</b></span>
          <span class="log-card__time"><i class="el-icon-time"></i> {{ log.time }}</span>
          <el-tag size="small" type="warning" effect="plain" class="log-card__cost">
            {{ log.costMs }}
          </el-tag>
        </div>
        <div class="log-card__cmd">
          <div class="log-card__cmd-label">命令:</div>
          <div class="log-card__cmd-text">{{ log.command }}</div>
        </div>
        <el-row :gutter="16" class="log-card__body">
          <el-col :xs="24" :sm="12">
            <div class="log-meta">
              <div class="log-meta__title"><i class="el-icon-user"></i> 客户端信息</div>
              <div class="log-meta__row">
                <span class="log-meta__label">IP:</span>
                <span class="log-meta__value">{{ log.clientIp || "-" }}</span>
              </div>
              <div class="log-meta__row">
                <span class="log-meta__label">名称:</span>
                <span class="log-meta__value">{{ log.clientName || "未命名" }}</span>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="log-meta">
              <div class="log-meta__title"><i class="el-icon-data-line"></i> 耗时占比</div>
              <div class="log-meta__ratio-label">相对最大值:</div>
              <el-progress :percentage="clamp(log.ratio)" :stroke-width="8"
                :color="ratioColor(log.ratio)" />
            </div>
          </el-col>
        </el-row>
      </div>
    </SectionCard>

    <SectionCard title="慢日志说明" icon="el-icon-data-line">
      <el-row :gutter="16">
        <el-col v-for="f in logDesc" :key="f.label" :xs="24" :sm="12" :lg="8">
          <div class="log-desc">
            <div class="log-desc__label">{{ f.label }}</div>
            <div class="log-desc__text">{{ f.text }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisSlowlog } from "@/api/monitor-redis";

export default {
  name: "RedisSlowLog",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    logCount() {
      return (this.d.logs && this.d.logs.length) || 0;
    },
    avgSub() {
      return this.d.avgTimeUs == null ? "" : `${this.d.avgTimeUs} μs`;
    },
    maxSub() {
      return this.d.maxTimeUs == null ? "" : `${this.d.maxTimeUs} μs`;
    },
    logDesc() {
      return [
        { label: "慢日志阈值", text: "超过配置阈值的命令会被记录到慢日志" },
        { label: "执行时间", text: "命令从开始到结束的总耗时（微秒）" },
        { label: "客户端信息", text: "执行命令的客户端IP和名称" },
        { label: "性能优化", text: "分析慢日志可以帮助优化Redis性能" },
        { label: "时间单位", text: "微秒(μs)与毫秒(ms)，1ms = 1000μs" },
        { label: "颜色标识", text: "耗时占比越高颜色越偏红色预警" },
      ];
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    ratioColor(v) {
      const r = Number(v) || 0;
      return r > 80 ? "#f56c6c" : r > 50 ? "#e6a23c" : "#409eff";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getRedisSlowlog(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.log-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 14px;
  background: #fafafa;
  &:last-child {
    margin-bottom: 0;
  }
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  &__seq {
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    background: #409eff;
    border-radius: 4px;
    padding: 2px 8px;
    margin-right: 10px;
  }
  &__id {
    font-size: 13px;
    color: #606266;
    margin-right: 16px;
    b {
      color: #303133;
    }
  }
  &__time {
    font-size: 12px;
    color: #909399;
    i {
      margin-right: 4px;
    }
  }
  &__cost {
    margin-left: auto;
  }
  &__cmd {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 12px;
  }
  &__cmd-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }
  &__cmd-text {
    font-size: 13px;
    color: #303133;
    font-family: Consolas, Monaco, monospace;
    word-break: break-all;
  }
}
.log-meta {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
  height: 100%;
  box-sizing: border-box;
  &__title {
    font-size: 12px;
    color: #909399;
    margin-bottom: 10px;
    i {
      margin-right: 4px;
    }
  }
  &__row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    line-height: 1.9;
  }
  &__label {
    color: #909399;
  }
  &__value {
    color: #303133;
    font-weight: 500;
  }
  &__ratio-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
}
.log-desc {
  padding: 12px 14px;
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  margin-bottom: 12px;
  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  &__text {
    font-size: 12px;
    color: #909399;
  }
}
</style>
