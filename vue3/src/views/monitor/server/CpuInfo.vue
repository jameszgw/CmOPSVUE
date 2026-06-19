<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '已禁用模拟数据，暂无真实采集数据'" />
    <template v-else>
    <CardGrid min="200px" gap="8px">
      <StatCard dense icon="Odometer" label="总体使用率" :value="`${num(d.usage)}%`"
        :percent="d.usage" color="#409eff" />
      <StatCard dense icon="Cpu" label="物理核心" :value="d.physicalCores ?? '-'"
        sub="核心数量" color="#909399" />
      <StatCard dense icon="Cpu" label="逻辑处理器" :value="d.logicalCores ?? '-'"
        sub="线程数量" color="#67c23a" />
    </CardGrid>

    <CardGrid min="300px" gap="8px">
      <SectionCard dense title="基本信息" icon="InfoFilled">
        <template #extra>
          <el-tag size="small" :type="isRealSource ? 'success' : 'info'">
            获取方式：{{ d.collectViaLabel || "-" }} · 来源：{{ d.sourceLabel || "-" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" />
      </SectionCard>
      <SectionCard dense title="频率信息" icon="Odometer">
        <InfoTable :rows="freqRows" />
      </SectionCard>
      <SectionCard dense title="系统负载" icon="TrendCharts">
        <div class="load-row">
          <div class="load-item">
            <div class="load-item__label">1 分钟</div>
            <div class="load-item__value">{{ d.load?.load1 ?? "-" }}</div>
          </div>
          <div class="load-item">
            <div class="load-item__label">5 分钟</div>
            <div class="load-item__value">{{ d.load?.load5 ?? "-" }}</div>
          </div>
          <div class="load-item">
            <div class="load-item__label">15 分钟</div>
            <div class="load-item__value">{{ d.load?.load15 ?? "-" }}</div>
          </div>
        </div>
        <div class="load-cores">CPU 核心数: {{ d.load?.cores ?? "-" }}</div>
      </SectionCard>
    </CardGrid>

    <CardGrid min="320px" gap="8px">
      <SectionCard dense title="各核心使用率" icon="Histogram" scrollable class="grid-tall">
        <el-row :gutter="12">
          <el-col v-for="c in d.perCore || []" :key="c.name" :xs="24" :sm="12">
            <div class="core-item">
              <span class="core-item__name">{{ c.name }}</span>
              <el-progress :percentage="clamp(c.usage)" :stroke-width="8"
                :color="coreColor(c.usage)" class="core-item__bar" />
            </div>
          </el-col>
        </el-row>
      </SectionCard>
      <SectionCard dense title="CPU 时间统计" icon="Timer" scrollable class="grid-tall">
        <el-row :gutter="8">
          <el-col v-for="(v, k) in d.times || {}" :key="k" :xs="12" :sm="8">
            <div class="grid-metric">
              <div class="grid-metric__label">{{ k }}</div>
              <div class="grid-metric__value">{{ fmt(v) }}</div>
            </div>
          </el-col>
        </el-row>
      </SectionCard>
      <SectionCard dense title="CPU 统计信息" icon="DataLine" scrollable class="grid-tall">
        <el-row :gutter="8">
          <el-col v-for="(v, k) in d.stats || {}" :key="k" :xs="12" :sm="8">
            <div class="grid-metric">
              <div class="grid-metric__label">{{ k }}</div>
              <div class="grid-metric__value">{{ fmt(v) }}</div>
            </div>
          </el-col>
        </el-row>
      </SectionCard>
    </CardGrid>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerCpu } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const fmt = (v) =>
  typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v;
const coreColor = (v) => (v > 80 ? "#f56c6c" : v > 50 ? "#e6a23c" : "#409eff");

// 真实采集来源（非模拟/无数据）则徽标用 success
const isRealSource = computed(() => !["simulated", "none"].includes(d.value.source));

const basicRows = computed(() => {
  const b = d.value.basic || {};
  return [
    { label: "处理器型号", value: b.model },
    { label: "架构", value: b.arch },
    { label: "物理核心数", value: b.physicalCores },
    { label: "逻辑处理器数", value: b.logicalCores },
    { label: "当前使用率", value: `${num(b.usage)}%`, color: "#67c23a" },
  ];
});

const freqRows = computed(() => {
  const f = d.value.freq || {};
  return [
    { label: "当前频率", value: f.current, color: "#409eff" },
    { label: "最大频率", value: f.max },
    { label: "最小频率", value: f.min },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerCpu(props.deviceId);
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
  display: flex;
  flex-direction: column;
  gap: @dense-gap;
}
.grid-tall {
  max-height: @chart-h-md;
}
.core-item {
  margin-bottom: 10px;
  &__name {
    display: block;
    font-size: 12px;
    color: var(--cm-text-regular);
    margin-bottom: 4px;
  }
}
.grid-metric {
  border: 1px solid var(--cm-bg-page);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 4px;
  }
  &__value {
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
.load-row {
  display: flex;
  justify-content: space-between;
  text-align: center;
}
.load-item {
  flex: 1;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
  &__value {
    font-size: 20px;
    font-weight: 600;
    color: var(--cm-text-primary);
    margin-top: 4px;
  }
}
.load-cores {
  margin-top: 8px;
  font-size: 12px;
  color: var(--cm-text-secondary);
}
</style>
