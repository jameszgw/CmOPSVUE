<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="内存使用率" :value="`${num(d.memoryUsage)}%`"
          :percent="d.memoryUsage" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="User" label="连接客户端" :value="d.connectedClients ?? '-'"
          sub="当前连接数" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Lock" label="阻塞客户端" :value="d.blockedClients ?? '-'"
          sub="OPS" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="TrendCharts" label="命中率" :value="`${num(d.hitRate)}%`"
          :percent="d.hitRate" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard title="Redis基础信息" icon="InfoFilled">
      <template #extra>
        <el-tag size="small" :type="['agent','ssh','snmp'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
          {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP"}[d.source] || "模拟数据" }}
        </el-tag>
      </template>
      <InfoTable :rows="basicRows" :columns="2" />
    </SectionCard>

    <SectionCard title="内存信息" icon="Coin">
      <InfoTable :rows="memoryRows" :columns="2" />
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="连接统计" icon="Connection">
          <InfoTable :rows="connRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="命令统计" icon="DataLine">
          <InfoTable :rows="cmdRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="键空间信息" icon="Key">
      <el-row :gutter="12">
        <el-col v-for="ks in d.keyspace || []" :key="ks.name || ks.index" :xs="24" :sm="12" :lg="8">
          <div class="ks-item">
            <div class="ks-item__head">
              <span class="ks-item__name">{{ ks.name }}</span>
              <span class="ks-item__index">数据库 {{ ks.index }}</span>
            </div>
            <div class="ks-item__row"><span>键数量</span><b>{{ fmt(ks.keys) }}</b></div>
            <div class="ks-item__row"><span>过期键</span><b>{{ fmt(ks.expires) }}</b></div>
            <div class="ks-item__row"><span>平均TTL</span><b>{{ fmt(ks.avgTtl) }}</b></div>
          </div>
        </el-col>
        <el-col v-if="!(d.keyspace && d.keyspace.length)" :span="24">
          <el-empty description="暂无键空间数据" :image-size="80" />
        </el-col>
      </el-row>
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="网络输入" icon="Download">
          <div class="net-block">
            <div class="net-block__row">
              <span class="net-block__label">总输入字节</span>
              <span class="net-block__value">{{ d.netInput?.totalBytes ?? '-' }}</span>
            </div>
            <div class="net-block__row">
              <span class="net-block__label">每秒输入</span>
              <span class="net-block__value" style="color:#409eff">{{ d.netInput?.perSec ?? '-' }}</span>
            </div>
          </div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="网络输出" icon="Upload">
          <div class="net-block">
            <div class="net-block__row">
              <span class="net-block__label">总输出字节</span>
              <span class="net-block__value">{{ d.netOutput?.totalBytes ?? '-' }}</span>
            </div>
            <div class="net-block__row">
              <span class="net-block__label">每秒输出</span>
              <span class="net-block__value" style="color:#67c23a">{{ d.netOutput?.perSec ?? '-' }}</span>
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
import { getRedisOverview } from "@/api/monitor-redis";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const fmt = (v) =>
  typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v ?? "-";

const basicRows = computed(() => {
  const b = d.value.basic || {};
  return [
    { label: "Redis版本", value: b.version },
    { label: "运行模式", value: b.mode },
    { label: "地址", value: b.address },
    { label: "架构", value: b.arch },
    { label: "角色", value: b.role, color: "#409eff" },
    { label: "TCP端口", value: b.tcpPort },
    { label: "运行天数", value: b.uptimeDays != null ? `${b.uptimeDays} 天` : b.uptime },
    { label: "连接状态", value: b.connStatus, color: "#67c23a" },
  ];
});

const memoryRows = computed(() => {
  const m = d.value.memory || {};
  return [
    { label: "已使用内存", value: m.usedMemory },
    { label: "数据集内存", value: m.datasetMemory },
    { label: "RSS内存", value: m.rssMemory },
    { label: "最大内存限制", value: m.maxMemory },
    { label: "内存峰值", value: m.peakMemory },
    { label: "内存碎片率", value: m.fragRatio ?? m.fragmentation },
    { label: "系统总内存", value: m.totalSystemMemory },
    { label: "碎片化", value: m.fragmentation },
  ];
});

const connRows = computed(() => {
  const c = d.value.connStats || {};
  return [
    { label: "总连接数", value: fmt(c.total) },
    { label: "拒绝连接数", value: fmt(c.rejected), color: "#f56c6c" },
    { label: "阻塞客户端", value: fmt(c.blocked) },
    { label: "监控连接数", value: fmt(c.monitor) },
  ];
});

const cmdRows = computed(() => {
  const c = d.value.cmdStats || {};
  return [
    { label: "总处理命令", value: fmt(c.totalProcessed) },
    { label: "每秒操作数", value: fmt(c.opsPerSec) },
    { label: "键空间命中", value: fmt(c.keyspaceHits), color: "#67c23a" },
    { label: "键空间未命中", value: fmt(c.keyspaceMisses), color: "#e6a23c" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getRedisOverview(props.deviceId);
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
.ks-item {
  border: 1px solid var(--cm-bg-page);
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 12px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
  &__index {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
  &__row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--cm-text-regular);
    padding: 4px 0;
    b {
      color: var(--cm-text-primary);
    }
  }
}
.net-block {
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    & + & {
      border-top: 1px solid var(--cm-bg-page);
    }
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
  }
  &__value {
    font-size: 18px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
</style>
