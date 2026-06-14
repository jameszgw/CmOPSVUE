<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Odometer" label="缓存命中率" :value="`${num(hitRate)}%`"
          :percent="hitRate" sub="缓存命中率" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="TrendCharts" label="事务提交" :value="kfmt(d.commits)"
          sub="累计提交事务数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="RefreshLeft" label="事务回滚" :value="kfmt(d.rollbacks)"
          sub="累计回滚事务数" color="#e6a23c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="事务统计" icon="DataLine">
          <InfoTable :rows="txRows" />
          <div class="progress-row">
            <span class="progress-row__label">提交率</span>
            <el-progress :percentage="clamp(tx.commitRate)" :stroke-width="10"
              color="#e6a23c" class="progress-row__bar" />
            <span class="progress-row__num">{{ num(tx.commitRate) }}%</span>
          </div>
          <div class="progress-row">
            <span class="progress-row__label">缓存命中率</span>
            <el-progress :percentage="clamp(tx.hitRate)" :stroke-width="10"
              color="#67c23a" class="progress-row__bar" />
            <span class="progress-row__num">{{ num(tx.hitRate) }}%</span>
          </div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="元组操作" icon="Histogram">
          <InfoTable :rows="tupleRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="性能指标说明" icon="TrendCharts">
      <div class="note-grid">
        <div v-for="n in notes" :key="n.title" class="note-item">
          <div class="note-item__title">{{ n.title }}</div>
          <div class="note-item__desc">{{ n.desc }}</div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getDatabasePerformance } from "@/api/monitor-database";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const kfmt = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return `${n}`;
};

const hitRate = computed(() => d.value.hitRate ?? d.value.txStats?.hitRate);
const tx = computed(() => d.value.txStats || {});

const txRows = computed(() => {
  const t = d.value.txStats || {};
  return [
    { label: "事务提交", value: kfmt(t.commits) },
    { label: "事务回滚", value: kfmt(t.rollbacks) },
  ];
});

const tupleRows = computed(() => {
  const t = d.value.tupleOps || {};
  return [
    { label: "元组返回", value: kfmt(t.returned) },
    { label: "元组获取", value: kfmt(t.fetched) },
    { label: "元组插入", value: kfmt(t.inserted), color: "#67c23a" },
    { label: "元组更新", value: kfmt(t.updated), color: "#409eff" },
    { label: "元组删除", value: kfmt(t.deleted), color: "#f56c6c" },
  ];
});

const notes = [
  { title: "缓存命中率", desc: "从缓存中读取数据的比例，越高性能越好" },
  { title: "事务提交", desc: "成功提交的事务总数" },
  { title: "事务回滚", desc: "回滚的事务总数，过高可能表示有问题" },
  { title: "元组操作", desc: "数据行的增删改查操作统计" },
];

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getDatabasePerformance(props.deviceId);
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
  margin: 12px 0;
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
.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.note-item {
  background: var(--cm-bg-muted);
  border-radius: 6px;
  padding: 12px 14px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary);
    margin-bottom: 6px;
  }
  &__desc {
    font-size: 12px;
    color: var(--cm-text-secondary);
    line-height: 1.5;
  }
}
</style>
