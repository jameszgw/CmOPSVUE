<template>
  <div v-loading="loading" class="tab-screen">
    <CardGrid min="160px" gap="8px" class="row-stats">
      <StatCard dense icon="Odometer" label="负载率" :value="`${num(d.loadPct)}%`"
        :percent="d.loadPct" color="#409eff" />
      <StatCard dense icon="Lightning" label="有功功率" :value="`${num(d.activePowerKw)} kW`"
        color="#67c23a" />
      <StatCard dense icon="Position" label="输入电压" :value="`${num(d.inputVoltage)} V`"
        color="#e6a23c" />
      <StatCard dense icon="DataLine" label="今日电能" :value="`${num(d.energyTodayKwh)} kWh`"
        :sub="`累计 ${d.energyTotalKwh ?? '-'} kWh`" color="#9254de" />
      <StatCard v-if="showBattery" dense icon="Lightning" label="电池电量" :value="`${num(d.batterySoc)}%`"
        :percent="d.batterySoc" :sub="`续航 ${d.batteryRuntimeMin ?? '-'} min`" color="#13c2c2" />
    </CardGrid>

    <SectionCard dense class="row-mid" title="基础信息" icon="InfoFilled">
      <template #extra>
        <el-tag size="small" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
          {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
        </el-tag>
      </template>
      <InfoTable :rows="basicRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getPowerOverview } from "@/api/monitor-power";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const showBattery = computed(() => d.value.deviceType === "UPS" || d.value.batterySoc != null);

const basicRows = computed(() => {
  const v = d.value;
  const rows = [
    { label: "设备类型", value: v.deviceType ?? "-" },
    { label: "厂商", value: v.vendor ?? "-" },
    { label: "IP", value: v.ip ?? "-" },
    { label: "环境", value: v.env ?? "-" },
    { label: "额定功率", value: v.ratedPowerKw != null ? `${v.ratedPowerKw} kW` : "-" },
    { label: "状态", value: v.status ?? "-" },
    { label: "功率因数", value: v.powerFactor ?? "-" },
    { label: "视在功率", value: v.apparentPowerKva != null ? `${v.apparentPowerKva} kVA` : "-" },
    { label: "输出电压", value: v.outputVoltage != null ? `${v.outputVoltage} V` : "-" },
    { label: "频率", value: v.frequencyHz != null ? `${v.frequencyHz} Hz` : "-" },
    { label: "电流", value: v.current != null ? `${v.current} A` : "-" },
    { label: "温度", value: v.temperature != null ? `${v.temperature} °C` : "-" },
  ];
  if (showBattery.value) {
    rows.push({ label: "电池状态", value: v.batteryStatus ?? "-" });
  }
  rows.push({ label: "更新时间", value: v.updatedAt ?? "-" });
  return rows;
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getPowerOverview(props.deviceId);
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
</style>
