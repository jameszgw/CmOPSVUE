<template>
  <div v-loading="loading" class="tab-screen">
    <UnsupportedMask class="battery-mask" :unsupported="!d.supported" :reason="d.note" title="该电源无电池">
      <CardGrid min="160px" gap="8px" class="row-stats">
        <StatCard dense icon="Lightning" label="电量" :value="`${num(d.soc)}%`"
          :percent="d.soc" color="#13c2c2" />
        <StatCard dense icon="CircleCheck" label="健康度" :value="`${num(d.healthPct)}%`"
          :percent="d.healthPct" color="#67c23a" />
        <StatCard dense icon="Timer" label="续航" :value="`${d.runtimeMin ?? '-'} min`" color="#409eff" />
        <StatCard dense icon="RefreshRight" label="循环次数" :value="d.cycleCount ?? '-'" color="#e6a23c" />
      </CardGrid>

      <SectionCard dense class="row-mid" title="电池详情" icon="InfoFilled">
        <InfoTable :rows="detailRows" :columns="2" />
      </SectionCard>
    </UnsupportedMask>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import UnsupportedMask from "@/components/monitor/UnsupportedMask.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getPowerBattery } from "@/api/monitor-power";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const detailRows = computed(() => {
  const v = d.value;
  return [
    { label: "SOC", value: v.soc != null ? `${v.soc}%` : "-" },
    { label: "健康度", value: v.healthPct != null ? `${v.healthPct}%` : "-" },
    { label: "电压", value: v.voltage != null ? `${v.voltage} V` : "-" },
    { label: "电流", value: v.current != null ? `${v.current} A` : "-" },
    { label: "温度", value: v.temperature != null ? `${v.temperature} °C` : "-" },
    { label: "循环次数", value: v.cycleCount ?? "-" },
    { label: "上次自检", value: v.lastSelfTest ?? "-" },
    { label: "状态", value: v.status ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getPowerBattery(props.deviceId);
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
.battery-mask {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
.row-stats {
  flex-shrink: 0;
}
.row-mid {
  flex-shrink: 0;
}
</style>
