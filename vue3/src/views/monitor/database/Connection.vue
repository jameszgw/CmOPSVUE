<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="220px" gap="8px" class="stat-grid">
      <StatCard dense icon="Share" label="总连接数" :value="d.total ?? '-'" color="#409eff" />
      <StatCard dense icon="Share" label="最大连接数" :value="d.max ?? '-'" color="#9254de" />
      <StatCard dense icon="TrendCharts" label="活动连接" :value="d.active ?? '-'"
        sub="实时活动连接数" color="#67c23a" />
      <StatCard dense icon="User" label="空闲连接" :value="d.idle ?? '-'"
        sub="当前空闲连接数" color="#e6a23c" />
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="连接 pool 状态" icon="Connection">
          <div class="progress-row">
            <span class="progress-row__label">连接使用率</span>
            <el-tag size="small" type="success" effect="plain" class="progress-row__state">
              {{ stateText(pool.state) }} {{ num(pool.usage) }}%
            </el-tag>
          </div>
          <el-progress :percentage="clamp(pool.usage)" :stroke-width="14"
            :color="usageColor(pool.usage)" :text-inside="false" class="pool-bar" />

          <div class="dist">
            <div class="dist__title">连接分布</div>
            <div class="dist__item">
              <span class="dist__dot" style="background:#67c23a"></span>
              <span class="dist__label">活动连接</span>
              <span class="dist__value">{{ pool.active ?? "-" }}</span>
            </div>
            <div class="dist__item">
              <span class="dist__dot" style="background:#e6a23c"></span>
              <span class="dist__label">空闲连接</span>
              <span class="dist__value">{{ pool.idle ?? "-" }}</span>
            </div>
            <div class="dist__item">
              <span class="dist__dot" style="background:#409eff"></span>
              <span class="dist__label">总连接数</span>
              <span class="dist__value">{{ pool.total ?? "-" }}</span>
            </div>
          </div>

          <div class="capacity">
            <div class="capacity__head">
              <span class="capacity__title">连接 pool 容量</span>
              <span class="capacity__num">{{ pool.capacityUsed ?? "-" }} / {{ pool.capacityMax ?? "-" }}</span>
            </div>
            <div class="capacity__sub">已使用 / 最大连接数</div>
            <el-progress :percentage="capacityPercent" :stroke-width="14"
              :color="usageColor(capacityPercent)" :show-text="false" class="capacity__bar" />
          </div>
        </SectionCard>

      <SectionCard dense title="连接详细信息" icon="Document">
        <InfoTable :rows="detailRows" />
        <div class="progress-row">
          <span class="progress-row__label">连接使用率</span>
          <el-progress :percentage="clamp(detail.usage)" :stroke-width="10"
            :color="usageColor(detail.usage)" class="progress-row__bar" />
          <span class="progress-row__num">{{ num(detail.usage) }}%</span>
        </div>
      </SectionCard>

      <SectionCard dense title="连接说明" icon="TrendCharts" class="span-all">
        <div class="note-grid">
          <div v-for="n in notes" :key="n.title" class="note-item">
            <div class="note-item__title">{{ n.title }}</div>
            <div class="note-item__desc">{{ n.desc }}</div>
          </div>
        </div>
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getDatabaseConnection } from "@/api/monitor-database";

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
const usageColor = (v) => (v > 90 ? "#f56c6c" : v > 70 ? "#e6a23c" : "#67c23a");

const STATE_LABEL = { IDLE: "空闲", NORMAL: "正常", BUSY: "繁忙", FULL: "拥挤" };
const stateText = (s) => STATE_LABEL[s] || s || "";

const pool = computed(() => d.value.pool || {});
const detail = computed(() => d.value.detail || {});

const capacityPercent = computed(() => {
  const used = Number(pool.value.capacityUsed);
  const max = Number(pool.value.capacityMax);
  if (!max || Number.isNaN(used) || Number.isNaN(max)) return 0;
  return clamp((used / max) * 100);
});

const detailRows = computed(() => {
  const x = d.value.detail || {};
  return [
    { label: "总连接数", value: x.total ?? "-" },
    { label: "最大连接数", value: x.max ?? "-" },
    { label: "活动连接", value: x.active ?? "-", color: "#67c23a" },
    { label: "空闲连接", value: x.idle ?? "-" },
    { label: "已使用连接", value: x.used ?? "-" },
    { label: "可用连接", value: x.available ?? "-" },
  ];
});

const notes = [
  { title: "总连接数", desc: "数据库当前建立的所有连接总数" },
  { title: "最大连接数", desc: "数据库配置的最大允许连接数" },
  { title: "活动连接", desc: "正在执行查询或事务的连接数" },
  { title: "空闲连接", desc: "已建立但未在使用的连接数" },
  { title: "连接使用率", desc: "当前连接数占最大连接数的百分比" },
  { title: "连接状态", desc: "空闲(<50%) / 正常(50-70%) / 繁忙(70-90%) / 拥挤(≥90%)" },
];

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getDatabaseConnection(props.deviceId);
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.stat-grid {
  flex-shrink: 0;
}
.body-grid {
  flex: 1;
  min-height: 0;
  align-content: start;
  overflow: auto;
}
.span-all {
  grid-column: 1 / -1;
}
.progress-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
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
  &__state {
    margin-left: auto;
  }
}
.pool-bar {
  margin-bottom: 8px;
}
.dist {
  margin-top: 12px;
  &__title {
    font-size: 13px;
    color: var(--cm-text-regular);
    margin-bottom: 8px;
  }
  &__item {
    display: flex;
    align-items: center;
    padding: 6px 0;
  }
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
  }
  &__value {
    margin-left: auto;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
.capacity {
  margin-top: 12px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }
  &__title {
    font-size: 13px;
    color: var(--cm-text-regular);
  }
  &__num {
    margin-left: auto;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
  &__sub {
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 8px;
  }
}
.note-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 8px;
}
.note-item {
  background: var(--cm-bg-muted);
  border-radius: 6px;
  padding: 10px;
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
