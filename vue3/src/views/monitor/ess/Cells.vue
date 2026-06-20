<template>
  <div v-loading="loading" class="tab-screen">
    <CardGrid min="160px" gap="8px" class="row-stats">
      <StatCard dense icon="Grid" label="电池簇" :value="d.packs ?? 0"
        :sub="`每簇 ${d.cellsPerPack ?? '-'} 电芯`" color="#409eff" />
      <StatCard dense icon="Coin" label="电芯总数" :value="d.cellTotal ?? 0"
        color="#9254de" />
      <StatCard dense icon="Odometer" label="压差" :value="`${num(d.cellVoltDiff)} V`"
        color="#e6a23c" />
      <StatCard dense icon="Sunny" label="温差" :value="`${num(d.cellTempDiff)} °C`"
        :color="tempColor(d.cellTempDiff)" />
    </CardGrid>

    <CardGrid min="300px" gap="8px" class="row-mid">
      <SectionCard dense title="单体电压" icon="DataLine">
        <InfoTable :rows="voltRows" />
      </SectionCard>
      <SectionCard dense title="单体温度" icon="Sunny">
        <InfoTable :rows="tempRows" />
      </SectionCard>
    </CardGrid>

    <SectionCard dense scrollable bodyClass="dense-table fill" class="row-tables fill"
      title="电池簇明细" icon="List">
      <template #extra>共 {{ (d.items || []).length }} 簇</template>
      <el-table class="dense-table" height="100%" :data="d.items || []" size="small" stripe>
        <el-table-column prop="packId" label="簇" min-width="120">
          <template #default="{ row }">{{ row.packId ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="电压" width="120" align="right">
          <template #default="{ row }">{{ row.voltage != null ? `${row.voltage} V` : "-" }}</template>
        </el-table-column>
        <el-table-column label="最高温度" width="120" align="right">
          <template #default="{ row }">{{ row.tempMax != null ? `${row.tempMax} °C` : "-" }}</template>
        </el-table-column>
        <el-table-column label="SOC" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.socPct)" :stroke-width="12"
              :color="pctColor(row.socPct)" />
          </template>
        </el-table-column>
        <el-table-column label="均衡" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.balancing" type="success" size="small">均衡中</el-tag>
            <el-tag v-else type="info" size="small">—</el-tag>
          </template>
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
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getEssCells } from "@/api/monitor-ess";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const tempColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 10) return "#f56c6c";
  if (n >= 5) return "#e6a23c";
  return "#409eff";
};
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};

const voltRows = computed(() => {
  const v = d.value;
  return [
    { label: "最低", value: v.cellVoltMin != null ? `${v.cellVoltMin} V` : "-" },
    { label: "最高", value: v.cellVoltMax != null ? `${v.cellVoltMax} V` : "-" },
    { label: "压差", value: v.cellVoltDiff != null ? `${v.cellVoltDiff} V` : "-", color: "#e6a23c" },
  ];
});

const tempRows = computed(() => {
  const v = d.value;
  return [
    { label: "最低", value: v.cellTempMin != null ? `${v.cellTempMin} °C` : "-" },
    { label: "最高", value: v.cellTempMax != null ? `${v.cellTempMax} °C` : "-" },
    { label: "温差", value: v.cellTempDiff != null ? `${v.cellTempDiff} °C` : "-", color: "#e6a23c" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getEssCells(props.deviceId);
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
.row-mid {
  flex-shrink: 0;
}
.row-tables {
  flex: 1;
  min-height: 0;
}
</style>
