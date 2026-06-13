<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="API Server" icon="Connection">
          <template #extra>
            <el-tag size="small" :color="statusColor(apiserver.health)" effect="dark"
              style="border: none; color: #fff">
              {{ apiserver.health || "-" }}
            </el-tag>
          </template>
          <InfoTable :rows="apiserverRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="etcd" icon="Coin">
          <template #extra>
            <el-tag size="small" :color="statusColor(etcd.health)" effect="dark"
              style="border: none; color: #fff">
              {{ etcd.health || "-" }}
            </el-tag>
          </template>
          <InfoTable :rows="etcdRows" />
          <div class="progress-row">
            <span class="progress-row__label">DB 使用率</span>
            <el-progress :percentage="clamp(etcd.dbSizeUsagePct)" :stroke-width="10"
              :color="usageColor(etcd.dbSizeUsagePct)" class="progress-row__bar" />
            <span class="progress-row__num">{{ num(etcd.dbSizeUsagePct) }}%</span>
          </div>
        </SectionCard>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="Scheduler" icon="SetUp">
          <template #extra>
            <el-tag size="small" :color="statusColor(scheduler.health)" effect="dark"
              style="border: none; color: #fff">
              {{ scheduler.health || "-" }}
            </el-tag>
          </template>
          <InfoTable :rows="schedulerRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="Controller Manager" icon="Operation">
          <template #extra>
            <el-tag size="small" :color="statusColor(controllerManager.health)" effect="dark"
              style="border: none; color: #fff">
              {{ controllerManager.health || "-" }}
            </el-tag>
          </template>
          <InfoTable :rows="cmRows" />
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sControlPlane } from "@/api/monitor-k8s";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const ms = (v) => (v === undefined || v === null ? "-" : `${Number(v).toFixed(1)} ms`);
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const usageColor = (v) => (v > 90 ? "#f56c6c" : v > 70 ? "#e6a23c" : "#67c23a");
const statusColor = (s) => {
  if (s === "Healthy" || s === "Bound" || s === "Normal") return "#67c23a";
  if (s === "Warning" || s === "Pending") return "#e6a23c";
  if (s === "Unhealthy" || s === "Failed") return "#f56c6c";
  return "#909399";
};

const apiserver = computed(() => d.value.apiserver || {});
const etcd = computed(() => d.value.etcd || {});
const scheduler = computed(() => d.value.scheduler || {});
const controllerManager = computed(() => d.value.controllerManager || {});

const apiserverRows = computed(() => {
  const x = apiserver.value;
  return [
    { label: "延迟 P50", value: ms(x.latencyP50) },
    { label: "延迟 P99", value: ms(x.latencyP99) },
    { label: "QPS", value: x.qps ?? "-" },
    { label: "错误率", value: x.errorRate === undefined || x.errorRate === null ? "-" : `${num(x.errorRate)}%` },
    { label: "处理中请求", value: x.inflightRequests ?? "-" },
  ];
});

const etcdRows = computed(() => {
  const x = etcd.value;
  return [
    { label: "Leader 状态", value: x.hasLeader ? "有 Leader" : "无 Leader", color: x.hasLeader ? "#67c23a" : "#f56c6c" },
    { label: "DB 大小", value: x.dbSize ?? "-" },
    { label: "fsync P99", value: ms(x.fsyncP99) },
    { label: "commit P99", value: ms(x.commitP99) },
    { label: "Leader 切换次数", value: x.leaderChanges ?? "-" },
  ];
});

const schedulerRows = computed(() => {
  const x = scheduler.value;
  return [
    { label: "调度延迟 P99", value: ms(x.schedulingLatencyP99) },
    { label: "Pending Pod", value: x.pendingPods ?? "-" },
    { label: "调度速率", value: x.scheduleRate ?? "-" },
  ];
});

const cmRows = computed(() => {
  const x = controllerManager.value;
  return [
    { label: "工作队列深度", value: x.workqueueDepth ?? "-" },
    { label: "队列延迟 P99", value: ms(x.workqueueLatencyP99) },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getK8sControlPlane(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
.progress-row {
  display: flex;
  align-items: center;
  margin-top: 14px;
  &__label {
    font-size: 13px;
    color: #606266;
    width: 80px;
    flex-shrink: 0;
  }
  &__bar {
    flex: 1;
  }
  &__num {
    margin-left: 10px;
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
  }
}
</style>
