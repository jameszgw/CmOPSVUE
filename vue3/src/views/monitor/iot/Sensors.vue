<template>
  <div v-loading="loading" class="tab-screen">
    <CardGrid min="160px" gap="8px" class="row-stats">
      <StatCard dense icon="Cpu" label="传感器总数" :value="d.total ?? 0" color="#409eff" />
    </CardGrid>

    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill row-tables" title="传感器列表" icon="List">
      <template #extra>共 {{ items.length }} 个</template>
      <el-table :data="items" class="dense-table" height="100%" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="type" label="类型" min-width="120">
          <template #default="{ row }">{{ row.type || "-" }}</template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" width="100">
          <template #default="{ row }">{{ row.protocol || "-" }}</template>
        </el-table-column>
        <el-table-column label="信号" width="110" align="right">
          <template #default="{ row }">{{ row.rssi != null ? `${row.rssi} dBm` : "-" }}</template>
        </el-table-column>
        <el-table-column label="电量" min-width="160">
          <template #default="{ row }">
            <el-progress v-if="row.battery != null" :percentage="clamp(row.battery)"
              :stroke-width="12" :color="pctColor(row.battery)" />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="数值" min-width="100">
          <template #default="{ row }">{{ row.value ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status ?? "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastSeen" label="最后在线" min-width="160">
          <template #default="{ row }">{{ row.lastSeen ?? "-" }}</template>
        </el-table-column>
        <template #empty><el-empty description="暂无数据" :image-size="60" /></template>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getIotSensors } from "@/api/monitor-iot";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const items = computed(() => d.value.items || []);

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n <= 20) return "#f56c6c";
  if (n <= 50) return "#e6a23c";
  return "#67c23a";
};
const statusType = (s) => {
  if (s === "online" || s === "在线") return "success";
  if (s === "offline" || s === "离线") return "danger";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getIotSensors(props.deviceId);
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
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.row-stats {
  flex-shrink: 0;
}
.row-tables {
  flex: 1;
  min-height: 0;
}
</style>
