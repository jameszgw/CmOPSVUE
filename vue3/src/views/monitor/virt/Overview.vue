<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="220px" gap="8px" class="stat-grid">
      <StatCard dense icon="Monitor" label="宿主/节点" :value="`${d.hostOnline ?? 0}/${d.hostCount ?? 0}`"
        :sub="`${d.virtLabel || d.virtType || '-'}`" color="#7265e6" />
      <StatCard dense icon="Grid" :label="`${d.guestLabel || '虚机'}数`" :value="num0(d.guestTotal)"
        :sub="`运行 ${d.guestRunning ?? 0} / 停止 ${d.guestStopped ?? 0}`" color="#409eff" />
      <StatCard dense icon="Cpu" label="vCPU 超分" :value="`${num(d.cpuOvercommit)}x`"
        :sub="`${d.vcpuAllocated ?? 0} / ${d.vcpuTotal ?? 0} 物理核`" :color="overColor(d.cpuOvercommit)" />
      <StatCard dense icon="Coin" label="内存超分" :value="`${num(d.memOvercommit)}x`"
        :sub="`${num(d.memAllocatedGb)} / ${num(d.memTotalGb)} GB`" :color="overColor(d.memOvercommit)" />
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="基础信息" icon="InfoFilled">
        <template #extra>
          <el-tag size="small" :type="isReal ? 'success' : 'info'">
            {{ isReal ? sourceLabel : "模拟数据" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" :columns="2" />
      </SectionCard>

      <SectionCard dense title="资源用量" icon="Histogram">
        <InfoTable :rows="resourceRows" :columns="2" />
      </SectionCard>

      <SectionCard dense title="负载与容量" icon="Odometer" class="span-all">
        <div class="bar-line">
          <span class="bar-line__label">宿主 CPU</span>
          <el-progress :percentage="clamp(d.hostCpuPct)" :stroke-width="14" :color="pctColor(d.hostCpuPct)" />
        </div>
        <div class="bar-line">
          <span class="bar-line__label">宿主内存</span>
          <el-progress :percentage="clamp(d.hostMemPct)" :stroke-width="14" :color="pctColor(d.hostMemPct)" />
        </div>
        <div class="bar-line">
          <span class="bar-line__label">存储使用</span>
          <el-progress :percentage="clamp(d.storageUsedPct)" :stroke-width="14" :color="pctColor(d.storageUsedPct)" />
        </div>
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getVirtOverview } from "@/api/monitor-virt";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const REAL_SOURCES = { vsphere: "真实采集·vCenter", kvm: "真实采集·KVM", docker: "真实采集·Docker" };
const isReal = computed(() => Object.keys(REAL_SOURCES).includes(d.value.source));
const sourceLabel = computed(() => REAL_SOURCES[d.value.source] || "真实采集");

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));
const num0 = (v) => (v === undefined || v === null ? "-" : Number(v).toLocaleString());
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const overColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 3) return "#f56c6c";
  if (n >= 2) return "#e6a23c";
  return "#67c23a";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "平台", value: v.virtLabel || v.virtType },
    { label: "版本", value: v.version },
    { label: "地址", value: v.address },
    { label: "宿主/节点数", value: v.hostCount },
    { label: `${v.guestLabel || "虚机"}总数`, value: v.guestTotal },
    { label: "运行/停止", value: v.guestTotal != null ? `${v.guestRunning ?? 0} / ${v.guestStopped ?? 0}` : undefined },
    { label: "运行时长", value: v.uptime },
  ];
});

const resourceRows = computed(() => {
  const v = d.value;
  return [
    { label: "物理核", value: v.vcpuTotal },
    { label: "已分配 vCPU", value: v.vcpuAllocated },
    { label: "CPU 超分比", value: v.cpuOvercommit != null ? `${v.cpuOvercommit}x` : undefined },
    { label: "内存总量", value: v.memTotalGb != null ? `${v.memTotalGb} GB` : undefined },
    { label: "内存已分配", value: v.memAllocatedGb != null ? `${v.memAllocatedGb} GB` : undefined },
    { label: "存储总量", value: v.storageTotalGb != null ? `${v.storageTotalGb} GB` : undefined },
    { label: "存储已用", value: v.storageUsedGb != null ? `${v.storageUsedGb} GB (${v.storageUsedPct ?? 0}%)` : undefined },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && Object.keys(data.value).length;
  if (!hasData) loading.value = true;
  try {
    const res = await getVirtOverview(props.deviceId);
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
.span-all {
  grid-column: 1 / -1;
}
.bar-line {
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  &__label {
    width: 84px;
    font-size: 13px;
    color: var(--cm-text-regular);
    flex-shrink: 0;
  }
  :deep(.el-progress) {
    flex: 1;
  }
}
</style>
