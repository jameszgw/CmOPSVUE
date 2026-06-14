<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Lightning" label="SOC" :value="`${num(d.soc)}%`"
          :percent="d.soc" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleCheck" label="SOH" :value="`${num(d.soh)}%`"
          :percent="d.soh" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Odometer" label="功率" :value="`${num(d.powerKw)} kW`"
          :sub="d.mode ?? '-'" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Sunny" label="温差" :value="`${num(d.cellTempDiff)} °C`"
          :sub="`max ${d.cellTempMax ?? '-'} / min ${d.cellTempMin ?? '-'}`"
          :color="tempColor(d.cellTempDiff)" />
      </el-col>
    </el-row>

    <SectionCard title="基础信息" icon="InfoFilled">
      <InfoTable :rows="basicRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getEssOverview } from "@/api/monitor-ess";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const tempColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 10) return "#f56c6c";
  if (n >= 5) return "#e6a23c";
  return "#409eff";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "储能类型", value: v.essType ?? "-" },
    { label: "厂商", value: v.vendor ?? "-" },
    { label: "IP", value: v.ip ?? "-" },
    { label: "环境", value: v.env ?? "-" },
    { label: "容量", value: v.capacityKwh != null ? `${v.capacityKwh} kWh` : "-" },
    { label: "可用容量", value: v.availableKwh != null ? `${v.availableKwh} kWh` : "-" },
    { label: "状态", value: v.status ?? "-" },
    { label: "模式", value: v.mode ?? "-" },
    { label: "电压", value: v.voltage != null ? `${v.voltage} V` : "-" },
    { label: "电流", value: v.current != null ? `${v.current} A` : "-" },
    { label: "循环次数", value: v.cycleCount ?? "-" },
    { label: "效率", value: v.efficiencyPct != null ? `${v.efficiencyPct}%` : "-" },
    { label: "更新时间", value: v.updatedAt ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getEssOverview(props.deviceId);
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
