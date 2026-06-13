<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="连接使用率" :value="`${num(connUsage)}%`"
          :percent="connUsage" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="数据库大小" :value="d.dbSize || '-'"
          :sub="storage.sizeMb != null ? `${storage.sizeMb} MB` : ''" color="#9254de" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Odometer" label="缓存命中率" :value="`${num(hitRate)}%`"
          :percent="hitRate" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Histogram" label="活动连接" :value="d.activeConnections ?? '-'"
          sub="当前活动连接数" color="#e6a23c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基本信息" icon="InfoFilled">
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="连接信息" icon="Connection">
          <InfoTable :rows="connRows" />
          <div class="progress-row">
            <span class="progress-row__label">连接使用率</span>
            <el-progress :percentage="clamp(connUsage)" :stroke-width="10"
              :color="usageColor(connUsage)" class="progress-row__bar" />
            <span class="progress-row__num">{{ num(connUsage) }}%</span>
          </div>
        </SectionCard>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="存储信息" icon="Coin">
          <InfoTable :rows="storageRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="性能统计" icon="TrendCharts">
          <div class="progress-row">
            <span class="progress-row__label">缓存命中率</span>
            <el-progress :percentage="clamp(hitRate)" :stroke-width="10"
              :color="usageColor(hitRate)" class="progress-row__bar" />
            <span class="progress-row__num">{{ num(hitRate) }}%</span>
          </div>
          <InfoTable :rows="perfRows" />
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
import { getDatabaseOverview } from "@/api/monitor-database";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const usageColor = (v) => (v > 90 ? "#f56c6c" : v > 70 ? "#e6a23c" : "#67c23a");

const connUsage = computed(() => d.value.connUsage ?? d.value.connection?.usage);
const hitRate = computed(() => d.value.hitRate ?? d.value.performance?.hitRate);
const storage = computed(() => d.value.storage || {});

const basicRows = computed(() => {
  const b = d.value.basic || {};
  return [
    { label: "数据库类型", value: b.dbType, color: "#67c23a" },
    { label: "主机地址", value: b.host },
    { label: "数据库名", value: b.dbName },
    { label: "版本", value: b.version },
    { label: "运行时间", value: b.uptime },
    { label: "时区", value: b.timezone },
    { label: "字符集", value: b.charset },
  ];
});

const connRows = computed(() => {
  const c = d.value.connection || {};
  return [
    { label: "总连接数", value: c.total ?? "-" },
    { label: "最大连接数", value: c.max ?? "-" },
    { label: "活动连接", value: c.active ?? "-", color: "#67c23a" },
    { label: "空闲连接", value: c.idle ?? "-" },
  ];
});

const storageRows = computed(() => {
  const s = d.value.storage || {};
  return [
    { label: "数据库大小(GB)", value: s.sizeGb != null ? `${s.sizeGb} GB` : "-" },
    { label: "数据库大小(MB)", value: s.sizeMb != null ? `${s.sizeMb} MB` : "-" },
    { label: "数据库大小(字节)", value: s.sizeBytes != null ? `${s.sizeBytes}` : "-" },
  ];
});

const perfRows = computed(() => {
  const p = d.value.performance || {};
  return [
    { label: "事务提交", value: p.commits ?? "-" },
    { label: "事务回滚", value: p.rollbacks ?? "-" },
    { label: "元组返回", value: p.tuplesReturned ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getDatabaseOverview(props.deviceId);
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
.progress-row {
  display: flex;
  align-items: center;
  margin: 12px 0;
  &__label {
    font-size: 13px;
    color: #606266;
    width: 90px;
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
