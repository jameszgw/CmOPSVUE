<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Coin" label="磁盘总数" :value="d.total ?? '-'"
        :sub="d.type || '磁盘/OSD'" color="#409eff" dense />
      <StatCard icon="CircleCheck" label="健康" :value="d.healthy ?? '-'"
        sub="健康磁盘数" color="#67c23a" dense />
      <StatCard icon="CircleClose" label="故障" :value="d.failed ?? '-'"
        sub="故障磁盘数" :color="(d.failed ? '#f56c6c' : '#67c23a')" dense />
      <StatCard icon="Warning" label="慢盘" :value="d.slowCount ?? '-'"
        sub="慢盘数量" :color="(d.slowCount ? '#e6a23c' : '#67c23a')" dense />
    </CardGrid>

    <SectionCard title="磁盘列表" icon="List" dense scrollable bodyClass="dense-table fill" class="fill">
      <template #extra>共 {{ (d.disks || []).length }} 块</template>
      <el-empty v-if="!(d.disks || []).length" description="暂无数据" />
      <el-table v-else :data="d.disks || []" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="host" label="主机" min-width="140" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="plain">{{ row.status || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" width="110" />
        <el-table-column prop="used" label="已用" width="110" />
        <el-table-column label="使用率" min-width="170">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.usagePct)" :stroke-width="12"
              :color="pctColor(row.usagePct)" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column label="延迟" width="110" align="right">
          <template #default="{ row }">
            <span :style="row.slow ? { color: '#f56c6c', fontWeight: 600 } : null">
              {{ num(row.latencyMs) }} ms
            </span>
          </template>
        </el-table-column>
        <el-table-column label="SMART" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="smartType(row.smartStatus)" effect="plain">{{ row.smartStatus || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="温度" width="100" align="right">
          <template #default="{ row }">{{ row.temperature != null ? row.temperature + " °C" : "-" }}</template>
        </el-table-column>
        <el-table-column label="重映射扇区" width="120" align="right">
          <template #default="{ row }">
            <span :style="row.reallocatedSectors ? { color: '#e6a23c' } : null">{{ row.reallocatedSectors ?? "-" }}</span>
          </template>
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
import { getStorageDisks } from "@/api/monitor-storage";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const num = (v) => (v === undefined || v === null || v === "" ? "-" : Number(v).toFixed(1));
const pctColor = (v) => {
  const p = Number(v) || 0;
  return p >= 90 ? "#f56c6c" : p >= 75 ? "#e6a23c" : "#409eff";
};
const statusType = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "failed" || v === "down" || v === "error") return "danger";
  if (v === "slow" || v === "warning" || v === "degraded") return "warning";
  return "success";
};
const smartType = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "warning" || v === "warn") return "warning";
  if (v === "failed" || v === "fail" || v === "bad") return "danger";
  return "success";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getStorageDisks(props.deviceId);
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
</style>
