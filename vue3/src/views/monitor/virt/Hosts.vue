<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="240px" gap="8px" class="stat-grid">
      <StatCard dense icon="Monitor" label="宿主/节点" :value="d.total ?? 0" sub="节点总数" color="#7265e6" />
      <StatCard dense icon="CircleCheck" label="在线" :value="d.online ?? 0" sub="online 节点" color="#67c23a" />
      <StatCard dense icon="CircleClose" label="离线" :value="offline" sub="offline 节点" :color="countColor(offline)" />
    </CardGrid>

    <SectionCard dense title="宿主/节点列表" icon="List" class="span-all fill" scrollable bodyClass="dense-table fill">
      <template #extra>
        <el-tag size="small" :type="isReal ? 'success' : 'info'" style="margin-right: 6px">
          {{ isReal ? "真实采集" : "模拟数据" }}
        </el-tag>
        共 {{ (d.hosts || []).length }} 个节点
      </template>
      <el-empty v-if="!(d.hosts || []).length" description="暂无数据" :image-size="60" />
      <el-table v-else class="dense-table" height="100%" :data="d.hosts || []" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" fixed>
          <template #default="{ row }"><span class="mono">{{ row.name || "-" }}</span></template>
        </el-table-column>
        <el-table-column label="IP" min-width="130">
          <template #default="{ row }">{{ row.ip || row.connectionState || "-" }}</template>
        </el-table-column>
        <el-table-column label="角色" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ roleLabel(row.role || row.powerState) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status || row.connectionState)" effect="dark" class="plain-tag">
              {{ row.status || row.connectionState || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CPU 核" width="90" align="center">
          <template #default="{ row }">{{ row.cpuCores ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="CPU%" width="150">
          <template #default="{ row }">
            <el-progress v-if="row.cpuPct != null" :percentage="clamp(row.cpuPct)" :stroke-width="10" :color="pctColor(row.cpuPct)" />
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="内存 GB" width="100" align="center">
          <template #default="{ row }">{{ row.memGb ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="内存%" width="150">
          <template #default="{ row }">
            <el-progress v-if="row.memPct != null" :percentage="clamp(row.memPct)" :stroke-width="10" :color="pctColor(row.memPct)" />
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="承载数" width="90" align="center">
          <template #default="{ row }">{{ row.guestCount ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="版本" min-width="160">
          <template #default="{ row }">{{ row.version || "-" }}</template>
        </el-table-column>
        <el-table-column label="运行时长" width="100" align="center">
          <template #default="{ row }">{{ row.uptime || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getVirtHosts } from "@/api/monitor-virt";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const offline = computed(() => Math.max(0, (Number(d.value.total) || 0) - (Number(d.value.online) || 0)));
const isReal = computed(() => ["vsphere", "kvm", "docker"].includes(d.value.source));

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const countColor = (v) => (Number(v) > 0 ? "#f56c6c" : "#67c23a");
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const statusColor = (s) => {
  const v = String(s || "").toLowerCase();
  if (["online", "up", "connected"].includes(v)) return "#67c23a";
  if (["warning", "degraded", "maintenance"].includes(v)) return "#e6a23c";
  if (["offline", "down", "disconnected", "notresponding"].includes(v)) return "#f56c6c";
  return "#909399";
};
const roleLabel = (r) => {
  const map = { hypervisor: "宿主机", manager: "管理节点", worker: "工作节点", POWERED_ON: "运行", POWERED_OFF: "关机" };
  return map[r] || r || "-";
};

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && Object.keys(data.value).length;
  if (!hasData) loading.value = true;
  try {
    const res = await getVirtHosts(props.deviceId);
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.stat-grid {
  flex-shrink: 0;
}
.span-all {
  grid-column: 1 / -1;
}
.mono {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
.muted {
  color: var(--cm-text-secondary);
}
</style>
