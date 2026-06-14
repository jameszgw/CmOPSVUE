<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Sunny" label="SoC温度" :value="`${num(d.socTemp)}°C`"
          :color="tempColor(d.socTemp)" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="WindPower" label="风扇转速" :value="`${d.fanRpm ?? '-'} rpm`"
          :sub="`占空比 ${d.fanDutyPct ?? '-'}%`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Lightning" label="供电" :value="`${num(d.supplyVoltage)} V`"
          :sub="`${num(d.supplyCurrent)} A · ${num(d.powerWatt)} W`" :color="powerColor" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="电源状态"
          :value="statusText" :color="statusCardColor" />
      </el-col>
    </el-row>

    <SectionCard title="电源/限频状态" icon="Cpu">
      <div class="tag-row">
        <el-tag :type="d.underVoltage ? 'danger' : 'success'" effect="dark">
          欠压：{{ d.underVoltage ? "是" : "否" }}
        </el-tag>
        <el-tag :type="d.throttledNow ? 'warning' : 'success'" effect="dark">
          当前降频：{{ d.throttledNow ? "是" : "否" }}
        </el-tag>
        <el-tag :type="d.throttledEver ? 'warning' : 'info'" effect="plain">
          曾经降频：{{ d.throttledEver ? "是" : "否" }}
        </el-tag>
        <el-tag :type="d.freqCapped ? 'warning' : 'success'" effect="dark">
          限频：{{ d.freqCapped ? "是" : "否" }}
        </el-tag>
      </div>
    </SectionCard>

    <SectionCard title="热区传感器" icon="Sunny">
      <template #extra>共 {{ thermals.length }} 个热区</template>
      <el-empty v-if="!thermals.length" description="暂无数据" />
      <el-table v-else :data="thermals" size="small" stripe>
        <el-table-column prop="zone" label="热区" min-width="160">
          <template #default="{ row }">{{ row.zone || "-" }}</template>
        </el-table-column>
        <el-table-column label="温度" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: tempColor(row.temp), fontWeight: 600 }">
              {{ row.temp != null ? `${row.temp}°C` : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="thermalTagType(row.status)" size="small">{{ row.status || "-" }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getSbcBoardSensors } from "@/api/monitor-sbc";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const thermals = computed(() => d.value.thermals || []);

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const tempColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 85) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#409eff";
};
const powerColor = computed(() => (d.value.underVoltage ? "#f56c6c" : "#67c23a"));
const abnormal = computed(
  () => d.value.underVoltage || d.value.throttledNow || d.value.freqCapped
);
const statusText = computed(() => (abnormal.value ? "异常" : "正常"));
const statusCardColor = computed(() => (abnormal.value ? "#f56c6c" : "#67c23a"));
const thermalTagType = (s) => {
  if (["normal", "OK", "正常"].includes(s)) return "success";
  if (["warning", "警告"].includes(s)) return "warning";
  if (["critical", "alert", "异常"].includes(s)) return "danger";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getSbcBoardSensors(props.deviceId);
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
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
