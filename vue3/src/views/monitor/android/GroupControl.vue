<template>
  <div v-loading="loading" class="tab-pane">
    <el-alert
      title="群控批量为模拟结果"
      type="warning"
      :description="d.note || '群控批量任务数据为模拟展示，仅供参考'"
      show-icon
      :closable="false"
      class="note-banner"
    />

    <SectionCard title="群控任务" icon="Operation">
      <template #extra>运行中 {{ d.runningTasks ?? 0 }}</template>
      <el-empty v-if="!items.length" description="暂无数据" />
      <el-table v-else :data="items" size="small" stripe>
        <el-table-column prop="name" label="任务名称" min-width="160">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" min-width="140">
          <template #default="{ row }">{{ row.scope || "-" }}</template>
        </el-table-column>
        <el-table-column label="进度" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.progressPct)" :stroke-width="12"
              :color="pctColor(row.progressPct)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="影响实例" width="110" align="center">
          <template #default="{ row }">{{ row.affected ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="创建时间" min-width="170">
          <template #default="{ row }">{{ row.gmtCreate || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAndroidGroupControl } from "@/api/monitor-android";

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
  if (n >= 100) return "#67c23a";
  if (n >= 50) return "#409eff";
  return "#e6a23c";
};
const statusTagType = (s) => {
  if (["done", "success", "completed", "已完成", "成功"].includes(s)) return "success";
  if (["running", "进行中", "运行中"].includes(s)) return "primary";
  if (["pending", "queued", "等待中", "排队"].includes(s)) return "warning";
  if (["failed", "error", "失败", "异常"].includes(s)) return "danger";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getAndroidGroupControl(props.deviceId);
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
.note-banner {
  margin-bottom: 12px;
}
</style>
