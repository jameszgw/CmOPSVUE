<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-odometer" label="每秒操作数" :value="d.opsPerSec == null ? '-' : d.opsPerSec"
        sub="OPS" color="#409eff" />
      <stat-card dense icon="el-icon-aim" label="缓存命中率" :value="`${num(d.hitRate)}%`"
        :percent="d.hitRate" color="#67c23a" />
      <stat-card dense icon="el-icon-data-line" label="总命令数" :value="fmt(d.totalCommands)"
        sub="累计处理" color="#e6a23c" />
      <stat-card dense icon="el-icon-connection" label="总连接数" :value="fmt(d.totalConnections)"
        sub="累计连接" color="#909399" />
    </card-grid>

    <card-grid min="320px" gap="8px" class="content-grid">
      <section-card dense title="命令统计" icon="el-icon-data-line">
        <InfoTable :rows="cmdRows" />
      </section-card>

      <section-card dense title="连接统计" icon="el-icon-connection">
        <InfoTable :rows="connRows" />
      </section-card>

      <section-card dense title="键操作统计" icon="el-icon-key">
        <InfoTable :rows="keyOpsRows" />
      </section-card>

      <section-card dense title="同步统计" icon="el-icon-refresh">
        <InfoTable :rows="syncRows" />
      </section-card>

      <section-card dense title="指标说明" icon="el-icon-data-analysis">
        <el-row :gutter="16">
          <el-col v-for="f in metricDesc" :key="f.label" :xs="24" :sm="12">
            <div class="metric-desc">
              <div class="metric-desc__label">{{ f.label }}</div>
              <div class="metric-desc__text">{{ f.text }}</div>
            </div>
          </el-col>
        </el-row>
      </section-card>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisStatistics } from "@/api/monitor-redis";

export default {
  name: "RedisStatistics",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    cmdRows() {
      const c = this.d.cmdStats || {};
      return [
        { label: "总命令数", value: this.fmt(c.totalCommands) },
        { label: "每秒操作数", value: c.opsPerSec, color: "#409eff" },
        { label: "键空间命中", value: this.fmt(c.keyspaceHits), color: "#67c23a" },
        { label: "键空间未命中", value: this.fmt(c.keyspaceMisses), color: "#f56c6c" },
        { label: "命中率", value: c.hitRate == null ? "-" : `${this.num(c.hitRate)}%`, color: "#67c23a" },
      ];
    },
    connRows() {
      const c = this.d.connStats || {};
      return [
        { label: "总连接数", value: this.fmt(c.totalConnections) },
        { label: "拒绝连接数", value: c.rejectedConnections, color: "#f56c6c" },
        { label: "总输入流量", value: c.totalInputBytes },
        { label: "总输出流量", value: c.totalOutputBytes },
        { label: "输入速率", value: c.netInputRate, color: "#409eff" },
        { label: "输出速率", value: c.netOutputRate, color: "#67c23a" },
      ];
    },
    keyOpsRows() {
      const k = this.d.keyOps || {};
      return [
        { label: "过期键数量", value: this.fmt(k.expiredKeys), color: "#e6a23c" },
        { label: "驱逐键数量", value: this.fmt(k.evictedKeys), color: "#f56c6c" },
        { label: "键空间命中", value: this.fmt(k.keyspaceHits), color: "#67c23a" },
        { label: "键空间未命中", value: this.fmt(k.keyspaceMisses), color: "#909399" },
      ];
    },
    syncRows() {
      const s = this.d.syncStats || {};
      return [
        { label: "完整同步", value: s.fullSync },
        { label: "部分同步成功", value: s.partialOk },
        { label: "部分同步失败", value: s.partialErr, color: "#f56c6c" },
        { label: "主从复制偏移", value: this.fmt(s.masterReplOffset) },
        { label: "最近fork耗时", value: s.lastForkUsec == null ? "-" : `${s.lastForkUsec} μs` },
      ];
    },
    metricDesc() {
      return [
        { label: "每秒操作数", text: "Redis每秒处理的命令数，反映实时负载" },
        { label: "命中率", text: "键空间命中占总查询的比例" },
        { label: "拒绝连接", text: "超过最大连接数限制被拒绝的连接" },
        { label: "驱逐键数量", text: "因内存不足被淘汰的键数量" },
        { label: "完整同步", text: "主从全量同步次数" },
        { label: "最近fork耗时", text: "最近一次fork操作的耗时（微秒）" },
      ];
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
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000
        ? v.toLocaleString()
        : v == null
        ? "-"
        : v;
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getRedisStatistics(this.deviceId);
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
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: @dense-gap;
}
.kpi-grid {
  flex-shrink: 0;
}
.content-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  align-content: start;
}
.metric-desc {
  padding: 12px 14px;
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  margin-bottom: 12px;
  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-bottom: 4px;
  }
  &__text {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
</style>
