<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Odometer" label="总体使用率" :value="`${num(d.usage)}%`"
          :percent="d.usage" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Cpu" label="物理核心" :value="d.physicalCores ?? '-'"
          sub="核心数量" color="#909399" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Cpu" label="逻辑处理器" :value="d.logicalCores ?? '-'"
          sub="线程数量" color="#67c23a" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基本信息" icon="InfoFilled">
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="频率信息" icon="Odometer">
          <InfoTable :rows="freqRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="各核心使用率" icon="Histogram">
      <el-row :gutter="16">
        <el-col v-for="c in d.perCore || []" :key="c.name" :xs="24" :sm="12" :lg="8">
          <div class="core-item">
            <span class="core-item__name">{{ c.name }}</span>
            <el-progress :percentage="clamp(c.usage)" :stroke-width="10"
              :color="coreColor(c.usage)" class="core-item__bar" />
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <SectionCard title="CPU 时间统计" icon="Timer">
      <el-row :gutter="12">
        <el-col v-for="(v, k) in d.times || {}" :key="k" :xs="12" :sm="8" :lg="6">
          <div class="grid-metric">
            <div class="grid-metric__label">{{ k }}</div>
            <div class="grid-metric__value">{{ fmt(v) }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="16">
        <SectionCard title="CPU 统计信息" icon="DataLine">
          <el-row :gutter="12">
            <el-col v-for="(v, k) in d.stats || {}" :key="k" :xs="12" :sm="6">
              <div class="grid-metric">
                <div class="grid-metric__label">{{ k }}</div>
                <div class="grid-metric__value">{{ fmt(v) }}</div>
              </div>
            </el-col>
          </el-row>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="8">
        <SectionCard title="系统负载" icon="TrendCharts">
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
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.core-item {
  margin-bottom: 14px;
  &__name {
    display: block;
    font-size: 13px;
    color: #606266;
    margin-bottom: 6px;
  }
}
.grid-metric {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }
  &__value {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
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
    color: #909399;
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-top: 6px;
  }
}
.load-cores {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
