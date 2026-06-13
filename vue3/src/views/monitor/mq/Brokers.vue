<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Box" label="Broker 总数" :value="d.total ?? 0"
          sub="节点总数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="CircleCheck" label="在线" :value="d.online ?? 0"
          sub="online 节点" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="CircleClose" label="离线" :value="d.offline ?? 0"
          sub="offline 节点" :color="countColor(d.offline)" />
      </el-col>
    </el-row>

    <SectionCard title="Broker 列表" icon="List">
      <template #extra>共 {{ (d.brokers || []).length }} 个节点</template>
      <el-empty v-if="!(d.brokers || []).length" description="暂无数据" />
      <el-table v-else :data="d.brokers || []" size="small" stripe>
        <el-table-column label="ID" width="80" align="center" fixed>
          <template #default="{ row }">{{ row.id ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="host" label="主机" min-width="150" fixed>
          <template #default="{ row }">
            <span class="broker-host">{{ row.host || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="IP" min-width="140">
          <template #default="{ row }">{{ row.ip || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Controller" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.controller" size="small" type="primary" effect="dark">主控</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="CPU%" width="150">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="10" :color="pctColor(row.cpuPct)" />
          </template>
        </el-table-column>
        <el-table-column label="内存%" width="150">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.memPct)" :stroke-width="10" :color="pctColor(row.memPct)" />
          </template>
        </el-table-column>
        <el-table-column label="磁盘%" width="150">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.diskPct)" :stroke-width="10" :color="pctColor(row.diskPct)" />
          </template>
        </el-table-column>
        <el-table-column label="Leader 分区" width="110" align="center">
          <template #default="{ row }">{{ row.leaderPartitions ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="ISR 收缩" width="100" align="center">
          <template #default="{ row }">{{ row.isrShrinks ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="副本不足" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: countColor(row.underReplicated) }">{{ row.underReplicated ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="刷盘延迟" width="110" align="right">
          <template #default="{ row }">{{ row.flushLatencyMs != null ? `${row.flushLatencyMs} ms` : "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getMqBrokers } from "@/api/monitor-mq";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const countColor = (v) => (Number(v) > 0 ? "#f56c6c" : "#67c23a");
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const statusColor = (s) => {
  if (["online", "up"].includes(s)) return "#67c23a";
  if (["warning", "degraded"].includes(s)) return "#e6a23c";
  if (["offline", "down", "failed"].includes(s)) return "#f56c6c";
  return "#909399";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getMqBrokers(props.deviceId);
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
.broker-host {
  font-family: monospace;
  color: #303133;
}
.plain-tag {
  border: none;
  color: #fff;
}
.muted {
  color: #909399;
}
</style>
