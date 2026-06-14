<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Bell" label="事件总数" :value="d.total ?? 0" color="#409eff" />
      </el-col>
    </el-row>

    <SectionCard title="事件列表" icon="List">
      <el-empty v-if="!items.length" description="暂无数据" />
      <el-table v-else :data="items" size="small" stripe>
        <el-table-column prop="time" label="时间" min-width="160">
          <template #default="{ row }">{{ row.time ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="sensor" label="传感器" min-width="140">
          <template #default="{ row }">{{ row.sensor || "-" }}</template>
        </el-table-column>
        <el-table-column prop="type" label="类型" min-width="120">
          <template #default="{ row }">{{ row.type || "-" }}</template>
        </el-table-column>
        <el-table-column label="级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="levelType(row.level)" size="small">{{ row.level ?? "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="描述" min-width="200">
          <template #default="{ row }">{{ row.desc || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getIotEvents } from "@/api/monitor-iot";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const items = computed(() => d.value.items || []);

const levelType = (lv) => {
  if (lv === "严重" || lv === "critical" || lv === "high") return "danger";
  if (lv === "警告" || lv === "warning" || lv === "medium") return "warning";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getIotEvents(props.deviceId);
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
