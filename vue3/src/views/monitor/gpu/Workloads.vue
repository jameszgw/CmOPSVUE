<template>
  <div v-loading="loading" class="screen-tab">
    <SectionCard title="推理服务" icon="MagicStick" dense scrollable bodyClass="dense-table fill" class="fill">
      <CardGrid min="220px" gap="8px" class="wl-stats">
        <StatCard icon="Files" label="模型数" :value="inf.modelCount ?? 0"
          sub="部署模型" color="#409eff" dense />
        <StatCard icon="Odometer" label="总 QPS" :value="inf.totalQps ?? 0"
          sub="请求/秒" color="#67c23a" dense />
        <StatCard icon="Timer" label="P99 延迟" :value="`${inf.avgLatencyP99 ?? '-'} ms`"
          :sub="`队列深度 ${inf.queueDepth ?? 0}`" color="#e6a23c" dense />
      </CardGrid>

      <el-empty v-if="!(inf.models || []).length" description="暂无模型" />
      <el-table v-else :data="inf.models || []" size="small" stripe class="dense-table" height="100%">
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

    <SectionCard v-if="showEdge" title="边缘节点" icon="Connection" dense scrollable bodyClass="dense-table fill" class="fill">
      <CardGrid min="220px" gap="8px" class="wl-stats">
        <StatCard icon="CircleCheck" label="在线" :value="edge.online ?? 0"
          sub="Online 节点" color="#67c23a" dense />
        <StatCard icon="CircleClose" label="离线" :value="edge.offline ?? 0"
          sub="Offline 节点" :color="(edge.offline || 0) > 0 ? '#f56c6c' : '#909399'" dense />
      </CardGrid>

      <el-empty v-if="!(edge.nodes || []).length" description="暂无节点" />
      <el-table v-else :data="edge.nodes || []" size="small" stripe class="dense-table" height="100%">
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
import CardGrid from "@/components/monitor/CardGrid.vue";
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
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
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
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
// 让卡片正文成为纵向 flex：上方 KPI 固定，下方表格填满并内部滚动
:deep(.section-card__body.fill) {
  display: flex;
  flex-direction: column;
}
.wl-stats {
  margin-bottom: 8px;
  flex-shrink: 0;
}
:deep(.section-card__body.fill .el-table) {
  flex: 1;
  min-height: 0;
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
</style>
