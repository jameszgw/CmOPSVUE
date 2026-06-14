<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Grid" label="表数量" :value="d.tableCount ?? '-'"
          sub="数据库表总数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Tickets" label="总行数" :value="kfmt(d.totalRows)"
          sub="所有表行数合计" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Coin" label="总大小" :value="d.totalSize || '-'"
          sub="所有表大小合计" color="#9254de" />
      </el-col>
    </el-row>

    <SectionCard title="Top 10 最大的表" icon="Sort">
      <el-table :data="d.topTables || []" size="small" stripe>
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="rankType(row.rank)" effect="plain">{{ row.rank }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="schema" label="模式" width="160">
          <template #default="{ row }">
            <span class="schema-text">{{ row.schema || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="表名">
          <template #default="{ row }">
            <span class="table-name">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="行数" width="160" align="right">
          <template #default="{ row }">{{ fmtNum(row.rows) }}</template>
        </el-table-column>
        <el-table-column label="大小" width="160" align="right">
          <template #default="{ row }">
            <span class="size-text">{{ row.size || "-" }}</span>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <SectionCard title="所有表详情" icon="List">
      <template #extra>共 {{ (d.allTables || []).length }} 张表</template>
      <el-empty v-if="!(d.allTables || []).length" description="暂无数据" />
      <div v-else class="table-grid">
        <div v-for="(t, i) in d.allTables || []" :key="t.schema + '.' + t.name + '-' + i" class="table-card">
          <div class="table-card__head">
            <span class="table-card__schema">{{ t.schema || "-" }}</span>
            <span class="table-card__name">{{ t.name || "-" }}</span>
          </div>
          <div class="table-card__body">
            <div class="metric">
              <span class="metric__label">行数</span>
              <span class="metric__value">{{ fmtNum(t.rows) }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">大小</span>
              <span class="metric__value">{{ t.size || "-" }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">插入</span>
              <span class="metric__value" style="color: #67c23a">{{ fmtNum(t.inserts) }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">更新</span>
              <span class="metric__value" style="color: #409eff">{{ fmtNum(t.updates) }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">删除</span>
              <span class="metric__value" style="color: #f56c6c">{{ fmtNum(t.deletes) }}</span>
            </div>
            <div class="metric">
              <span class="metric__label">死元组</span>
              <span class="metric__value" style="color: #e6a23c">{{ fmtNum(t.deadTuples) }}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getDatabaseTables } from "@/api/monitor-database";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const fmtNum = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  return Number.isNaN(n) ? v : n.toLocaleString();
};
const kfmt = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return `${n}`;
};
const rankType = (r) => (r === 1 ? "danger" : r === 2 ? "warning" : r === 3 ? "success" : "info");

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getDatabaseTables(props.deviceId);
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
.schema-text {
  color: var(--cm-text-secondary);
  font-size: 12px;
}
.table-name {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.size-text {
  font-weight: 600;
  color: var(--cm-color-purple);
}
.table-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.table-card {
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  overflow: hidden;

  &__head {
    padding: 10px 12px;
    border-bottom: 1px solid var(--cm-bg-page);
    background: var(--cm-bg-muted);
    display: flex;
    flex-direction: column;
  }
  &__schema {
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
  &__name {
    font-family: monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary);
    word-break: break-all;
    margin-top: 2px;
  }
  &__body {
    padding: 12px;
  }
}
.metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 13px;

  &__label {
    color: var(--cm-text-secondary);
  }
  &__value {
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
</style>
