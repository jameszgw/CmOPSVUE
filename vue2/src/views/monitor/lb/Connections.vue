<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-connection" label="活动连接"
          :value="connections.active == null ? '-' : connections.active"
          sub="当前活动连接数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-time" label="等待连接"
          :value="connections.waiting == null ? '-' : connections.waiting"
          :sub="`读 ${connections.reading == null ? '-' : connections.reading} / 写 ${connections.writing == null ? '-' : connections.writing}`"
          color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-lock" label="SSL 握手/秒"
          :value="ssl.handshakesPerSec == null ? '-' : ssl.handshakesPerSec"
          :sub="`握手耗时 ${ssl.handshakeMs == null ? '-' : num(ssl.handshakeMs) + ' ms'}`"
          color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-key" label="证书剩余天数"
          :value="ssl.certDaysLeft == null ? '-' : `${ssl.certDaysLeft} 天`"
          sub="SSL 证书有效期" :color="certColor" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="连接统计" icon="el-icon-data-analysis">
          <InfoTable :rows="connRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="SSL / TLS" icon="el-icon-lock">
          <InfoTable :rows="sslRows" :columns="2" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="安全防护" icon="el-icon-s-claim">
      <InfoTable :rows="securityRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getLbConnections } from "@/api/monitor-lb";

export default {
  name: "LbConnections",
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
    connections() {
      return this.d.connections || {};
    },
    ssl() {
      return this.d.ssl || {};
    },
    security() {
      return this.d.security || {};
    },
    certColor() {
      const n = Number(this.ssl.certDaysLeft);
      if (isNaN(n)) return "#909399";
      if (n < 7) return "#f56c6c";
      if (n < 30) return "#e6a23c";
      return "#67c23a";
    },
    connRows() {
      const c = this.connections;
      return [
        { label: "活动连接", value: c.active, color: "#409eff" },
        { label: "读取中", value: c.reading },
        { label: "写入中", value: c.writing },
        { label: "等待中", value: c.waiting },
        { label: "已接受", value: c.accepted },
        { label: "已处理", value: c.handled },
        { label: "丢弃率", value: `${this.num(c.droppedRate)}%`,
          color: this.rateColor(c.droppedRate) },
      ];
    },
    sslRows() {
      const s = this.ssl;
      return [
        { label: "握手耗时", value: s.handshakeMs == null ? "-" : `${this.num(s.handshakeMs)} ms` },
        { label: "握手速率", value: s.handshakesPerSec == null ? "-" : `${s.handshakesPerSec} /s` },
        { label: "会话复用率", value: `${this.num(s.sessionReuseRate)}%`, color: "#67c23a" },
        { label: "握手失败率", value: `${this.num(s.handshakeFailRate)}%`,
          color: this.rateColor(s.handshakeFailRate) },
        { label: "证书剩余天数",
          value: s.certDaysLeft == null ? "-" : `${s.certDaysLeft} 天`,
          color: this.certColor },
      ];
    },
    securityRows() {
      const s = this.security;
      return [
        { label: "WAF 拦截数", value: s.wafBlocked },
        { label: "WAF 拦截率", value: `${this.num(s.wafBlockedRate)}%`,
          color: this.rateColor(s.wafBlockedRate) },
        { label: "限流次数", value: s.rateLimited },
        { label: "限流命中率", value: `${this.num(s.rateLimitHitRate)}%`,
          color: this.rateColor(s.rateLimitHitRate) },
        { label: "会话保持失败率", value: `${this.num(s.sessionStickyFailRate)}%`,
          color: this.rateColor(s.sessionStickyFailRate) },
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
    rateColor(v) {
      const n = Number(v) || 0;
      return n >= 5 ? "#f56c6c" : n >= 1 ? "#e6a23c" : "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getLbConnections(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
