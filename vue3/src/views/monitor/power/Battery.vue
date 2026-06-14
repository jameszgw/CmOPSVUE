<template>
  <div v-loading="loading" class="tab-pane">
    <template v-if="!d.supported">
      <SectionCard title="电池" icon="Lightning">
        <el-empty :description="d.note || '该设备不支持电池监控'" />
      </SectionCard>
    </template>
    <template v-else>
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Lightning" label="电量" :value="`${num(d.soc)}%`"
            :percent="d.soc" color="#13c2c2" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="CircleCheck" label="健康度" :value="`${num(d.healthPct)}%`"
            :percent="d.healthPct" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Timer" label="续航" :value="`${d.runtimeMin ?? '-'} min`" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="RefreshRight" label="循环次数" :value="d.cycleCount ?? '-'" color="#e6a23c" />
        </el-col>
      </el-row>

      <SectionCard title="电池详情" icon="InfoFilled">
        <InfoTable :rows="detailRows" :columns="2" />
      </SectionCard>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getPowerBattery } from "@/api/monitor-power";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const detailRows = computed(() => {
  const v = d.value;
  return [
    { label: "SOC", value: v.soc != null ? `${v.soc}%` : "-" },
    { label: "健康度", value: v.healthPct != null ? `${v.healthPct}%` : "-" },
    { label: "电压", value: v.voltage != null ? `${v.voltage} V` : "-" },
    { label: "电流", value: v.current != null ? `${v.current} A` : "-" },
    { label: "温度", value: v.temperature != null ? `${v.temperature} °C` : "-" },
    { label: "循环次数", value: v.cycleCount ?? "-" },
    { label: "上次自检", value: v.lastSelfTest ?? "-" },
    { label: "状态", value: v.status ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getPowerBattery(props.deviceId);
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
</style>
