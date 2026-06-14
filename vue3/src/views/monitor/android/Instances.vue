<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard title="实例列表" icon="Grid">
      <template #extra>展示 {{ d.shown ?? items.length }} / 共 {{ d.total ?? items.length }}</template>
      <el-empty v-if="!items.length" description="暂无数据" />
      <el-table v-else :data="items" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" fixed>
          <template #default="{ row }">{{ row.name || row.id || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resolution" label="分辨率" width="120" align="center">
          <template #default="{ row }">{{ row.resolution || "-" }}</template>
        </el-table-column>
        <el-table-column label="CPU" min-width="150">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12" :color="pctColor(row.cpuPct)" />
          </template>
        </el-table-column>
        <el-table-column label="内存" width="100" align="right">
          <template #default="{ row }">{{ row.memMb != null ? `${row.memMb} MB` : "-" }}</template>
        </el-table-column>
        <el-table-column label="FPS" width="80" align="center">
          <template #default="{ row }">{{ row.fps ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="电量" width="90" align="center">
          <template #default="{ row }">{{ battery(row.batteryPct) }}</template>
        </el-table-column>
        <el-table-column prop="app" label="应用" min-width="140">
          <template #default="{ row }">{{ row.app || "-" }}</template>
        </el-table-column>
        <el-table-column label="ROOT" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.rooted ? 'warning' : 'info'" size="small" effect="plain">
              {{ row.rooted ? "已ROOT" : "未ROOT" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="ADB" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="adbType(row.adb)" size="small" effect="dark">{{ adbText(row.adb) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAndroidInstances } from "@/api/monitor-android";

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
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const battery = (v) => (v === "NA" || v == null ? "NA" : `${v}%`);
const statusTagType = (s) => {
  if (["online", "running", "正常", "在线"].includes(s)) return "success";
  if (["warning", "警告"].includes(s)) return "warning";
  if (["offline", "error", "异常", "离线"].includes(s)) return "danger";
  return "info";
};
const adbText = (v) => {
  if (v === true || v === "online" || v === "connected") return "在线";
  if (v === false || v === "offline") return "离线";
  return String(v ?? "-");
};
const adbType = (v) => (adbText(v) === "在线" ? "success" : "info");

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getAndroidInstances(props.deviceId);
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
</style>
