<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="端口" :value="`${d.portUp ?? 0}/${d.portTotal ?? 0}`"
          :sub="`Up ${d.portUp ?? 0} / Down ${d.portDown ?? 0}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Odometer" label="CPU 使用率" :value="`${num(d.cpuPct)}%`"
          :percent="d.cpuPct" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="丢包率" :value="`${num(d.totalPacketLoss)}%`"
          :sub="`内存使用率 ${num(d.memPct)}%`" :color="pctColor(d.totalPacketLoss)" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="DataLine" label="会话使用率" :value="`${num(d.sessionUsagePct)}%`"
          :percent="d.sessionUsagePct" color="#9254de" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="InfoFilled">
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="设备状态" icon="SetUp">
          <div class="status-grid">
            <div v-for="s in statusItems" :key="s.label" class="status-item">
              <span class="status-item__label">{{ s.label }}</span>
              <el-tag size="small" :color="statusColor(s.value)" effect="dark" class="plain-tag">
                {{ s.value || "-" }}
              </el-tag>
            </div>
          </div>
          <div class="metric-grid">
            <div class="metric-item">
              <span class="metric-item__label">温度</span>
              <span class="metric-item__value" :style="{ color: tempColor(d.temperature) }">
                {{ d.temperature ?? "-" }}<small v-if="d.temperature != null">℃</small>
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">入流量</span>
              <span class="metric-item__value">{{ d.inThroughput ?? "-" }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">出流量</span>
              <span class="metric-item__value">{{ d.outThroughput ?? "-" }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-item__label">运行时长</span>
              <span class="metric-item__value">{{ d.uptime ?? "-" }}</span>
            </div>
          </div>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getNetDevOverview } from "@/api/monitor-netdev";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const tempColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 75) return "#f56c6c";
  if (n >= 60) return "#e6a23c";
  return "#303133";
};
const statusColor = (s) => {
  if (["up", "online", "normal", "Established", "active", "Normal", "Up", "Online"].includes(s)) return "#67c23a";
  if (["near-full", "degraded", "warning", "Warning"].includes(s)) return "#e6a23c";
  if (["down", "offline", "failed", "Down", "Offline", "Failed"].includes(s)) return "#f56c6c";
  return "#909399";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "设备类型", value: v.netDevType },
    { label: "厂商", value: v.vendor },
    { label: "型号", value: v.model },
    { label: "IP 地址", value: v.ip },
    { label: "状态", value: v.status },
    { label: "运行时长", value: v.uptime },
  ];
});

const statusItems = computed(() => {
  const v = d.value;
  return [
    { label: "风扇状态", value: v.fanStatus },
    { label: "电源状态", value: v.powerStatus },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getNetDevOverview(props.deviceId);
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
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 14px;

  &__label {
    font-size: 13px;
    color: #606266;
  }
}
.plain-tag {
  border: none;
  color: #fff;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;

  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }
  &__value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;

    small {
      font-size: 12px;
      font-weight: 400;
      margin-left: 2px;
    }
  }
}
</style>
