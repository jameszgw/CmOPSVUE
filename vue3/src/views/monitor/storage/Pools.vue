<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Coin" label="存储池数量" :value="d.poolCount ?? '-'"
        sub="存储池总数" color="#409eff" dense />
      <StatCard icon="Warning" label="接近满载" :value="d.nearFullCount ?? '-'"
        sub="near-full 存储池数" :color="(d.nearFullCount ? '#e6a23c' : '#67c23a')" dense />
    </CardGrid>

    <SectionCard title="存储池列表" icon="List" dense scrollable bodyClass="dense-table fill" class="fill">
      <template #extra>共 {{ (d.pools || []).length }} 个</template>
      <el-empty v-if="!(d.pools || []).length" description="暂无数据" />
      <el-table v-else :data="d.pools || []" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="capacity" label="容量" width="120" />
        <el-table-column prop="used" label="已用" width="120" />
        <el-table-column label="使用率" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.usagePct)" :stroke-width="12"
              :color="pctColor(row.usagePct)" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column label="对象数" width="120" align="right">
          <template #default="{ row }">{{ kfmt(row.objects) }}</template>
        </el-table-column>
        <el-table-column prop="replicas" label="副本" width="90" align="center" />
        <el-table-column label="IOPS" width="120" align="right">
          <template #default="{ row }">{{ kfmt(row.iops) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="plain">{{ row.status || "-" }}</el-tag>
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
import { getStoragePools } from "@/api/monitor-storage";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const kfmt = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return `${n}`;
};
const pctColor = (v) => {
  const p = Number(v) || 0;
  return p >= 90 ? "#f56c6c" : p >= 75 ? "#e6a23c" : "#409eff";
};
const statusType = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "near-full" || v === "nearfull" || v === "warning") return "warning";
  if (v === "full" || v === "error" || v === "failed") return "danger";
  return "success";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getStoragePools(props.deviceId);
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
