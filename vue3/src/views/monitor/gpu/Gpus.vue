<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Cpu" label="GPU 总数" :value="d.total ?? 0"
        sub="GPU 卡数量" color="#409eff" dense />
      <StatCard icon="Sunny" label="高温卡数" :value="d.hotCount ?? 0"
        sub="温度过高" :color="(d.hotCount || 0) > 0 ? '#f56c6c' : '#67c23a'" dense />
    </CardGrid>

    <SectionCard title="GPU 卡列表" icon="List" dense scrollable bodyClass="dense-table fill" class="fill">
      <template #extra>共 {{ (d.gpus || []).length }} 张卡</template>
      <el-empty v-if="!(d.gpus || []).length" description="暂无数据" />
      <el-table v-else :data="d.gpus || []" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="index" label="#" width="60" align="center">
          <template #default="{ row }">{{ row.index ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="model" label="型号" min-width="160">
          <template #default="{ row }">{{ row.model || "-" }}</template>
        </el-table-column>
        <el-table-column label="利用率" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.utilizationPct)" :stroke-width="12"
              :color="pctColor(row.utilizationPct)" />
          </template>
        </el-table-column>
        <el-table-column label="显存" min-width="200">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.memUsagePct)" :stroke-width="12"
              :color="pctColor(row.memUsagePct)" />
            <span class="mem-sub">{{ row.memUsed ?? "-" }} / {{ row.memTotal ?? "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="温度" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.hot ? '#f56c6c' : '#303133', fontWeight: row.hot ? 600 : 400 }">
              {{ row.temperature != null ? `${row.temperature}°C` : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="功耗" width="100" align="right">
          <template #default="{ row }">{{ row.powerW != null ? `${row.powerW} W` : "-" }}</template>
        </el-table-column>
        <el-table-column label="风扇" width="90" align="center">
          <template #default="{ row }">{{ row.fanPct != null ? `${row.fanPct}%` : "-" }}</template>
        </el-table-column>
        <el-table-column label="进程数" width="90" align="center">
          <template #default="{ row }">{{ row.processes ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="ECC 错误" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: (row.eccErrors || 0) > 0 ? '#f56c6c' : '#303133' }">
              {{ row.eccErrors ?? 0 }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getGpuCards } from "@/api/monitor-gpu";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getGpuCards(props.deviceId);
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
.mem-sub {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--cm-text-secondary);
}
</style>
