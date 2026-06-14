<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <template v-if="d.type === 'outlet'">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Grid" label="插座总数" :value="d.outletTotal ?? 0" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="VideoPlay" label="活跃" :value="d.outletActive ?? 0" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Lightning" label="总功率" :value="`${d.totalPowerW ?? '-'} W`" color="#e6a23c" />
        </el-col>
      </template>
      <template v-else-if="d.type === 'phase'">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Connection" label="相数" :value="d.phaseCount ?? 0" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Lightning" label="总功率" :value="`${d.totalPowerKw ?? '-'} kW`" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="ScaleToOriginal" label="不平衡度" :value="`${d.imbalancePct ?? '-'}%`" color="#e6a23c" />
        </el-col>
      </template>
    </el-row>

    <SectionCard title="回路明细" icon="List">
      <template #extra>共 {{ items.length }} 条</template>
      <el-empty v-if="!items.length" description="暂无数据" />
      <el-table v-else-if="d.type === 'outlet'" :data="items" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="电流" width="110" align="right">
          <template #default="{ row }">{{ row.current != null ? `${row.current} A` : "-" }}</template>
        </el-table-column>
        <el-table-column label="功率" width="110" align="right">
          <template #default="{ row }">{{ row.powerW != null ? `${row.powerW} W` : "-" }}</template>
        </el-table-column>
        <el-table-column label="电压" width="110" align="right">
          <template #default="{ row }">{{ row.voltage != null ? `${row.voltage} V` : "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status ?? "-" }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-table v-else-if="d.type === 'phase'" :data="items" size="small" stripe>
        <el-table-column prop="phase" label="相" width="90" align="center">
          <template #default="{ row }">{{ row.phase ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="电压" min-width="110" align="right">
          <template #default="{ row }">{{ row.voltage != null ? `${row.voltage} V` : "-" }}</template>
        </el-table-column>
        <el-table-column label="电流" min-width="110" align="right">
          <template #default="{ row }">{{ row.current != null ? `${row.current} A` : "-" }}</template>
        </el-table-column>
        <el-table-column label="功率" min-width="110" align="right">
          <template #default="{ row }">{{ row.powerKw != null ? `${row.powerKw} kW` : "-" }}</template>
        </el-table-column>
        <el-table-column label="功率因数" min-width="110" align="right">
          <template #default="{ row }">{{ row.powerFactor ?? "-" }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无数据" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getPowerCircuits } from "@/api/monitor-power";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const items = computed(() => d.value.items || []);

const statusType = (s) => {
  if (["正常", "normal", "on"].includes(s)) return "success";
  if (["警告", "warning"].includes(s)) return "warning";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getPowerCircuits(props.deviceId);
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
