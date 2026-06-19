<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '已禁用模拟数据，暂无真实采集数据'" />
    <template v-else>
    <CardGrid min="180px" gap="8px">
      <StatCard dense icon="Top" label="上传速度" :value="d.upSpeed || '-'"
        sub="当前上行速率" color="#409eff" />
      <StatCard dense icon="Bottom" label="下载速度" :value="d.downSpeed || '-'"
        sub="当前下行速率" color="#67c23a" />
      <StatCard dense icon="Upload" label="总发送" :value="d.totalSent || '-'"
        sub="累计发送流量" color="#e6a23c" />
      <StatCard dense icon="Download" label="总接收" :value="d.totalRecv || '-'"
        sub="累计接收流量" color="#909399" />
      <StatCard dense icon="Refresh" label="TCP 重传率" :value="`${num(d.maxRetransRate)}%`"
        sub="接口最大重传率" color="#e6a23c" />
      <StatCard dense icon="CircleClose" label="丢包率" :value="`${num(d.maxLossRate)}%`"
        sub="接口最大丢包率" color="#f56c6c" />
    </CardGrid>

    <CardGrid min="340px" gap="8px">
      <SectionCard dense v-for="(itf, i) in d.interfaces || []" :key="i" :title="itf.name || `接口 ${i + 1}`"
        icon="Connection">
        <template #extra>
          <el-tag v-if="i === 0" size="small" :type="isRealSource ? 'success' : 'info'" style="margin-right: 6px">
            获取方式：{{ d.collectViaLabel || "-" }} · 来源：{{ d.sourceLabel || "-" }}
          </el-tag>
          <el-tag size="small" :type="statusType(itf.status)" effect="plain">{{ itf.status || '-' }}</el-tag>
        </template>
        <InfoTable :rows="interfaceRows(itf)" :columns="2" />
      </SectionCard>
    </CardGrid>

    <CardGrid min="320px" gap="8px">
      <SectionCard dense title="TCP 连接状态" icon="Connection">
        <el-row :gutter="8">
          <el-col v-for="item in connStateCards" :key="item.label" :xs="12" :sm="8">
            <div class="grid-metric">
              <div class="grid-metric__label">{{ item.label }}</div>
              <div class="grid-metric__value" :style="{ color: item.color }">
                {{ item.value ?? '-' }}
              </div>
            </div>
          </el-col>
        </el-row>
      </SectionCard>
      <SectionCard dense title="网络总计统计" icon="DataAnalysis">
        <el-row :gutter="8">
          <el-col :xs="24" :sm="12">
            <div class="io-block">
              <div class="io-block__head">发送统计</div>
              <InfoTable :rows="sentRows" />
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="io-block">
              <div class="io-block__head">接收统计</div>
              <InfoTable :rows="recvRows" />
            </div>
          </el-col>
        </el-row>
      </SectionCard>
      <SectionCard dense title="实时网络 IO" icon="Histogram">
        <el-row :gutter="8">
          <el-col :xs="24" :sm="12">
            <div class="grid-metric">
              <div class="grid-metric__label">上传速度</div>
              <div class="grid-metric__value" style="color: #409eff">{{ d.realtime?.upSpeed || '-' }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="grid-metric">
              <div class="grid-metric__label">下载速度</div>
              <div class="grid-metric__value" style="color: #67c23a">{{ d.realtime?.downSpeed || '-' }}</div>
            </div>
          </el-col>
        </el-row>
      </SectionCard>
    </CardGrid>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerNetwork } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

// 真实采集来源（非模拟/无数据）则徽标用 success
const isRealSource = computed(() => !["simulated", "none"].includes(d.value.source));

const statusType = (s) => {
  const v = String(s || "").toLowerCase();
  return v === "up" || v.includes("在线") || v.includes("连接") ? "success" : "info";
};

const interfaceRows = (itf) => [
  { label: "接口名称", value: itf.name, color: "#409eff" },
  { label: "状态", value: itf.status },
  { label: "速率", value: itf.speed },
  { label: "MTU", value: itf.mtu },
  { label: "发送字节", value: itf.sentBytes },
  { label: "接收字节", value: itf.recvBytes },
  { label: "发送包数", value: itf.sentPackets },
  { label: "接收包数", value: itf.recvPackets },
  { label: "发送错误", value: itf.sentErrors },
  { label: "接收错误", value: itf.recvErrors },
  { label: "重传率", value: `${num(itf.retransRate)}%`, color: "#e6a23c" },
  { label: "丢包率", value: `${num(itf.lossRate)}%`, color: "#f56c6c" },
];

const connStateCards = computed(() => {
  const c = d.value.connStates || {};
  return [
    { label: "ESTABLISHED", value: c.established, color: "#67c23a" },
    { label: "TIME_WAIT", value: c.timeWait, color: "#409eff" },
    { label: "CLOSE_WAIT", value: c.closeWait, color: "#e6a23c" },
    { label: "LISTEN", value: c.listen, color: "#909399" },
    { label: "SYN_RECV", value: c.synRecv, color: "#f56c6c" },
  ];
});

const sentRows = computed(() => {
  const s = d.value.totalStats?.sent || {};
  return [
    { label: "发送字节", value: s.bytes },
    { label: "发送包数", value: s.packets },
    { label: "发送错误", value: s.errors },
    { label: "发送丢包", value: s.drops },
  ];
});

const recvRows = computed(() => {
  const r = d.value.totalStats?.recv || {};
  return [
    { label: "接收字节", value: r.bytes },
    { label: "接收包数", value: r.packets },
    { label: "接收错误", value: r.errors },
    { label: "接收丢包", value: r.drops },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerNetwork(props.deviceId);
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
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: @dense-gap;
}
.io-block {
  &__head {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary);
    margin-bottom: 8px;
  }
}
.grid-metric {
  border: 1px solid var(--cm-bg-page);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 4px;
  }
  &__value {
    font-size: 18px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
</style>
