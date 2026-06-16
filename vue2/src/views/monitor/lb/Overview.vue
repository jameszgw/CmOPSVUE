<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="QPS"
          :value="d.qps == null ? '-' : d.qps" sub="每秒请求数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-warning-outline" label="5xx 错误率"
          :value="`${num(d.error5xxRate)}%`" :sub="`4xx ${num(d.error4xxRate)}%`"
          :color="rateColor(d.error5xxRate)" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-connection" label="活动连接"
          :value="d.activeConnections == null ? '-' : d.activeConnections"
          sub="实时活动连接数" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-cpu" label="上游健康"
          :value="`${d.upstreamHealthy == null ? '-' : d.upstreamHealthy} / ${d.upstreamTotal == null ? '-' : d.upstreamTotal}`"
          :sub="`异常 ${d.upstreamUnhealthy == null ? '-' : d.upstreamUnhealthy}`"
          :color="d.upstreamUnhealthy ? '#e6a23c' : '#67c23a'" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="流量概况" icon="el-icon-data-line">
          <InfoTable :rows="trafficRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="上游健康" icon="el-icon-cpu">
      <div class="health-block">
        <div class="health-block__head">
          <span class="health-block__title">健康节点占比</span>
          <span class="health-block__state" :style="{ color: healthColor }">
            {{ d.upstreamHealthy == null ? '-' : d.upstreamHealthy }}
            / {{ d.upstreamTotal == null ? '-' : d.upstreamTotal }}
          </span>
        </div>
        <el-progress :percentage="healthPercent" :stroke-width="12" :color="healthColor" />
      </div>
      <InfoTable :rows="healthRows" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getLbOverview } from "@/api/monitor-lb";

export default {
  name: "LbOverview",
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
    healthPercent() {
      const h = Number(this.d.upstreamHealthy) || 0;
      const t = Number(this.d.upstreamTotal) || 0;
      return t > 0 ? this.clamp((h / t) * 100) : 0;
    },
    healthColor() {
      if (this.d.upstreamUnhealthy) {
        const t = Number(this.d.upstreamTotal) || 0;
        const u = Number(this.d.upstreamUnhealthy) || 0;
        return t > 0 && u / t >= 0.5 ? "#f56c6c" : "#e6a23c";
      }
      return "#67c23a";
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "负载均衡类型", value: d.lbType },
        { label: "版本", value: d.version },
        { label: "监听地址", value: d.address },
        { label: "运行状态", value: d.status, color: this.statusColor(d.status) },
        { label: "运行时间", value: d.uptime },
        { label: "SSL", value: d.sslEnabled ? "已启用" : "未启用",
          color: d.sslEnabled ? "#67c23a" : "#909399" },
      ];
    },
    trafficRows() {
      const d = this.d;
      return [
        { label: "QPS", value: d.qps == null ? "-" : `${d.qps} req/s`, color: "#409eff" },
        { label: "总请求数", value: d.totalRequests },
        { label: "平均延迟", value: d.avgLatencyMs == null ? "-" : `${this.num(d.avgLatencyMs)} ms` },
        { label: "入站速率", value: d.inBytesRate },
        { label: "出站速率", value: d.outBytesRate },
        { label: "WAF 拦截率", value: `${this.num(d.wafBlockedRate)}%` },
      ];
    },
    healthRows() {
      const d = this.d;
      return [
        { label: "健康节点", value: d.upstreamHealthy, color: "#67c23a" },
        { label: "异常节点", value: d.upstreamUnhealthy,
          color: d.upstreamUnhealthy ? "#f56c6c" : "#67c23a" },
        { label: "节点总数", value: d.upstreamTotal },
        { label: "4xx 错误率", value: `${this.num(d.error4xxRate)}%` },
        { label: "5xx 错误率", value: `${this.num(d.error5xxRate)}%`,
          color: this.rateColor(d.error5xxRate) },
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
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    statusColor(s) {
      const v = String(s || "").toLowerCase();
      if (["up", "online", "active", "running", "正常"].some((k) => v.includes(k))) return "#67c23a";
      if (["down", "offline", "failed", "异常"].some((k) => v.includes(k))) return "#f56c6c";
      return "#303133";
    },
    rateColor(v) {
      const n = Number(v) || 0;
      return n >= 5 ? "#f56c6c" : n >= 1 ? "#e6a23c" : "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getLbOverview(this.deviceId);
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
.health-block {
  margin-bottom: 16px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__title {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__state {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
  }
}
</style>
