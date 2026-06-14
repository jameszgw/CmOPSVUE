<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Grid" label="实例总数" :value="d.instanceTotal ?? 0"
          :sub="`容量上限 ${d.instanceCap ?? '-'}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleCheck" label="在线实例" :value="d.online ?? 0"
          :sub="`离线 ${d.offline ?? 0}`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Histogram" label="多开密度" :value="`${num(d.densityPct)}%`"
          :percent="d.densityPct" color="#9254de" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="VideoCamera" label="平均FPS" :value="num(d.avgFps)"
          :sub="`单实例CPU ${num(d.avgCpuPerInst)}%`" color="#e6a23c" />
      </el-col>
    </el-row>

    <SectionCard title="基础信息" icon="InfoFilled">
      <template #extra>
        <el-tag size="small" :type="d.source === 'agent' ? 'success' : 'info'" style="margin-right: 6px">
          {{ d.source === "agent" ? "真实采集" : "模拟数据" }}
        </el-tag>
        <el-tag size="small" :type="statusTagType(d.status)">{{ d.status || "-" }}</el-tag>
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
import { getAndroidOverview } from "@/api/monitor-android";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) =>
  v === undefined || v === null || v === "NA" ? "-" : Number(v).toFixed(1);
const battery = (v) => (v === "NA" || v == null ? "NA" : `${v}%`);
const statusTagType = (s) => {
  if (["online", "running", "正常", "在线"].includes(s)) return "success";
  if (["warning", "警告"].includes(s)) return "warning";
  if (["offline", "error", "异常", "离线"].includes(s)) return "danger";
  return "info";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "安卓类型", value: v.androidType ?? "-" },
    { label: "安卓版本", value: v.androidVersion ?? "-" },
    { label: "实例容量", value: v.instanceCap ?? "-" },
    { label: "ADB在线数", value: v.adbOnline ?? 0 },
    { label: "宿主CPU", value: v.hostCpuPct != null ? `${num(v.hostCpuPct)}%` : "-" },
    { label: "宿主内存", value: v.hostMemPct != null ? `${num(v.hostMemPct)}%` : "-" },
    { label: "宿主GPU", value: v.hostGpuPct != null ? `${num(v.hostGpuPct)}%` : "-" },
    { label: "ROOT实例数", value: v.rootedCount ?? 0 },
    { label: "网络上行", value: v.netUpMbps != null ? `${num(v.netUpMbps)} Mbps` : "-" },
    { label: "网络下行", value: v.netDownMbps != null ? `${num(v.netDownMbps)} Mbps` : "-" },
    { label: "单实例平均内存", value: v.avgMemPerInstMb != null ? `${v.avgMemPerInstMb} MB` : "-" },
    { label: "平均电量", value: battery(v.batteryAvgPct) },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getAndroidOverview(props.deviceId);
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
