<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Timer" label="慢日志总数" :value="fmt(d.total)"
          sub="记录条数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Clock" label="平均耗时" :value="d.avgTime ?? '-'"
          :sub="d.avgTimeUs != null ? `${d.avgTimeUs} μs` : ''" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Histogram" label="最大耗时" :value="d.maxTime ?? '-'"
          :sub="d.maxTimeUs != null ? `${d.maxTimeUs} μs` : ''" color="#f56c6c" />
      </el-col>
    </el-row>

    <SectionCard title="慢日志列表" icon="List">
      <template #extra>最近 {{ (d.logs || []).length }} 条记录</template>
      <el-empty v-if="!Number(d.total)" description="暂无慢日志记录" :image-size="100" />
      <div v-else>
        <div v-for="(log, i) in d.logs || []" :key="log.id ?? i" class="log-card">
          <div class="log-card__head">
            <span class="log-card__no">#{{ i + 1 }}</span>
            <span class="log-card__id">ID: <b>{{ log.id }}</b></span>
            <span class="log-card__time">
              <el-icon><Clock /></el-icon>{{ log.time }}
            </span>
            <el-tag size="small" type="warning" effect="plain" class="log-card__cost">
              {{ log.costMs != null ? `${log.costMs}ms` : log.costUs != null ? `${log.costUs}μs` : "-" }}
            </el-tag>
          </div>
          <div class="log-card__cmd">
            <div class="log-card__cmd-label">命令:</div>
            <div class="log-card__cmd-text">{{ log.command || "-" }}</div>
          </div>
          <el-row :gutter="16" class="log-card__foot">
            <el-col :xs="24" :sm="12">
              <div class="log-card__client">
                <div class="log-card__client-title">
                  <el-icon><User /></el-icon>客户端信息
                </div>
                <div class="log-card__client-row">IP: <b>{{ log.clientIp || "-" }}</b></div>
                <div class="log-card__client-row">名称: <b>{{ log.clientName || "未命名" }}</b></div>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12">
              <div class="log-card__ratio">
                <div class="log-card__ratio-title">
                  <el-icon><TrendCharts /></el-icon>耗时占比
                </div>
                <div class="log-card__ratio-bar">
                  <span class="log-card__ratio-label">相对最大值:</span>
                  <el-progress :percentage="clamp(log.ratio)" :stroke-width="10"
                    :color="ratioColor(log.ratio)" />
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="慢日志说明" icon="InfoFilled">
      <el-row :gutter="12">
        <el-col v-for="doc in slowlogDocs" :key="doc.key" :xs="24" :sm="12" :lg="8">
          <div class="doc-item">
            <div class="doc-item__title">{{ doc.key }}</div>
            <div class="doc-item__text">{{ doc.text }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getRedisSlowlog } from "@/api/monitor-redis";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const fmt = (v) =>
  typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v ?? "-";
const ratioColor = (v) => {
  const r = Number(v) || 0;
  return r > 80 ? "#f56c6c" : r > 50 ? "#e6a23c" : "#409eff";
};

const slowlogDocs = [
  { key: "慢日志阈值", text: "超过配置阈值的命令会被记录到慢日志" },
  { key: "执行时间", text: "命令从开始到结束的总耗时（微秒）" },
  { key: "客户端信息", text: "执行命令的客户端IP和名称" },
  { key: "性能优化", text: "分析慢日志可以帮助优化Redis性能" },
  { key: "时间单位", text: "耗时以微秒（μs）和毫秒（ms）展示" },
  { key: "颜色标识", text: "耗时占比越高，进度条颜色越偏向红色" },
];

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getRedisSlowlog(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.log-card {
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }
  &__no {
    font-size: 13px;
    font-weight: 600;
    color: #909399;
  }
  &__id {
    font-size: 13px;
    color: #606266;
    b {
      color: #303133;
    }
  }
  &__time {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #909399;
    .el-icon {
      margin-right: 4px;
    }
  }
  &__cost {
    margin-left: auto;
  }
  &__cmd {
    background: #fafafa;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 12px;
    &-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }
    &-text {
      font-size: 13px;
      color: #303133;
      word-break: break-all;
      font-family: Consolas, Monaco, monospace;
    }
  }
  &__client,
  &__ratio {
    &-title {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: #606266;
      margin-bottom: 8px;
      .el-icon {
        margin-right: 4px;
      }
    }
    &-row {
      font-size: 13px;
      color: #606266;
      line-height: 1.9;
      b {
        color: #303133;
      }
    }
  }
  &__ratio-bar {
    display: flex;
    align-items: center;
    :deep(.el-progress) {
      flex: 1;
    }
  }
  &__ratio-label {
    font-size: 12px;
    color: #909399;
    margin-right: 8px;
    white-space: nowrap;
  }
}
.doc-item {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  &__text {
    font-size: 12px;
    color: #909399;
    line-height: 1.6;
  }
}
</style>
