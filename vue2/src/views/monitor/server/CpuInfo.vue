<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-odometer" label="总体使用率" :value="`${num(d.usage)}%`"
          :percent="d.usage" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-cpu" label="物理核心" :value="d.physicalCores == null ? '-' : d.physicalCores"
          sub="核心数量" color="#909399" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-cpu" label="逻辑处理器" :value="d.logicalCores == null ? '-' : d.logicalCores"
          sub="线程数量" color="#67c23a" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基本信息" icon="el-icon-info">
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="频率信息" icon="el-icon-odometer">
          <InfoTable :rows="freqRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="各核心使用率" icon="el-icon-data-analysis">
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

    <SectionCard title="CPU 时间统计" icon="el-icon-time">
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
        <SectionCard title="CPU 统计信息" icon="el-icon-data-line">
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
        <SectionCard title="系统负载" icon="el-icon-data-line">
          <div class="load-row">
            <div class="load-item">
              <div class="load-item__label">1 分钟</div>
              <div class="load-item__value">{{ load1 }}</div>
            </div>
            <div class="load-item">
              <div class="load-item__label">5 分钟</div>
              <div class="load-item__value">{{ load5 }}</div>
            </div>
            <div class="load-item">
              <div class="load-item__label">15 分钟</div>
              <div class="load-item__value">{{ load15 }}</div>
            </div>
          </div>
          <div class="load-cores">CPU 核心数: {{ (d.load && d.load.cores) == null ? "-" : d.load.cores }}</div>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getServerCpu } from "@/api/monitor-server";

export default {
  name: "ServerCpuInfo",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    basicRows() {
      const b = this.d.basic || {};
      return [
        { label: "处理器型号", value: b.model },
        { label: "架构", value: b.arch },
        { label: "物理核心数", value: b.physicalCores },
        { label: "逻辑处理器数", value: b.logicalCores },
        { label: "当前使用率", value: `${this.num(b.usage)}%`, color: "#67c23a" },
      ];
    },
    freqRows() {
      const f = this.d.freq || {};
      return [
        { label: "当前频率", value: f.current, color: "#409eff" },
        { label: "最大频率", value: f.max },
        { label: "最小频率", value: f.min },
      ];
    },
    load1() {
      return (this.d.load && this.d.load.load1) == null ? "-" : this.d.load.load1;
    },
    load5() {
      return (this.d.load && this.d.load.load5) == null ? "-" : this.d.load.load5;
    },
    load15() {
      return (this.d.load && this.d.load.load15) == null ? "-" : this.d.load.load15;
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v;
    },
    coreColor(v) {
      return v > 80 ? "#f56c6c" : v > 50 ? "#e6a23c" : "#409eff";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerCpu(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
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
    color: var(--cm-text-regular, @text-regular);
    margin-bottom: 6px;
  }
}
.grid-metric {
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 16px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
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
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-top: 6px;
  }
}
.load-cores {
  margin-top: 12px;
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
</style>
