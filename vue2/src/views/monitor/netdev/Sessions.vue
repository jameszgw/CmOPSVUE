<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-data-line" label="会话使用率" :value="`${num1(st.usagePct)}%`"
          :percent="st.usagePct" color="#9254de" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-histogram" label="当前会话" :value="num0(st.current)"
          :sub="`上限 ${val(st.max)}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-trend-charts" label="新建速率" :value="num0(st.newPerSec)"
          sub="新建会话/秒" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-share" label="TCP 会话" :value="num0(st.tcpSessions)"
          :sub="`UDP ${num0(st.udpSessions)} / ICMP ${num0(st.icmpSessions)}`" color="#e6a23c" />
      </el-col>
    </el-row>

    <SectionCard title="会话表" icon="el-icon-s-grid">
      <div class="usage-line">
        <span class="usage-line__label">会话使用率</span>
        <el-progress :percentage="clamp(st.usagePct)" :stroke-width="14"
          :color="pctColor(st.usagePct)" />
      </div>
      <InfoTable :rows="sessionRows" :columns="2" />
    </SectionCard>

    <SectionCard v-if="d.isFirewall" title="防火墙" icon="el-icon-lock">
      <InfoTable :rows="firewallRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getNetDevSessions } from "@/api/monitor-netdev";

export default {
  name: "NetDevSessions",
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
    st() {
      return this.d.sessionTable || {};
    },
    fw() {
      return this.d.firewall || {};
    },
    sessionRows() {
      const v = this.st;
      return [
        { label: "当前会话", value: this.val(v.current) },
        { label: "最大会话", value: this.val(v.max) },
        { label: "使用率", value: v.usagePct != null ? `${v.usagePct}%` : "-" },
        { label: "新建速率", value: v.newPerSec != null ? `${v.newPerSec}/s` : "-" },
        { label: "TCP 会话", value: this.val(v.tcpSessions) },
        { label: "UDP 会话", value: this.val(v.udpSessions) },
        { label: "ICMP 会话", value: this.val(v.icmpSessions) },
      ];
    },
    firewallRows() {
      const v = this.fw;
      return [
        { label: "策略命中", value: this.val(v.policyHits) },
        { label: "阻断会话", value: this.val(v.blockedSessions) },
        { label: "阻断率", value: v.blockedRate != null ? `${v.blockedRate}%` : "-", color: "#f56c6c" },
        { label: "威胁拦截", value: this.val(v.threatBlocked) },
        { label: "NAT 会话", value: this.val(v.natSessions) },
        { label: "VPN 隧道", value: this.val(v.vpnTunnels) },
        { label: "IPSec 隧道(Up)", value: this.val(v.ipsecTunnelsUp) },
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
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "0" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getNetDevSessions(this.deviceId);
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
.usage-line {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  &__label {
    width: 90px;
    font-size: 13px;
    color: #606266;
    flex-shrink: 0;
  }
  /deep/ .el-progress {
    flex: 1;
  }
}
</style>
