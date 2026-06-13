<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Histogram" label="上游总数" :value="d.total ?? '-'" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="CircleCheck" label="健康节点" :value="d.healthy ?? '-'"
          sub="状态正常的节点" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="WarningFilled" label="异常节点" :value="unhealthy"
          sub="状态异常的节点" :color="unhealthy ? '#f56c6c' : '#909399'" />
      </el-col>
    </el-row>

    <el-empty v-if="!upstreams.length" description="暂无上游数据" />

    <SectionCard v-for="up in upstreams" :key="up.name" :title="up.name" icon="Connection">
      <template #extra>
        健康 {{ up.healthy ?? "-" }} / {{ up.serverCount ?? "-" }}
      </template>
      <div class="up-overview">
        <div class="up-overview__item">
          <span class="up-overview__label">节点数</span>
          <span class="up-overview__value">{{ up.serverCount ?? "-" }}</span>
        </div>
        <div class="up-overview__item">
          <span class="up-overview__label">健康</span>
          <span class="up-overview__value" style="color:#67c23a">{{ up.healthy ?? "-" }}</span>
        </div>
        <div class="up-overview__item">
          <span class="up-overview__label">异常</span>
          <span class="up-overview__value" :style="{ color: up.unhealthy ? '#f56c6c' : '#303133' }">{{ up.unhealthy ?? "-" }}</span>
        </div>
        <div class="up-overview__item">
          <span class="up-overview__label">活动连接</span>
          <span class="up-overview__value">{{ up.activeConn ?? "-" }}</span>
        </div>
        <div class="up-overview__item">
          <span class="up-overview__label">平均响应</span>
          <span class="up-overview__value">{{ num(up.avgResponseMs) }} ms</span>
        </div>
      </div>

      <el-table :data="up.members || []" size="small" stripe>
        <el-table-column prop="server" label="节点" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTag(row.status)" effect="plain">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="90" />
        <el-table-column prop="activeConn" label="活动连接" width="100" />
        <el-table-column label="失败数" width="90">
          <template #default="{ row }">
            <span :style="{ color: row.fails ? '#f56c6c' : '#303133' }">{{ row.fails ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="响应时间" width="120">
          <template #default="{ row }">{{ num(row.responseMs) }} ms</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getLbUpstreams } from "@/api/monitor-lb";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const upstreams = computed(() => d.value.upstreams || []);
const unhealthy = computed(() => {
  const total = Number(d.value.total) || 0;
  const healthy = Number(d.value.healthy) || 0;
  return Math.max(0, total - healthy);
});

const statusText = (s) =>
  s === "up" || s === "active" ? "健康"
    : s === "down" || s === "offline" || s === "failed" ? "异常"
      : s === "degraded" ? "降级" : (s || "-");
const statusTag = (s) =>
  s === "down" || s === "offline" || s === "failed" ? "danger"
    : s === "degraded" || s === "near-full" ? "warning" : "success";

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getLbUpstreams(props.deviceId);
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
.up-overview {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 14px;
  &__item {
    display: flex;
    flex-direction: column;
  }
  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
  }
  &__value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}
</style>
