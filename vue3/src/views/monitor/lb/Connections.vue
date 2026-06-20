<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Connection" label="活动连接" :value="conn.active ?? '-'"
        sub="当前活动连接数" color="#67c23a" dense />
      <StatCard icon="Top" label="已接受连接" :value="fmt(conn.accepted)"
        :sub="`已处理 ${fmt(conn.handled)}`" color="#409eff" dense />
      <StatCard icon="Lock" label="SSL 握手" :value="`${num(ssl.handshakeMs)} ms`"
        :sub="`${num(ssl.handshakesPerSec)} 次/秒`" color="#9254de" dense />
      <StatCard icon="Ticket" label="证书剩余天数" :value="`${certDaysLeft} 天`"
        sub="SSL 证书有效期" :color="certColor" dense />
    </CardGrid>

    <SectionCard title="连接状态" icon="Connection" dense>
      <InfoTable :rows="connRows" :columns="2" />
    </SectionCard>

    <CardGrid min="300px" gap="8px">
      <SectionCard title="SSL / TLS" icon="Lock" dense>
        <InfoTable :rows="sslRows" />
      </SectionCard>
      <SectionCard title="安全防护" icon="Shield" dense>
        <InfoTable :rows="securityRows" />
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
import { getLbConnections } from "@/api/monitor-lb";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const fmt = (v) => (v === undefined || v === null ? "-" : Number(v).toLocaleString());

const conn = computed(() => d.value.connections || {});
const ssl = computed(() => d.value.ssl || {});
const security = computed(() => d.value.security || {});

const certDaysLeft = computed(() => ssl.value.certDaysLeft ?? "-");
const certColor = computed(() => {
  const v = Number(ssl.value.certDaysLeft);
  if (Number.isNaN(v)) return "#909399";
  if (v < 7) return "#f56c6c";
  if (v < 30) return "#e6a23c";
  return "#67c23a";
});

const connRows = computed(() => {
  const x = conn.value;
  return [
    { label: "活动连接", value: x.active ?? "-", color: "#67c23a" },
    { label: "读取中", value: x.reading ?? "-" },
    { label: "写入中", value: x.writing ?? "-" },
    { label: "等待中", value: x.waiting ?? "-" },
    { label: "已接受", value: fmt(x.accepted) },
    { label: "已处理", value: fmt(x.handled) },
    { label: "丢弃率", value: `${num(x.droppedRate)}%`, color: Number(x.droppedRate) > 0 ? "#e6a23c" : "#303133" },
  ];
});

const sslRows = computed(() => {
  const x = ssl.value;
  return [
    { label: "握手耗时", value: `${num(x.handshakeMs)} ms` },
    { label: "握手速率", value: `${num(x.handshakesPerSec)} 次/秒` },
    { label: "会话复用率", value: `${num(x.sessionReuseRate)}%`, color: "#67c23a" },
    { label: "握手失败率", value: `${num(x.handshakeFailRate)}%`, color: Number(x.handshakeFailRate) > 1 ? "#f56c6c" : "#303133" },
    { label: "证书剩余天数", value: certDaysLeft.value === "-" ? "-" : `${certDaysLeft.value} 天`, color: certColor.value },
  ];
});

const securityRows = computed(() => {
  const x = security.value;
  return [
    { label: "WAF 拦截数", value: fmt(x.wafBlocked) },
    { label: "WAF 拦截率", value: `${num(x.wafBlockedRate)}%`, color: Number(x.wafBlockedRate) > 0 ? "#e6a23c" : "#303133" },
    { label: "限流次数", value: fmt(x.rateLimited) },
    { label: "限流命中率", value: `${num(x.rateLimitHitRate)}%` },
    { label: "会话保持失败率", value: `${num(x.sessionStickyFailRate)}%`, color: Number(x.sessionStickyFailRate) > 1 ? "#f56c6c" : "#303133" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getLbConnections(props.deviceId);
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
</style>
