<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="260px" gap="8px" class="stat-grid">
      <SectionCard dense title="CPU" icon="Cpu">
        <InfoTable :rows="cpuRows" :columns="1" />
        <el-progress :percentage="clamp(cpu.usedPct)" :stroke-width="12" :color="pctColor(cpu.usedPct)" style="margin-top: 6px" />
      </SectionCard>
      <SectionCard dense title="内存" icon="Coin">
        <InfoTable :rows="memRows" :columns="1" />
        <el-progress :percentage="clamp(memory.usedPct)" :stroke-width="12" :color="pctColor(memory.usedPct)" style="margin-top: 6px" />
      </SectionCard>
      <SectionCard dense title="存储" icon="FolderOpened">
        <InfoTable :rows="storageRows" :columns="1" />
        <el-progress :percentage="clamp(storage.usedPct)" :stroke-width="12" :color="pctColor(storage.usedPct)" style="margin-top: 6px" />
      </SectionCard>
    </CardGrid>

    <CardGrid min="360px" gap="8px" class="body-grid">
      <SectionCard dense title="每宿主容量" icon="List" scrollable bodyClass="dense-table fill" class="fill">
        <el-table class="dense-table" height="100%" :data="d.hosts || []" size="small" stripe>
          <el-table-column prop="name" label="宿主" min-width="120"><template #default="{ row }"><span class="mono">{{ row.name }}</span></template></el-table-column>
          <el-table-column label="物理核" width="90" align="center"><template #default="{ row }">{{ row.cpuCores ?? "-" }}</template></el-table-column>
          <el-table-column label="已分 vCPU" width="100" align="center"><template #default="{ row }">{{ row.vcpuAllocated ?? "-" }}</template></el-table-column>
          <el-table-column label="内存 GB" width="100" align="center"><template #default="{ row }">{{ row.memGb ?? "-" }}</template></el-table-column>
          <el-table-column label="内存分配%" min-width="150">
            <template #default="{ row }">
              <el-progress :percentage="clamp(row.memAllocPct)" :stroke-width="10" :color="pctColor(row.memAllocPct)" />
            </template>
          </el-table-column>
          <el-table-column label="承载数" width="90" align="center"><template #default="{ row }">{{ row.guestCount ?? "-" }}</template></el-table-column>
          <template #empty><el-empty description="暂无数据" :image-size="60" /></template>
        </el-table>
      </SectionCard>

      <SectionCard dense title="Top 资源消耗" icon="TrendCharts" scrollable bodyClass="dense-table fill" class="fill">
        <el-table class="dense-table" height="100%" :data="d.topGuests || []" size="small" stripe>
          <el-table-column prop="name" label="名称" min-width="120"><template #default="{ row }"><span class="mono">{{ row.name }}</span></template></el-table-column>
          <el-table-column label="vCPU" width="80" align="center"><template #default="{ row }">{{ row.vcpu ?? "-" }}</template></el-table-column>
          <el-table-column label="内存 GB" width="100" align="center"><template #default="{ row }">{{ row.memGb ?? "-" }}</template></el-table-column>
          <el-table-column label="CPU%" min-width="150">
            <template #default="{ row }">
              <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="10" :color="pctColor(row.cpuPct)" />
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无数据" :image-size="60" /></template>
        </el-table>
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getVirtCapacity } from "@/api/monitor-virt";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const cpu = computed(() => d.value.cpu || {});
const memory = computed(() => d.value.memory || {});
const storage = computed(() => d.value.storage || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};

const cpuRows = computed(() => [
  { label: "物理核", value: cpu.value.physicalCores },
  { label: "已分配 vCPU", value: cpu.value.allocatedVcpu },
  { label: "超分比", value: cpu.value.overcommitRatio != null ? `${cpu.value.overcommitRatio}x` : undefined },
  { label: "使用率", value: cpu.value.usedPct != null ? `${cpu.value.usedPct}%` : undefined },
]);
const memRows = computed(() => [
  { label: "总量", value: memory.value.totalGb != null ? `${memory.value.totalGb} GB` : undefined },
  { label: "已分配", value: memory.value.allocatedGb != null ? `${memory.value.allocatedGb} GB` : undefined },
  { label: "超分比", value: memory.value.overcommitRatio != null ? `${memory.value.overcommitRatio}x` : undefined },
  { label: "使用率", value: memory.value.usedPct != null ? `${memory.value.usedPct}%` : undefined },
]);
const storageRows = computed(() => [
  { label: "总量", value: storage.value.totalGb != null ? `${storage.value.totalGb} GB` : undefined },
  { label: "已分配(精简)", value: storage.value.provisionedGb != null ? `${storage.value.provisionedGb} GB` : undefined },
  { label: "已用", value: storage.value.usedGb != null ? `${storage.value.usedGb} GB` : undefined },
  { label: "精简超配比", value: storage.value.thinProvisionRatio != null ? `${storage.value.thinProvisionRatio}x` : undefined },
]);

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && Object.keys(data.value).length;
  if (!hasData) loading.value = true;
  try {
    const res = await getVirtCapacity(props.deviceId);
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
.body-grid {
  flex: 1;
  min-height: 0;
  align-content: start;
  overflow: auto;
}
.fill {
  min-height: 260px;
}
.mono {
  font-family: monospace;
  color: var(--cm-text-primary);
}
</style>
