<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="MagicStick" label="每秒操作数" :value="fmt(d.opsPerSec)"
          sub="OPS" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="TrendCharts" label="缓存命中率" :value="`${num(d.hitRate)}%`"
          :percent="d.hitRate" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="DataLine" label="总命令数" :value="fmt(d.totalCommands)"
          sub="累计执行" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="总连接数" :value="fmt(d.totalConnections)"
          sub="累计连接" color="#909399" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="命令统计" icon="DataLine">
          <InfoTable :rows="cmdRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="连接统计" icon="Connection">
          <InfoTable :rows="connRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="键操作统计" icon="Key">
          <InfoTable :rows="keyOpsRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="同步统计" icon="Refresh">
          <InfoTable :rows="syncRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="指标说明" icon="InfoFilled">
      <el-row :gutter="12">
        <el-col v-for="m in metricDocs" :key="m.key" :xs="24" :sm="12" :lg="8">
          <div class="metric-doc">
            <div class="metric-doc__title">{{ m.key }}</div>
            <div class="metric-doc__text">{{ m.text }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisStatistics } from "@/api/monitor-redis";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));
const fmt = (v) =>
  typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v ?? "-";

const cmdRows = computed(() => {
  const c = d.value.cmdStats || {};
  return [
    { label: "总命令数", value: fmt(c.totalCommands) },
    { label: "每秒操作数", value: fmt(c.opsPerSec), color: "#409eff" },
    { label: "键空间命中", value: fmt(c.keyspaceHits), color: "#67c23a" },
    { label: "键空间未命中", value: fmt(c.keyspaceMisses), color: "#f56c6c" },
    {
      label: "命中率",
      value: c.hitRate != null ? `${Number(c.hitRate).toFixed(2)}%` : "-",
      color: "#67c23a",
    },
  ];
});

const connRows = computed(() => {
  const c = d.value.connStats || {};
  return [
    { label: "总连接数", value: fmt(c.totalConnections) },
    { label: "拒绝连接数", value: fmt(c.rejectedConnections), color: "#f56c6c" },
    { label: "总输入字节", value: c.totalInputBytes ?? "-" },
    { label: "总输出字节", value: c.totalOutputBytes ?? "-" },
    { label: "网络输入速率", value: c.netInputRate ?? "-", color: "#409eff" },
    { label: "网络输出速率", value: c.netOutputRate ?? "-", color: "#67c23a" },
  ];
});

const keyOpsRows = computed(() => {
  const k = d.value.keyOps || {};
  return [
    { label: "过期键数", value: fmt(k.expiredKeys), color: "#e6a23c" },
    { label: "淘汰键数", value: fmt(k.evictedKeys), color: "#f56c6c" },
    { label: "键空间命中", value: fmt(k.keyspaceHits), color: "#67c23a" },
    { label: "键空间未命中", value: fmt(k.keyspaceMisses) },
  ];
});

const syncRows = computed(() => {
  const s = d.value.syncStats || {};
  return [
    { label: "完整同步", value: fmt(s.fullSync) },
    { label: "部分同步成功", value: fmt(s.partialOk), color: "#67c23a" },
    { label: "部分同步失败", value: fmt(s.partialErr), color: "#f56c6c" },
    { label: "主从复制偏移量", value: s.masterReplOffset ?? "-" },
    { label: "最近fork耗时", value: s.lastForkUsec != null ? `${s.lastForkUsec} μs` : "-" },
  ];
});

const metricDocs = [
  { key: "每秒操作数", text: "Redis每秒处理的命令数量，反映实时负载" },
  { key: "命中率", text: "键空间命中占总查询的比例，越高越好" },
  { key: "总命令数", text: "Redis启动以来处理的命令总数" },
  { key: "拒绝连接", text: "因超过最大连接数被拒绝的连接数" },
  { key: "同步统计", text: "主从复制的同步次数与状态" },
  { key: "fork耗时", text: "最近一次fork操作的耗时（微秒）" },
];

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getRedisStatistics(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.metric-doc {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  &__text {
    font-size: 12px;
    color: #909399;
    line-height: 1.6;
  }
}
</style>
