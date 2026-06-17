<template>
  <div v-loading="loading" class="tab-screen">
    <CardGrid min="160px" gap="8px" class="row-stats">
      <StatCard dense icon="Cpu" label="CPU使用率" :value="`${num(d.cpuUsage)}%`"
        :percent="d.cpuUsage" color="#409eff" />
      <StatCard dense icon="Sunny" label="SoC温度" :value="`${num(d.socTemp)}°C`"
        :sub="`功耗 ${d.powerWatt ?? '-'} W`" :color="tempColor(d.socTemp)" />
      <StatCard dense icon="Coin" label="内存使用率" :value="`${num(d.memUsage)}%`"
        :percent="d.memUsage" :sub="`总量 ${d.memTotalMb ?? '-'} MB`" color="#9254de" />
      <StatCard dense icon="Lightning" label="供电电压" :value="`${num(d.supplyVoltage)} V`"
        :sub="`电流 ${d.supplyCurrent ?? '-'} A`" :color="powerColor" />
    </CardGrid>

    <SectionCard dense title="基础信息" icon="InfoFilled" class="row-mid">
      <template #extra>
        <el-tag size="small" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
          {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
        </el-tag>
        <el-tag v-if="d.underVoltage" type="danger" size="small" effect="dark">欠压</el-tag>
        <el-tag v-if="d.throttled" type="warning" size="small" effect="dark" style="margin-left: 6px">降频</el-tag>
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
import { getSbcOverview } from "@/api/monitor-sbc";

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
  if (n >= 85) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#409eff";
};
const powerColor = computed(() => (d.value.underVoltage ? "#f56c6c" : "#67c23a"));
const statusColor = (s) => {
  if (["online", "running", "正常", "在线", "Healthy"].includes(s)) return "#67c23a";
  if (["warning", "警告"].includes(s)) return "#e6a23c";
  if (["offline", "error", "异常", "离线"].includes(s)) return "#f56c6c";
  return "#909399";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "设备名称", value: v.name ?? "-" },
    { label: "状态", value: v.status ?? "-", color: statusColor(v.status) },
    { label: "板卡型号", value: v.boardModel ?? "-" },
    { label: "SoC", value: v.soc ?? "-" },
    { label: "CPU架构", value: v.cpuArch ?? "-" },
    { label: "操作系统", value: v.osName ?? "-" },
    { label: "IP地址", value: v.ip ?? "-" },
    { label: "环境", value: v.env ?? "-" },
    { label: "运行时长", value: v.uptime ?? "-" },
    { label: "存储类型", value: v.storageType ?? "-" },
    {
      label: "存储使用率",
      value: v.storageUsagePct != null ? `${v.storageUsagePct}%` : "-",
      color: (v.storageUsagePct || 0) >= 90 ? "#f56c6c" : undefined,
    },
    {
      label: "存储寿命",
      value: v.storageWearPct != null ? `${v.storageWearPct}%` : "-",
      color: (v.storageWearPct || 0) >= 80 ? "#e6a23c" : undefined,
    },
    { label: "大核频率", value: v.bigCoreFreqMhz != null ? `${v.bigCoreFreqMhz} MHz` : "-" },
    { label: "小核频率", value: v.littleCoreFreqMhz != null ? `${v.littleCoreFreqMhz} MHz` : "-" },
    { label: "功耗", value: v.powerWatt != null ? `${v.powerWatt} W` : "-" },
    { label: "更新时间", value: v.updatedAt ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getSbcOverview(props.deviceId);
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
