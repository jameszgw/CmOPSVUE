<template>
  <div v-loading="loading" class="tab-screen">
    <SectionCard dense scrollable bodyClass="dense-table fill" class="row-tables fill" title="GPIO 引脚" icon="Connection">
      <template #extra>共 {{ d.pinCount ?? items.length }} 个引脚</template>
      <el-table :data="items" class="dense-table" height="100%" size="small" stripe>
        <el-table-column prop="pin" label="引脚" width="80" align="center">
          <template #default="{ row }">{{ row.pin ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="mode" label="模式" width="120" align="center">
          <template #default="{ row }">{{ row.mode || "-" }}</template>
        </el-table-column>
        <el-table-column label="电平" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.level != null" :type="levelType(row.level)" size="small" effect="dark">
              {{ levelText(row.level) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="pull" label="上下拉" width="120" align="center">
          <template #default="{ row }">{{ row.pull || "-" }}</template>
        </el-table-column>
        <el-table-column prop="func" label="功能" min-width="160">
          <template #default="{ row }">{{ row.func || "-" }}</template>
        </el-table-column>
        <template #empty><el-empty description="暂无数据" :image-size="60" /></template>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getSbcGpio } from "@/api/monitor-sbc";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const items = computed(() => d.value.items || []);

const levelText = (lv) => {
  if (lv === "HIGH" || lv === 1 || lv === "1") return "HIGH";
  if (lv === "LOW" || lv === 0 || lv === "0") return "LOW";
  return String(lv);
};
const levelType = (lv) => (levelText(lv) === "HIGH" ? "success" : "info");

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getSbcGpio(props.deviceId);
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
.row-tables {
  flex: 1;
  min-height: 0;
}
</style>
