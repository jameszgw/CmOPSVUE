<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Cpu" label="传感器总数" :value="d.sensorTotal ?? 0" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleCheck" label="在线" :value="d.online ?? 0" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleClose" label="离线" :value="d.offline ?? 0"
          :color="(d.offline || 0) > 0 ? '#f56c6c' : '#909399'" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="平均信号" :value="`${num(d.avgRssi)} dBm`" color="#e6a23c" />
      </el-col>
      <el-col v-if="d.iotType === 'INFRARED'" :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="今日入侵" :value="d.intrusionToday ?? 0"
          :sub="`布防 ${d.armed ? '是' : '否'}`"
          :color="(d.intrusionToday || 0) > 0 ? '#f56c6c' : '#67c23a'" />
      </el-col>
      <template v-else-if="d.iotType === 'ENV'">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Sunny" label="温度" :value="`${num(d.temperature)} °C`" color="#e6a23c" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Drizzling" label="湿度" :value="`${num(d.humidity)}%`" color="#409eff" />
        </el-col>
      </template>
    </el-row>

    <SectionCard title="基础信息" icon="InfoFilled">
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
import { getIotOverview } from "@/api/monitor-iot";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const basicRows = computed(() => {
  const v = d.value;
  const rows = [
    { label: "物联类型", value: v.iotType ?? "-" },
    { label: "协议", value: v.protocol ?? "-" },
    { label: "频段", value: v.band ?? "-" },
    { label: "网关状态", value: v.gatewayStatus ?? "-" },
    { label: "频段占用", value: v.bandOccupancyPct != null ? `${v.bandOccupancyPct}%` : "-" },
    { label: "平均电量", value: v.avgBattery != null ? `${v.avgBattery}%` : "-" },
    { label: "在线/离线", value: `${v.online ?? "-"}/${v.offline ?? "-"}` },
    { label: "更新时间", value: v.updatedAt ?? "-" },
  ];
  if (v.iotType === "ENV") {
    rows.push({ label: "CO2", value: v.co2 != null ? `${v.co2} ppm` : "-" });
    rows.push({ label: "PM2.5", value: v.pm25 ?? "-" });
  }
  return rows;
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getIotOverview(props.deviceId);
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
