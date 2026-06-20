<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Cpu" label="GPU" :value="`${d.gpuActive ?? 0}/${d.gpuTotal ?? 0}`"
        :sub="`活跃 ${d.gpuActive ?? 0} / 总数 ${d.gpuTotal ?? 0}`" color="#409eff" dense />
      <StatCard icon="Odometer" label="平均利用率" :value="`${num(d.avgUtilization)}%`"
        :percent="d.avgUtilization" color="#67c23a" dense />
      <StatCard icon="Coin" label="显存使用率" :value="`${num(d.avgMemUsage)}%`"
        :percent="d.avgMemUsage" color="#9254de" dense />
      <StatCard icon="Sunny" label="最高温度" :value="`${num(d.maxTemperature)}°C`"
        :sub="`总功耗 ${d.totalPower ?? '-'} W`" :color="tempColor(d.maxTemperature)" dense />
    </CardGrid>

    <CardGrid min="300px" gap="8px">
      <SectionCard title="基础信息" icon="InfoFilled" dense>
        <template #extra>
          <el-tag size="small" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
            {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" :columns="2" />
      </SectionCard>
      <SectionCard title="任务" icon="List" dense>
        <div class="count-grid">
          <div v-for="j in jobItems" :key="j.label" class="count-card">
            <span class="count-card__icon" :style="{ color: j.color }">
              <el-icon :size="20"><component :is="j.icon" /></el-icon>
            </span>
            <span class="count-card__value">{{ j.value ?? 0 }}</span>
            <span class="count-card__label">{{ j.label }}</span>
          </div>
        </div>
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getGpuOverview } from "@/api/monitor-gpu";

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
const healthColor = (s) => {
  if (["Healthy", "正常", "OK"].includes(s)) return "#67c23a";
  if (["Warning", "警告", "Degraded"].includes(s)) return "#e6a23c";
  if (["Unhealthy", "异常", "Critical"].includes(s)) return "#f56c6c";
  return "#909399";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "厂商", value: v.vendor ?? "-" },
    { label: "型号", value: v.model ?? "-" },
    { label: "驱动版本", value: v.driverVersion ?? "-" },
    { label: "CUDA 版本", value: v.cudaVersion ?? "-" },
    { label: "总功耗", value: v.totalPower != null ? `${v.totalPower} W` : "-" },
    { label: "ECC 错误", value: v.eccErrors ?? 0, color: (v.eccErrors || 0) > 0 ? "#f56c6c" : undefined },
    { label: "总显存", value: v.totalMemory ?? "-" },
    { label: "已用显存", value: v.usedMemory ?? "-" },
    { label: "健康状态", value: v.health ?? "-", color: healthColor(v.health) },
  ];
});

const jobItems = computed(() => {
  const v = d.value;
  return [
    { label: "运行中", value: v.runningJobs, icon: "VideoPlay", color: "#67c23a" },
    { label: "等待中", value: v.pendingJobs, icon: "Clock", color: "#e6a23c" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getGpuOverview(props.deviceId);
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
.count-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.count-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  padding: 10px 8px;

  &__icon {
    margin-bottom: 4px;
  }
  &__value {
    font-size: 22px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
  &__label {
    margin-top: 2px;
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
}
</style>
