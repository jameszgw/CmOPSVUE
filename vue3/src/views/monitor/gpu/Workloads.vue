<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard title="推理服务" icon="MagicStick">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="8">
          <StatCard icon="Files" label="模型数" :value="inf.modelCount ?? 0"
            sub="部署模型" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="Odometer" label="总 QPS" :value="inf.totalQps ?? 0"
            sub="请求/秒" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="Timer" label="P99 延迟" :value="`${inf.avgLatencyP99 ?? '-'} ms`"
            :sub="`队列深度 ${inf.queueDepth ?? 0}`" color="#e6a23c" />
        </el-col>
      </el-row>

      <el-empty v-if="!(inf.models || []).length" description="暂无模型" />
      <el-table v-else :data="inf.models || []" size="small" stripe>
        <el-table-column prop="name" label="模型名称" min-width="180">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="副本数" width="100" align="center">
          <template #default="{ row }">{{ row.replicas ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="QPS" width="100" align="right">
          <template #default="{ row }">{{ row.qps ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="P99 延迟" width="120" align="right">
          <template #default="{ row }">{{ row.latencyP99Ms != null ? `${row.latencyP99Ms} ms` : "-" }}</template>
        </el-table-column>
        <el-table-column label="显存" width="120" align="right">
          <template #default="{ row }">{{ row.gpuMemMB != null ? `${row.gpuMemMB} MB` : "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <SectionCard v-if="showEdge" title="边缘节点" icon="Connection">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12">
          <StatCard icon="CircleCheck" label="在线" :value="edge.online ?? 0"
            sub="Online 节点" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="12">
          <StatCard icon="CircleClose" label="离线" :value="edge.offline ?? 0"
            sub="Offline 节点" :color="(edge.offline || 0) > 0 ? '#f56c6c' : '#909399'" />
        </el-col>
      </el-row>

      <el-empty v-if="!(edge.nodes || []).length" description="暂无节点" />
      <el-table v-else :data="edge.nodes || []" size="small" stripe>
        <el-table-column prop="name" label="节点名称" min-width="160">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="140">
          <template #default="{ row }">{{ row.location || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="延迟" width="110" align="right">
          <template #default="{ row }">{{ row.latencyMs != null ? `${row.latencyMs} ms` : "-" }}</template>
        </el-table-column>
        <el-table-column label="GPU 利用率" width="130" align="center">
          <template #default="{ row }">{{ row.gpuUtil != null ? `${row.gpuUtil}%` : "-" }}</template>
        </el-table-column>
        <el-table-column label="最近心跳" min-width="160">
          <template #default="{ row }">{{ row.lastHeartbeat || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getGpuWorkloads } from "@/api/monitor-gpu";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const inf = computed(() => d.value.inference || {});
const edge = computed(() => d.value.edge || {});
const showEdge = computed(() => d.value.isEdge || (edge.value.nodeTotal || 0) > 0);

const statusColor = (s) => {
  if (["online", "Online", "Running", "Ready", "Healthy", "active"].includes(s)) return "#67c23a";
  if (["Pending", "Warning", "degraded"].includes(s)) return "#e6a23c";
  if (["offline", "Offline", "Failed", "Unhealthy", "down"].includes(s)) return "#f56c6c";
  return "#909399";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getGpuWorkloads(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
</style>
