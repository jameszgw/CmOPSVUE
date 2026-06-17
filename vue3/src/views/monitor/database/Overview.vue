<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="220px" gap="8px" class="stat-grid">
      <StatCard dense icon="Connection" label="连接使用率" :value="`${num(connUsage)}%`"
        :percent="connUsage" color="#409eff" />
      <StatCard dense icon="Coin" label="数据库大小" :value="d.dbSize || '-'"
        :sub="storage.sizeMb != null ? `${storage.sizeMb} MB` : ''" color="#9254de" />
      <StatCard dense icon="Odometer" label="缓存命中率" :value="`${num(hitRate)}%`"
        :percent="hitRate" color="#67c23a" />
      <StatCard dense icon="Histogram" label="活动连接" :value="d.activeConnections ?? '-'"
        sub="当前活动连接数" color="#e6a23c" />
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="基本信息" icon="InfoFilled">
        <template #extra>
          <el-tag size="small" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
            {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" />
      </SectionCard>

      <SectionCard dense title="连接信息" icon="Connection">
        <InfoTable :rows="connRows" />
        <div class="progress-row">
          <span class="progress-row__label">连接使用率</span>
          <el-progress :percentage="clamp(connUsage)" :stroke-width="10"
            :color="usageColor(connUsage)" class="progress-row__bar" />
          <span class="progress-row__num">{{ num(connUsage) }}%</span>
        </div>
      </SectionCard>

      <SectionCard dense title="存储信息" icon="Coin">
        <InfoTable :rows="storageRows" />
      </SectionCard>

      <SectionCard dense title="性能统计" icon="TrendCharts">
        <div class="progress-row">
          <span class="progress-row__label">缓存命中率</span>
          <el-progress :percentage="clamp(hitRate)" :stroke-width="10"
            :color="usageColor(hitRate)" class="progress-row__bar" />
          <span class="progress-row__num">{{ num(hitRate) }}%</span>
        </div>
        <InfoTable :rows="perfRows" />
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
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
@import (reference) "@/styles/variables.less";
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.stat-grid {
  flex-shrink: 0;
}
.body-grid {
  flex: 1;
  min-height: 0;
  align-content: start;
  overflow: auto;
}
.span-all {
  grid-column: 1 / -1;
}
.progress-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
    width: 90px;
    flex-shrink: 0;
  }
  &__bar {
    flex: 1;
  }
  &__num {
    margin-left: 10px;
    font-size: 13px;
    color: var(--cm-text-primary);
    white-space: nowrap;
  }
}
</style>
