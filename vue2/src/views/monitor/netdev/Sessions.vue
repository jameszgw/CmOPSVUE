<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-data-line" label="会话使用率" :value="`${num1(st.usagePct)}%`"
        :percent="st.usagePct" color="#9254de" />
      <StatCard dense icon="el-icon-histogram" label="当前会话" :value="num0(st.current)"
        :sub="`上限 ${val(st.max)}`" color="#409eff" />
      <StatCard dense icon="el-icon-trend-charts" label="新建速率" :value="num0(st.newPerSec)"
        sub="新建会话/秒" color="#67c23a" />
      <StatCard dense icon="el-icon-share" label="TCP 会话" :value="num0(st.tcpSessions)"
        :sub="`UDP ${num0(st.udpSessions)} / ICMP ${num0(st.icmpSessions)}`" color="#e6a23c" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable title="会话表" icon="el-icon-s-grid">
        <div class="usage-line">
          <span class="usage-line__label">会话使用率</span>
          <el-progress :percentage="clamp(st.usagePct)" :stroke-width="14"
            :color="pctColor(st.usagePct)" />
        </div>
        <InfoTable :rows="sessionRows" :columns="2" />
      </SectionCard>

      <SectionCard v-if="d.isFirewall" dense scrollable title="防火墙" icon="el-icon-lock">
        <InfoTable :rows="firewallRows" :columns="2" />
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getNetDevSessions } from "@/api/monitor-netdev";

export default {
  name: "NetDevSessions",
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
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
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
@import (reference) "@/styles/variables.less";
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  overflow: hidden;
}
.usage-line {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  &__label {
    width: 90px;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
    flex-shrink: 0;
  }
  /deep/ .el-progress {
    flex: 1;
  }
}
</style>
