<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="200px" gap="8px" class="stat-grid">
      <StatCard dense icon="Files" label="库数量" :value="d.databaseCount ?? '-'"
        sub="业务数据库数" color="#e6a23c" />
      <StatCard dense icon="Grid" label="表数量" :value="d.tableCount ?? '-'"
        sub="所有库表总数" color="#409eff" />
      <StatCard dense icon="Tickets" label="总行数" :value="kfmt(d.totalRows)"
        sub="所有表行数合计" color="#67c23a" />
      <StatCard dense icon="Coin" label="总大小" :value="d.totalSize || '-'"
        sub="所有表大小合计" color="#9254de" />
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="Top 10 最大的表" icon="Sort" class="span-all" scrollable bodyClass="dense-table">
        <el-table class="dense-table" :max-height="300" :data="d.topTables || []" size="small" stripe>
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
    </CardGrid>

    <!-- 数据库列表(逐库)：独占一行，仅在后端返回 databases 时显示 -->
    <CardGrid v-if="(d.databases || []).length" min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="数据库列表" icon="Coin" class="span-all" scrollable bodyClass="dense-table">
        <template #extra>共 {{ (d.databases || []).length }} 个库</template>
        <el-table class="dense-table" :max-height="300" :data="d.databases || []" size="small" stripe
          highlight-current-row @row-click="onDatabaseRow">
          <el-table-column prop="schema" label="数据库" min-width="160">
            <template #default="{ row }">
              <span class="table-name">{{ row.schema || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="表数" width="120" align="right">
            <template #default="{ row }">{{ row.tableCount == null ? "-" : fmtNum(row.tableCount) }}</template>
          </el-table-column>
          <el-table-column label="行数" width="160" align="right">
            <template #default="{ row }">{{ row.rows == null ? "-" : kfmt(row.rows) }}</template>
          </el-table-column>
          <el-table-column label="大小" width="160" align="right">
            <template #default="{ row }">
              <span class="size-text">{{ fmtBytes(row.sizeBytes) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="selectSchema(row.schema)">查看表</el-button>
            </template>
          </el-table-column>
        </el-table>
      </SectionCard>
    </CardGrid>

    <!-- 所有表详情数据较多：独占一行(上下结构)，占满剩余高度并内部滚动 -->
    <CardGrid min="320px" gap="8px" class="body-grid fill">
      <SectionCard dense title="所有表详情" icon="List" class="fill" scrollable bodyClass="fill">
        <template #extra>
          <el-select v-if="schemaOptions.length" v-model="selectedSchema" size="small" placeholder="全部"
            class="schema-filter" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="s in schemaOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <span class="extra-count">
            {{ selectedSchema ? `${selectedSchema}：${filteredTables.length} 张表` : `共 ${filteredTables.length} 张表` }}
          </span>
        </template>
        <el-empty v-if="!filteredTables.length" description="暂无数据" :image-size="60" />
        <div v-else class="table-grid">
        <div v-for="(t, i) in filteredTables" :key="t.schema + '.' + t.name + '-' + i" class="table-card">
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
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getDatabaseTables } from "@/api/monitor-database";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

// 所有表详情的数据库筛选：空字符串=全部
const selectedSchema = ref("");

const fmtBytes = (n) => {
  if (n === undefined || n === null || n === "") return "-";
  const num = Number(n);
  if (Number.isNaN(num)) return "-";
  if (num < 1024) return `${num} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = num / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(2)} ${units[i]}`;
};

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

// 筛选下拉的可选 schema：优先取 databases，回退到 allTables 去重
const schemaOptions = computed(() => {
  const src = (d.value.databases || []).map((x) => x && x.schema);
  const fallback = (d.value.allTables || []).map((x) => x && x.schema);
  const all = (src.length ? src : fallback).filter((s) => s !== undefined && s !== null && s !== "");
  return [...new Set(all)];
});

// 按选中库过滤的表，空=全部
const filteredTables = computed(() => {
  const all = d.value.allTables || [];
  return selectedSchema.value ? all.filter((t) => t && t.schema === selectedSchema.value) : all;
});

const selectSchema = (schema) => {
  selectedSchema.value = schema || "";
};
const onDatabaseRow = (row) => {
  if (row) selectSchema(row.schema);
};

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getDatabaseTables(props.deviceId);
    data.value = res.content || {};
    // 切换设备后重置库筛选，避免旧选择导致空列表
    if (selectedSchema.value && !schemaOptions.value.includes(selectedSchema.value)) {
      selectedSchema.value = "";
    }
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
/* Top10 网格按内容高度；所有表详情网格占满剩余高度并内部滚动(上下结构) */
.body-grid {
  flex: 0 0 auto;
  align-content: start;
}
.body-grid.fill {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.span-all {
  flex-basis: 100%;
  width: 100%;
}
.schema-text {
  color: var(--cm-text-secondary);
  font-size: 12px;
}
.schema-filter {
  width: 180px;
  margin-right: 8px;
  vertical-align: middle;
}
.extra-count {
  vertical-align: middle;
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
  gap: 8px;
}
.table-card {
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  overflow: hidden;

  &__head {
    padding: 8px 10px;
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
    padding: 10px;
  }
}
.metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
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
