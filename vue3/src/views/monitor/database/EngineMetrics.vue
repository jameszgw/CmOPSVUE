<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="320px" gap="8px" class="body-grid">
      <SectionCard dense title="数据库引擎指标" icon="DataAnalysis" class="span-all">
        <template #extra>{{ d.dbType || "-" }}</template>
        <div class="engine-head">
          <span class="engine-head__label">当前引擎:</span>
          <el-tag size="large" type="primary" effect="dark">{{ d.engineLabel || "-" }}</el-tag>
        </div>

        <el-row :gutter="12" class="metric-grid">
          <el-col v-for="(s, i) in d.stats || []" :key="i" :xs="12" :sm="8" :lg="6">
            <div class="metric-card" :style="{ borderTopColor: levelColor(s.level) }">
              <div class="metric-card__label">
                {{ s.label }}
                <el-tag v-if="s.level && s.level !== 'normal'" size="small"
                  :type="s.level === 'critical' ? 'danger' : 'warning'" effect="plain">
                  {{ levelText(s.level) }}
                </el-tag>
              </div>
              <div class="metric-card__value" :style="{ color: levelColor(s.level) }">
                {{ fmt(s.value) }}<span class="metric-card__unit">{{ s.unit || "" }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </SectionCard>

      <SectionCard dense v-for="(g, gi) in d.groups || []" :key="gi" :title="g.title || '指标组'" icon="Tickets">
        <InfoTable :rows="groupRows(g)" :columns="2" />
      </SectionCard>
    </CardGrid>

    <!-- Top SQL 指标内容较多：独占一行(上下结构)，整行占满 -->
    <CardGrid min="320px" gap="8px" class="body-grid fill">
      <SectionCard dense title="Top SQL" icon="List" class="fill" scrollable bodyClass="dense-table fill">
        <template #extra>共 {{ (d.topSql || []).length }} 条</template>
        <el-empty v-if="!(d.topSql || []).length" description="暂无数据" :image-size="60" />
        <el-table v-else class="dense-table" height="100%" :data="d.topSql || []" size="small" stripe>
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="rankType(row.rank)" effect="plain">{{ row.rank }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SQL" min-width="280">
          <template #default="{ row }">
            <code class="sql-code">{{ row.sql || "-" }}</code>
          </template>
        </el-table-column>
        <el-table-column label="调用次数" width="120" align="right">
          <template #default="{ row }">{{ fmtNum(row.calls) }}</template>
        </el-table-column>
        <el-table-column label="平均耗时" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.avgMs) }} ms</template>
        </el-table-column>
        <el-table-column label="总耗时" width="120" align="right">
          <template #default="{ row }">{{ fmt(row.totalSec) }} s</template>
        </el-table-column>
        <el-table-column label="平均行数" width="120" align="right">
          <template #default="{ row }">{{ fmtNum(row.rowsAvg) }}</template>
        </el-table-column>
      </el-table>
      </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getDatabaseEngine } from "@/api/monitor-database";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const fmt = (v) => (v === undefined || v === null || v === "" ? "-" : v);
const fmtNum = (v) => {
  if (v === undefined || v === null || v === "") return "-";
  const n = Number(v);
  return Number.isNaN(n) ? v : n.toLocaleString();
};
const levelColor = (level) =>
  level === "critical" ? "#f56c6c" : level === "warning" ? "#e6a23c" : "#409eff";
const levelText = (level) => (level === "critical" ? "严重" : level === "warning" ? "警告" : "正常");
const rankType = (r) => (r === 1 ? "danger" : r === 2 ? "warning" : r === 3 ? "success" : "info");

const groupRows = (g) =>
  (g.items || []).map((it) => ({
    label: it.label,
    value: `${fmt(it.value)}${it.unit ? " " + it.unit : ""}`,
    color: it.level && it.level !== "normal" ? levelColor(it.level) : undefined,
  }));

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getDatabaseEngine(props.deviceId);
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
/* 上半部分(引擎指标+指标组)按内容高度；Top SQL 所在网格占满剩余高度并内部滚动 */
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
.engine-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;

  &__label {
    font-size: 14px;
    color: var(--cm-text-regular);
  }
}
.metric-grid .el-col {
  margin-bottom: 8px;
}
.metric-card {
  background: var(--cm-bg-muted);
  border: 1px solid var(--cm-border-light);
  border-top: 3px solid var(--cm-color-primary);
  border-radius: 8px;
  padding: 10px;
  height: 100%;
  box-sizing: border-box;

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--cm-text-regular);
    margin-bottom: 8px;
  }
  &__value {
    font-size: 22px;
    font-weight: 600;
    color: var(--cm-text-primary);
    line-height: 1.2;
  }
  &__unit {
    font-size: 13px;
    font-weight: 400;
    color: var(--cm-text-secondary);
    margin-left: 4px;
  }
}
.sql-code {
  display: block;
  font-family: monospace;
  font-size: 12px;
  color: var(--cm-text-primary);
  background: var(--cm-bg-soft);
  border-radius: 4px;
  padding: 6px 8px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
