<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Box" label="Broker" :value="`${d.brokerOnline ?? 0}/${d.brokerTotal ?? 0}`"
          :sub="`在线 ${d.brokerOnline ?? 0} / 离线 ${d.brokerOffline ?? 0}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Collection" label="主题数" :value="d.topicCount ?? 0"
          :sub="`分区 ${d.partitionCount ?? 0} / 消费组 ${d.consumerGroupCount ?? 0}`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Upload" label="生产速率" :value="`${num(d.produceRate)}`"
          sub="msg/s" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="消费积压" :value="num0(d.totalLag)"
          :sub="`积压消息 ${num0(d.messageBacklog)}`" :color="lagColor(d.totalLag)" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="InfoFilled">
          <template #extra>
            <el-tag size="small" :type="d.source === 'agent' ? 'success' : 'info'" style="margin-right: 6px">
              {{ d.source === "agent" ? "真实采集" : "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="吞吐统计" icon="Histogram">
          <InfoTable :rows="throughputRows" :columns="2" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="集群健康" icon="FirstAidKit">
      <div class="health-grid">
        <div class="health-item">
          <span class="health-item__label">副本不足分区</span>
          <span class="health-item__value" :style="{ color: countColor(d.underReplicated) }">
            {{ d.underReplicated ?? 0 }}
          </span>
        </div>
        <div class="health-item">
          <span class="health-item__label">离线分区</span>
          <span class="health-item__value" :style="{ color: countColor(d.offlinePartitions) }">
            {{ d.offlinePartitions ?? 0 }}
          </span>
        </div>
        <div class="health-item">
          <span class="health-item__label">Controller</span>
          <span class="health-item__value" :style="{ color: d.controllerActive ? '#67c23a' : '#f56c6c' }">
            {{ d.controllerActive ? "正常" : "异常" }}
          </span>
        </div>
      </div>
      <div class="disk-line">
        <span class="disk-line__label">磁盘使用率</span>
        <el-progress :percentage="clamp(d.diskUsagePct)" :stroke-width="14"
          :color="pctColor(d.diskUsagePct)" />
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getMqOverview } from "@/api/monitor-mq";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const num0 = (v) => (v === undefined || v === null ? "-" : Number(v).toLocaleString());
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const countColor = (v) => (Number(v) > 0 ? "#f56c6c" : "#67c23a");
const lagColor = (v) => (Number(v) > 0 ? "#e6a23c" : "#67c23a");

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "MQ 类型", value: v.mqType },
    { label: "版本", value: v.version },
    { label: "地址", value: v.address },
    { label: "Broker 总数", value: v.brokerTotal },
    { label: "主题数", value: v.topicCount },
    { label: "分区数", value: v.partitionCount },
    { label: "消费组数", value: v.consumerGroupCount },
    { label: "消息总数", value: v.totalMessages != null ? Number(v.totalMessages).toLocaleString() : undefined },
  ];
});

const throughputRows = computed(() => {
  const v = d.value;
  return [
    { label: "生产速率", value: v.produceRate != null ? `${v.produceRate} msg/s` : undefined },
    { label: "消费速率", value: v.consumeRate != null ? `${v.consumeRate} msg/s` : undefined },
    { label: "入流量", value: v.inRate },
    { label: "出流量", value: v.outRate },
    { label: "总积压", value: v.totalLag != null ? Number(v.totalLag).toLocaleString() : undefined },
    { label: "积压消息", value: v.messageBacklog != null ? Number(v.messageBacklog).toLocaleString() : undefined },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getMqOverview(props.deviceId);
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.health-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
.health-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  padding: 16px 12px;

  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
  }
}
.disk-line {
  display: flex;
  align-items: center;

  &__label {
    width: 96px;
    font-size: 13px;
    color: var(--cm-text-regular);
    flex-shrink: 0;
  }
  :deep(.el-progress) {
    flex: 1;
  }
}
</style>
