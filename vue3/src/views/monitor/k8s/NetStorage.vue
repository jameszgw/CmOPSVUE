<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="CNI 丢包率"
          :value="`${num(network.packetLossPct)}%`" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Picture" label="镜像拉取失败率"
          :value="`${num(imagePull.failureRatePct)}%`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="PV"
          :value="`${storage.pvBound ?? '-'} / ${storage.pvTotal ?? '-'}`"
          sub="已绑定 / 总数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Files" label="PVC"
          :value="`${storage.pvcBound ?? '-'} / ${storage.pvcTotal ?? '-'}`"
          sub="已绑定 / 总数" color="#67c23a" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="网络" icon="Connection">
          <InfoTable :rows="networkRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="镜像拉取" icon="Picture">
          <InfoTable :rows="imagePullRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="存储概况" icon="Coin">
      <InfoTable :rows="storageRows" :columns="2" />
    </SectionCard>

    <SectionCard title="卷列表" icon="List">
      <el-table :data="storage.volumes || []" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="namespace" label="命名空间" width="140" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark"
              style="border: none; color: #fff">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" width="110" />
        <el-table-column prop="storageClass" label="存储类" min-width="140" />
        <el-table-column label="时延" width="110">
          <template #default="{ row }">{{ ms(row.latencyMs) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!(storage.volumes && storage.volumes.length)" description="暂无卷数据" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sNetStorage } from "@/api/monitor-k8s";

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
const statusColor = (s) => {
  if (s === "Healthy" || s === "Bound" || s === "Normal") return "#67c23a";
  if (s === "Warning" || s === "Pending") return "#e6a23c";
  if (s === "Unhealthy" || s === "Failed") return "#f56c6c";
  return "#909399";
};

const network = computed(() => d.value.network || {});
const imagePull = computed(() => d.value.imagePull || {});
const storage = computed(() => d.value.storage || {});

const networkRows = computed(() => {
  const x = network.value;
  return [
    { label: "CNI 插件", value: x.cniPlugin ?? "-" },
    { label: "CNI 健康", value: x.cniHealth ?? "-", color: statusColor(x.cniHealth) },
    { label: "丢包率", value: x.packetLossPct === undefined || x.packetLossPct === null ? "-" : `${num(x.packetLossPct)}%` },
    { label: "Pod 网络延迟", value: ms(x.podNetworkLatencyMs) },
    { label: "Service 数", value: x.serviceCount ?? "-" },
    { label: "Endpoint 数", value: x.endpointCount ?? "-" },
    { label: "NetworkPolicy", value: x.networkPolicies ?? "-" },
  ];
});

const imagePullRows = computed(() => {
  const x = imagePull.value;
  return [
    { label: "拉取失败率", value: x.failureRatePct === undefined || x.failureRatePct === null ? "-" : `${num(x.failureRatePct)}%` },
    { label: "平均拉取耗时", value: x.avgPullSec === undefined || x.avgPullSec === null ? "-" : `${num(x.avgPullSec)} s` },
    { label: "总拉取次数", value: x.totalPulls ?? "-" },
    { label: "失败次数", value: x.failedPulls ?? "-", color: x.failedPulls ? "#f56c6c" : undefined },
  ];
});

const storageRows = computed(() => {
  const x = storage.value;
  return [
    { label: "CSI 驱动", value: x.csiDriver ?? "-" },
    { label: "卷挂载时延", value: ms(x.volumeAttachLatencyMs) },
    { label: "PV 总数", value: x.pvTotal ?? "-" },
    { label: "PV 已绑定", value: x.pvBound ?? "-", color: "#67c23a" },
    { label: "PV 可用", value: x.pvAvailable ?? "-" },
    { label: "PVC 总数", value: x.pvcTotal ?? "-" },
    { label: "PVC 已绑定", value: x.pvcBound ?? "-", color: "#67c23a" },
    { label: "PVC Pending", value: x.pvcPending ?? "-", color: x.pvcPending ? "#e6a23c" : undefined },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getK8sNetStorage(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
