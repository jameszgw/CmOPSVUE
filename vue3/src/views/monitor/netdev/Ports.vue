<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Connection" label="端口总数" :value="d.total ?? 0"
        sub="物理端口数" color="#409eff" dense />
      <StatCard icon="CircleCheck" label="在线端口" :value="d.up ?? 0"
        sub="Up 端口" color="#67c23a" dense />
      <StatCard icon="WarningFilled" label="错误端口" :value="d.errorPorts ?? 0"
        sub="存在错误的端口" color="#f56c6c" dense />
    </CardGrid>

    <SectionCard title="端口列表" icon="List" dense scrollable bodyClass="dense-table fill" class="fill">
      <template #extra>共 {{ (d.ports || []).length }} 个端口</template>
      <el-empty v-if="!(d.ports || []).length" description="暂无数据" />
      <el-table v-else :data="d.ports || []" size="small" stripe :row-class-name="rowClass"
        class="dense-table" height="100%">
        <el-table-column prop="name" label="端口" min-width="140" fixed>
          <template #default="{ row }">
            <span class="port-name">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="速率" width="110">
          <template #default="{ row }">{{ row.speed || "-" }}</template>
        </el-table-column>
        <el-table-column label="双工" width="100">
          <template #default="{ row }">{{ row.duplex || "-" }}</template>
        </el-table-column>
        <el-table-column label="利用率" width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.utilizationPct)" :stroke-width="10"
              :color="pctColor(row.utilizationPct)" />
          </template>
        </el-table-column>
        <el-table-column label="入速率" width="110">
          <template #default="{ row }">{{ row.inRate || "-" }}</template>
        </el-table-column>
        <el-table-column label="出速率" width="110">
          <template #default="{ row }">{{ row.outRate || "-" }}</template>
        </el-table-column>
        <el-table-column label="入错误" width="90" align="center">
          <template #default="{ row }">
            <span :class="{ 'err-val': (row.inErrors || 0) > 0 }">{{ row.inErrors ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出错误" width="90" align="center">
          <template #default="{ row }">
            <span :class="{ 'err-val': (row.outErrors || 0) > 0 }">{{ row.outErrors ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="CRC 错误" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'err-val': (row.crcErrors || 0) > 0 }">{{ row.crcErrors ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="丢包率" width="100" align="center">
          <template #default="{ row }">{{ num(row.dropsPct) }}%</template>
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
import { getNetDevPorts } from "@/api/monitor-netdev";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const statusColor = (s) => {
  if (["up", "online", "normal", "active", "Up", "Online"].includes(s)) return "#67c23a";
  if (["near-full", "degraded", "warning", "Warning"].includes(s)) return "#e6a23c";
  if (["down", "offline", "failed", "Down", "Offline", "Failed"].includes(s)) return "#f56c6c";
  return "#909399";
};
const rowClass = ({ row }) => (row.hasError ? "row-error" : "");

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getNetDevPorts(props.deviceId);
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
.port-name {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
.err-val {
  color: var(--cm-color-danger);
  font-weight: 600;
}
:deep(.row-error) {
  --el-table-tr-bg-color: var(--cm-danger-soft);
  color: var(--cm-color-danger);
}
</style>
