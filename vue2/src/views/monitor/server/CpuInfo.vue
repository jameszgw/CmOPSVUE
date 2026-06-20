<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '暂无数据'" :image-size="120" />
    <template v-else>
    <CardGrid min="200px" gap="8px" class="kpi-row">
      <StatCard dense icon="el-icon-odometer" label="总体使用率" :value="`${num(d.usage)}%`"
        :percent="d.usage" color="#409eff" />
      <StatCard dense icon="el-icon-cpu" label="物理核心" :value="d.physicalCores == null ? '-' : d.physicalCores"
        sub="核心数量" color="#909399" />
      <StatCard dense icon="el-icon-cpu" label="逻辑处理器" :value="d.logicalCores == null ? '-' : d.logicalCores"
        sub="线程数量" color="#67c23a" />
    </CardGrid>

    <CardGrid min="300px" gap="8px" class="section-grid">
      <SectionCard dense title="基本信息" icon="el-icon-info">
        <template #extra>
          <el-tag size="mini" :type="isRealSource ? 'success' : 'info'">
            获取方式：{{ d.collectViaLabel || "-" }} · 来源：{{ d.sourceLabel || "-" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" />
      </SectionCard>
      <SectionCard dense title="频率信息" icon="el-icon-odometer">
        <InfoTable :rows="freqRows" />
      </SectionCard>
      <SectionCard dense title="系统负载" icon="el-icon-data-line">
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

      <SectionCard dense title="各核心使用率" icon="el-icon-data-analysis" scrollable>
        <div class="core-grid">
          <div v-for="c in d.perCore || []" :key="c.name" class="core-item">
            <span class="core-item__name">{{ c.name }}</span>
            <el-progress :percentage="clamp(c.usage)" :stroke-width="8"
              :color="coreColor(c.usage)" class="core-item__bar" />
          </div>
        </div>
      </SectionCard>

      <SectionCard dense title="CPU 时间统计" icon="el-icon-time" scrollable>
        <div class="metric-grid">
          <div v-for="(v, k) in d.times || {}" :key="k" class="grid-metric">
            <div class="grid-metric__label">{{ cpuKeyLabel(k) }}<span class="grid-metric__en">{{ k }}</span></div>
            <div class="grid-metric__value">{{ fmt(v) }}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard dense title="CPU 统计信息" icon="el-icon-data-line" scrollable>
        <div class="metric-grid">
          <div v-for="(v, k) in d.stats || {}" :key="k" class="grid-metric">
            <div class="grid-metric__label">{{ cpuKeyLabel(k) }}<span class="grid-metric__en">{{ k }}</span></div>
            <div class="grid-metric__value">{{ fmt(v) }}</div>
          </div>
        </div>
      </SectionCard>
    </CardGrid>
    </template>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerCpu } from "@/api/monitor-server";

export default {
  name: "ServerCpuInfo",
  components: { StatCard, SectionCard, InfoTable, CardGrid },
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
    isRealSource() {
      return !["simulated", "none"].includes(this.d.source);
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
    cpuKeyLabel(k) {
      const m = {
        user: "用户态", nice: "低优先级用户态", system: "内核态", idle: "空闲",
        iowait: "IO 等待", irq: "硬中断", softirq: "软中断", steal: "被抢占",
        guest: "客户机", guestNice: "客户机(低优先级)",
        ctxSwitches: "上下文切换", interrupts: "中断数", softInterrupts: "软中断数", syscalls: "系统调用",
      };
      return m[k] || k;
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kpi-row {
  flex-shrink: 0;
  margin-bottom: @dense-gap;
}
.section-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  align-content: start;
}
.core-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: @space-sm;
}
.core-item {
  &__name {
    display: block;
    font-size: 12px;
    color: var(--cm-text-regular, @text-regular);
    margin-bottom: 4px;
  }
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: @space-sm;
}
.grid-metric {
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  padding: 8px 10px;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    margin-bottom: 4px;
  }
  &__en {
    margin-left: 4px;
    font-size: 11px;
    color: var(--cm-text-placeholder, #c0c4cc);
  }
  &__value {
    font-size: 15px;
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
    font-size: 20px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-top: 4px;
  }
}
.load-cores {
  margin-top: 8px;
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
</style>
