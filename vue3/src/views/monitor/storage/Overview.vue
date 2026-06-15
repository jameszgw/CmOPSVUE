<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="PieChart" label="容量使用率" :value="`${num(d.usagePct)}%`"
          :percent="d.usagePct" :color="usageColor" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Odometer" label="IOPS" :value="kfmt(d.iops)"
          sub="每秒读写次数" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="DataLine" label="吞吐" :value="d.throughput || '-'"
          sub="读写吞吐量" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Timer" label="平均延迟" :value="`${num(d.avgLatencyMs)} ms`"
          sub="平均访问延迟" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard title="基础信息" icon="InfoFilled">
      <template #extra>
        <el-tag size="small" :type="d.source === 'agent' ? 'success' : 'info'" style="margin-right: 6px">
          {{ d.source === "agent" ? "真实采集" : "模拟数据" }}
        </el-tag>
        存储池 {{ d.poolCount ?? "-" }} 个
      </template>
      <InfoTable :rows="basicRows" :columns="2" />
    </SectionCard>

    <SectionCard v-if="isCeph" title="OSD / PG 状态" icon="Cpu">
      <template #extra>Ceph 集群</template>
      <InfoTable :rows="cephRows" :columns="2" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStorageOverview } from "@/api/monitor-storage";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null || v === "" ? "-" : Number(v).toFixed(1));
const kfmt = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return `${n}`;
};

const HEALTH_COLOR = { ok: "#67c23a", healthy: "#67c23a", warn: "#e6a23c", warning: "#e6a23c", error: "#f56c6c", critical: "#f56c6c" };
const healthColor = computed(() => HEALTH_COLOR[String(d.value.health || "").toLowerCase()] || "#909399");

const usageColor = computed(() => {
  const p = Number(d.value.usagePct) || 0;
  return p >= 90 ? "#f56c6c" : p >= 75 ? "#e6a23c" : "#409eff";
});

const isCeph = computed(() => d.value.osdTotal !== undefined && d.value.osdTotal !== null);

const basicRows = computed(() => {
  const b = d.value;
  return [
    { label: "存储类型", value: b.storageType || "-" },
    { label: "厂商", value: b.vendor || "-" },
    { label: "地址", value: b.address || "-" },
    { label: "健康状态", value: b.healthText || b.health || "-", color: healthColor.value, tag: b.health },
    { label: "总容量", value: b.totalCapacity || "-" },
    { label: "已用容量", value: b.usedCapacity || "-" },
    { label: "可用容量", value: b.availableCapacity || "-" },
    { label: "存储池数", value: b.poolCount ?? "-" },
  ];
});

const cephRows = computed(() => {
  const b = d.value;
  return [
    { label: "OSD 总数", value: b.osdTotal ?? "-" },
    { label: "OSD 在线", value: b.osdUp ?? "-", color: "#67c23a" },
    { label: "OSD 离线", value: b.osdDown ?? "-", color: (b.osdDown ? "#f56c6c" : undefined) },
    { label: "Mon 法定人数", value: b.monQuorum ?? "-" },
    { label: "PG 总数", value: b.pgTotal ?? "-" },
    { label: "PG active+clean", value: b.pgActiveClean ?? "-", color: "#67c23a" },
    { label: "PG degraded", value: b.pgDegraded ?? "-", color: (b.pgDegraded ? "#e6a23c" : undefined) },
    { label: "Scrub 错误", value: b.scrubErrors ?? "-", color: (b.scrubErrors ? "#f56c6c" : undefined) },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getStorageOverview(props.deviceId);
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
