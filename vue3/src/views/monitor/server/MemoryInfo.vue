<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="总内存" :value="d.total || '-'"
          sub="物理内存总量" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="已使用" :value="d.used || '-'"
          :sub="`占用 ${num(d.usage)}% 内存空间`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="可用内存" :value="d.available || '-'"
          sub="可立即使用" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="TrendCharts" label="内存使用率" :value="`${num(d.usage)}%`"
          :percent="d.usage" color="#409eff" />
      </el-col>
    </el-row>

    <SectionCard title="虚拟内存（RAM）" icon="Coin">
      <template #extra>使用率 {{ num(d.ram?.usage) }}%</template>
      <el-progress :percentage="clamp(d.ram?.usage)" :stroke-width="10"
        :color="usageColor(d.ram?.usage)" class="section-bar" />
      <InfoTable :rows="ramRows" :columns="2" />
    </SectionCard>

    <SectionCard title="交换分区（Swap）" icon="Switch">
      <template #extra>使用率 {{ num(d.swap?.usage ?? d.swapUsage) }}%</template>
      <el-progress :percentage="clamp(d.swap?.usage ?? d.swapUsage)" :stroke-width="10"
        :color="usageColor(d.swap?.usage ?? d.swapUsage)" class="section-bar" />
      <InfoTable :rows="swapRows" :columns="2" />
    </SectionCard>

    <SectionCard title="内核内存与 OOM" icon="Cpu">
      <template #extra>OOM 次数 {{ d.kernel?.oomKillCount ?? d.oomKillCount ?? 0 }}</template>
      <InfoTable :rows="kernelRows" :columns="2" />
    </SectionCard>

    <SectionCard title="内存分布" icon="PieChart">
      <el-row :gutter="12">
        <el-col v-for="item in distRows" :key="item.label" :xs="12" :sm="8" :lg="4">
          <div class="grid-metric">
            <div class="grid-metric__label">{{ item.label }}</div>
            <div class="grid-metric__value" :style="{ color: item.color }">{{ item.value }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <SectionCard title="实时内存详情" icon="Histogram">
      <el-row :gutter="12">
        <el-col v-for="item in realtimeRows" :key="item.label" :xs="12" :sm="6">
          <div class="grid-metric">
            <div class="grid-metric__label">{{ item.label }}</div>
            <div class="grid-metric__value">{{ item.value }}</div>
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
import { getServerMemory } from "@/api/monitor-server";

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
const usageColor = (v) => (v > 85 ? "#f56c6c" : v > 60 ? "#e6a23c" : "#409eff");

const ramRows = computed(() => {
  const r = d.value.ram || {};
  return [
    { label: "总内存", value: r.total },
    { label: "可用内存", value: r.available, color: "#67c23a" },
    { label: "已使用", value: r.used },
    { label: "空闲内存", value: r.free },
    { label: "缓存内存", value: r.cached },
    { label: "缓冲内存", value: r.buffers },
    { label: "共享内存", value: r.shared },
    { label: "内存使用率", value: `${num(r.usage)}%`, color: "#e6a23c" },
  ];
});

const swapRows = computed(() => {
  const s = d.value.swap || {};
  return [
    { label: "交换分区总量", value: s.total },
    { label: "已使用", value: s.used },
    { label: "可用交换分区", value: s.free, color: "#67c23a" },
    { label: "交换分区使用率", value: `${num(s.usage)}%`, color: "#e6a23c" },
  ];
});

const kernelRows = computed(() => {
  const k = d.value.kernel || {};
  const oom = k.oomKillCount ?? d.value.oomKillCount;
  return [
    {
      label: "OOM 次数",
      value: oom ?? 0,
      color: Number(oom) > 0 ? "#f56c6c" : undefined,
    },
    { label: "最近 OOM 时间", value: k.oomLastTime || "无" },
    { label: "Slab", value: k.slab },
    { label: "可回收 Slab", value: k.slabReclaimable, color: "#67c23a" },
    { label: "不可回收 Slab", value: k.slabUnreclaim, color: "#e6a23c" },
    { label: "页表", value: k.pageTables },
  ];
});

const distRows = computed(() => {
  const x = d.value.distribution || {};
  return [
    { label: "已使用", value: x.used, color: "#e6a23c" },
    { label: "缓存", value: x.cached, color: "#909399" },
    { label: "缓冲", value: x.buffers, color: "#909399" },
    { label: "空闲", value: x.free, color: "#67c23a" },
    { label: "共享", value: x.shared, color: "#909399" },
    { label: "可用", value: x.available, color: "#409eff" },
  ];
});

const realtimeRows = computed(() => {
  const x = d.value.realtime || {};
  return [
    { label: "总内存", value: x.total },
    { label: "可用内存", value: x.available },
    { label: "缓存", value: x.cached },
    { label: "空闲", value: x.free },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerMemory(props.deviceId);
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
.section-bar {
  margin-bottom: 16px;
}
.grid-metric {
  border: 1px solid var(--cm-bg-page);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 16px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
</style>
