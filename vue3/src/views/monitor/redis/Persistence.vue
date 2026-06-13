<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="DocumentChecked" label="RDB 状态"
          :value="d.rdbOk ? '正常' : '异常'"
          :color="d.rdbOk ? '#67c23a' : '#f56c6c'" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="EditPen" label="AOF 状态"
          :value="d.aofEnabled ? '已开启' : '未开启'"
          :sub="d.aofEnabled ? (d.aofOk ? '运行正常' : '运行异常') : '未启用 AOF'"
          :color="d.aofEnabled ? (d.aofOk ? '#67c23a' : '#f56c6c') : '#909399'" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Connection" label="从节点数"
          :value="d.connectedSlaves ?? '-'" sub="connected_slaves" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Sort" label="最大主从偏移"
          :value="d.maxSlaveLagHuman || '-'" sub="max slave lag" color="#e6a23c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="RDB 持久化" icon="DocumentChecked">
          <InfoTable :rows="rdbRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="AOF 持久化" icon="EditPen">
          <InfoTable :rows="aofRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="复制状态" icon="Share">
      <InfoTable :rows="replRows" :columns="2" />
      <div v-if="(rep.slaves || []).length" class="slaves-table">
        <el-table :data="rep.slaves || []" size="small" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="addr" label="地址" min-width="180" />
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag size="small" :type="row.state === 'online' ? 'success' : 'info'" effect="plain">
                {{ row.state || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="offset" label="复制偏移" width="160" align="right">
            <template #default="{ row }">{{ fmtNum(row.offset) }}</template>
          </el-table-column>
          <el-table-column prop="lagHuman" label="延迟" width="120" align="right">
            <template #default="{ row }">{{ row.lagHuman || "-" }}</template>
          </el-table-column>
        </el-table>
      </div>
    </SectionCard>

    <SectionCard title="哨兵切换事件" icon="Bell">
      <template #extra>共 {{ (d.sentinelEvents || []).length }} 条</template>
      <el-empty v-if="!(d.sentinelEvents || []).length" description="暂无哨兵切换事件" />
      <el-table v-else :data="d.sentinelEvents || []" size="small" stripe>
        <el-table-column prop="time" label="时间" width="200" />
        <el-table-column label="类型" width="160">
          <template #default="{ row }">
            <el-tag size="small" type="warning" effect="plain">{{ row.type || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="240" />
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisPersistence } from "@/api/monitor-redis";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const rep = computed(() => d.value.replication || {});

const fmt = (v) => (v === undefined || v === null || v === "" ? "-" : v);
const fmtNum = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  return Number.isNaN(n) ? v : n.toLocaleString();
};
const yn = (v) => (v ? "是" : "否");

const rdbRows = computed(() => {
  const r = d.value.rdb || {};
  return [
    { label: "上次保存时间", value: fmt(r.lastSaveTime) },
    { label: "距上次保存变更", value: fmt(r.changesSinceSave) },
    {
      label: "上次 bgsave 状态",
      value: fmt(r.lastBgsaveStatus),
      color: r.lastBgsaveStatus && r.lastBgsaveStatus !== "ok" ? "#f56c6c" : "#67c23a",
    },
    { label: "bgsave 进行中", value: yn(r.bgsaveInProgress) },
    { label: "上次耗时", value: r.lastBgsaveTimeSec == null ? "-" : `${r.lastBgsaveTimeSec} 秒` },
    { label: "RDB 大小", value: fmt(r.rdbSize) },
  ];
});

const aofRows = computed(() => {
  const a = d.value.aof || {};
  return [
    { label: "是否开启", value: yn(a.enabled), color: a.enabled ? "#67c23a" : "#909399" },
    {
      label: "上次写入状态",
      value: fmt(a.lastWriteStatus),
      color: a.lastWriteStatus && a.lastWriteStatus !== "ok" ? "#f56c6c" : undefined,
    },
    {
      label: "上次重写状态",
      value: fmt(a.lastRewriteStatus),
      color: a.lastRewriteStatus && a.lastRewriteStatus !== "ok" ? "#f56c6c" : undefined,
    },
    { label: "重写进行中", value: yn(a.rewriteInProgress) },
    { label: "AOF 大小", value: fmt(a.aofSize) },
    { label: "基准大小", value: fmt(a.aofBaseSize) },
  ];
});

const replRows = computed(() => {
  const r = rep.value;
  return [
    { label: "角色", value: fmt(r.role) },
    { label: "模式", value: fmt(r.mode) },
    { label: "从节点数", value: r.connectedSlaves ?? "-" },
    { label: "主复制偏移", value: fmtNum(r.masterReplOffset) },
    { label: "最大从节点延迟", value: fmt(r.maxSlaveLagHuman) },
    {
      label: "主链路状态",
      value: fmt(r.masterLinkStatus),
      color: r.masterLinkStatus
        ? r.masterLinkStatus === "up" ? "#67c23a" : "#f56c6c"
        : undefined,
    },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getRedisPersistence(props.deviceId);
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
.slaves-table {
  margin-top: 16px;
}
</style>
