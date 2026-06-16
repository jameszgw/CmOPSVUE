<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="TrendCharts" label="QPS" :value="num(d.qps)"
          :sub="`总请求 ${fmt(d.totalRequests)}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="WarningFilled" label="5xx 错误率" :value="`${num(d.error5xxRate)}%`"
          :sub="`4xx ${num(d.error4xxRate)}%`" :color="rateColor(d.error5xxRate)" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="活动连接" :value="d.activeConnections ?? '-'"
          :sub="`平均延迟 ${num(d.avgLatencyMs)} ms`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Histogram" label="上游健康"
          :value="`${d.upstreamHealthy ?? '-'} / ${d.upstreamTotal ?? '-'}`"
          :sub="`异常 ${d.upstreamUnhealthy ?? 0}`"
          :color="d.upstreamUnhealthy ? '#e6a23c' : '#67c23a'" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="InfoFilled">
          <template #extra>
            <el-tag size="small" :type="['agent','ssh','snmp'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="流量概况" icon="DataLine">
          <InfoTable :rows="trafficRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="上游健康" icon="Histogram">
      <div class="progress-row">
        <span class="progress-row__label">健康占比</span>
        <el-progress :percentage="healthPercent" :stroke-width="14"
          :color="usageColor(100 - healthPercent)" class="progress-row__bar" />
        <span class="progress-row__num">{{ d.upstreamHealthy ?? "-" }} / {{ d.upstreamTotal ?? "-" }}</span>
      </div>
      <InfoTable :rows="upstreamRows" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getLbOverview } from "@/api/monitor-lb";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const fmt = (v) => (v === undefined || v === null ? "-" : Number(v).toLocaleString());
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const usageColor = (v) => (v > 90 ? "#f56c6c" : v > 70 ? "#e6a23c" : "#67c23a");
const rateColor = (v) => (Number(v) >= 5 ? "#f56c6c" : Number(v) >= 1 ? "#e6a23c" : "#67c23a");

const STATUS_LABEL = { up: "运行中", active: "运行中", running: "运行中", down: "离线", degraded: "降级" };
const statusText = (s) => STATUS_LABEL[s] || s || "-";
const statusColor = (s) =>
  s === "down" || s === "offline" || s === "failed" ? "#f56c6c"
    : s === "degraded" || s === "near-full" ? "#e6a23c" : "#67c23a";

const healthPercent = computed(() => {
  const total = Number(d.value.upstreamTotal);
  const healthy = Number(d.value.upstreamHealthy);
  if (!total || Number.isNaN(healthy)) return 0;
  return clamp((healthy / total) * 100);
});

const basicRows = computed(() => {
  const x = d.value;
  return [
    { label: "类型", value: x.lbType },
    { label: "版本", value: x.version },
    { label: "地址", value: x.address },
    { label: "状态", value: statusText(x.status), color: statusColor(x.status) },
    { label: "运行时间", value: x.uptime },
    { label: "SSL", value: x.sslEnabled ? "已启用" : "未启用", color: x.sslEnabled ? "#67c23a" : "#909399" },
  ];
});

const trafficRows = computed(() => {
  const x = d.value;
  return [
    { label: "QPS", value: num(x.qps) },
    { label: "总请求数", value: fmt(x.totalRequests) },
    { label: "活动连接", value: x.activeConnections ?? "-" },
    { label: "平均延迟", value: `${num(x.avgLatencyMs)} ms` },
    { label: "入流量速率", value: x.inBytesRate ?? "-" },
    { label: "出流量速率", value: x.outBytesRate ?? "-" },
    { label: "WAF 拦截率", value: `${num(x.wafBlockedRate)}%` },
  ];
});

const upstreamRows = computed(() => {
  const x = d.value;
  return [
    { label: "上游总数", value: x.upstreamTotal ?? "-" },
    { label: "健康节点", value: x.upstreamHealthy ?? "-", color: "#67c23a" },
    { label: "异常节点", value: x.upstreamUnhealthy ?? "-", color: x.upstreamUnhealthy ? "#f56c6c" : "#909399" },
    { label: "5xx 错误率", value: `${num(x.error5xxRate)}%`, color: rateColor(x.error5xxRate) },
    { label: "4xx 错误率", value: `${num(x.error4xxRate)}%` },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getLbOverview(props.deviceId);
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
.progress-row {
  display: flex;
  align-items: center;
  margin: 4px 0 16px;
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
    width: 90px;
    flex-shrink: 0;
  }
  &__bar {
    flex: 1;
  }
  &__num {
    margin-left: 10px;
    font-size: 13px;
    color: var(--cm-text-primary);
    white-space: nowrap;
  }
}
</style>
