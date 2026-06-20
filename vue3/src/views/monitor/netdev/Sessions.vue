<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="DataLine" label="会话使用率" :value="`${num(st.usagePct)}%`"
        :percent="st.usagePct" color="#9254de" dense />
      <StatCard icon="Histogram" label="当前会话" :value="st.current ?? 0"
        :sub="`上限 ${st.max ?? '-'}`" color="#409eff" dense />
      <StatCard icon="TrendCharts" label="新建速率" :value="st.newPerSec ?? 0"
        sub="新建会话/秒" color="#67c23a" dense />
      <StatCard icon="Share" label="TCP 会话" :value="st.tcpSessions ?? 0"
        :sub="`UDP ${st.udpSessions ?? 0} / ICMP ${st.icmpSessions ?? 0}`" color="#e6a23c" dense />
    </CardGrid>

    <CardGrid min="300px" gap="8px">
      <SectionCard title="会话表" icon="Grid" dense>
        <div class="usage-line">
          <span class="usage-line__label">会话使用率</span>
          <el-progress :percentage="clamp(st.usagePct)" :stroke-width="14"
            :color="pctColor(st.usagePct)" />
        </div>
        <InfoTable :rows="sessionRows" :columns="2" />
      </SectionCard>

      <SectionCard v-if="d.isFirewall" title="防火墙" icon="Lock" dense>
        <InfoTable :rows="firewallRows" :columns="2" />
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getNetDevSessions } from "@/api/monitor-netdev";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const st = computed(() => d.value.sessionTable || {});
const fw = computed(() => d.value.firewall || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};

const sessionRows = computed(() => {
  const v = st.value;
  return [
    { label: "当前会话", value: v.current ?? "-" },
    { label: "最大会话", value: v.max ?? "-" },
    { label: "使用率", value: v.usagePct != null ? `${v.usagePct}%` : "-" },
    { label: "新建速率", value: v.newPerSec != null ? `${v.newPerSec}/s` : "-" },
    { label: "TCP 会话", value: v.tcpSessions ?? "-" },
    { label: "UDP 会话", value: v.udpSessions ?? "-" },
    { label: "ICMP 会话", value: v.icmpSessions ?? "-" },
  ];
});

const firewallRows = computed(() => {
  const v = fw.value;
  return [
    { label: "策略命中", value: v.policyHits ?? "-" },
    { label: "阻断会话", value: v.blockedSessions ?? "-" },
    { label: "阻断率", value: v.blockedRate != null ? `${v.blockedRate}%` : "-", color: "#f56c6c" },
    { label: "威胁拦截", value: v.threatBlocked ?? "-" },
    { label: "NAT 会话", value: v.natSessions ?? "-" },
    { label: "VPN 隧道", value: v.vpnTunnels ?? "-" },
    { label: "IPSec 隧道(Up)", value: v.ipsecTunnelsUp ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getNetDevSessions(props.deviceId);
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
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.usage-line {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  &__label {
    width: 90px;
    font-size: 13px;
    color: var(--cm-text-regular);
    flex-shrink: 0;
  }
  :deep(.el-progress) {
    flex: 1;
  }
}
</style>
