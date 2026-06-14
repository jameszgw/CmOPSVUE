<template>
  <div v-loading="loading" class="tab-pane">
    <div class="engine-head">
      <i class="el-icon-cpu engine-head__icon"></i>
      <span class="engine-head__title">当前引擎</span>
      <el-tag size="medium" type="primary" effect="dark">{{ engineLabel }}</el-tag>
      <span v-if="d.dbType" class="engine-head__type">{{ d.dbType }}</span>
    </div>

    <el-row :gutter="12" class="metric-grid">
      <el-col v-for="(s, i) in stats" :key="i" :xs="12" :sm="8" :lg="6">
        <div class="metric-card" :style="{ borderColor: levelColor(s.level) }">
          <div class="metric-card__label">{{ s.label }}</div>
          <div class="metric-card__value" :style="{ color: levelColor(s.level) }">
            {{ s.value == null ? '-' : s.value }}<span v-if="s.unit" class="metric-card__unit">{{ s.unit }}</span>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-empty v-if="!stats.length" description="暂无指标数据" />

    <SectionCard v-for="(g, gi) in groups" :key="'g' + gi" :title="g.title || '指标组'" icon="el-icon-s-data">
      <InfoTable :rows="groupRows(g)" :columns="2" />
    </SectionCard>

    <SectionCard title="Top SQL" icon="el-icon-s-marketing">
      <template #extra>共 {{ topSql.length }} 条</template>
      <el-table :data="topSql" size="small" stripe>
        <el-table-column label="排名" width="80" align="center">
          <template slot-scope="{ row }">
            <span class="rank-badge" :class="rankClass(row.rank)">{{ row.rank }}</span>
          </template>
        </el-table-column>
        <el-table-column label="SQL" min-width="280">
          <template slot-scope="{ row }">
            <span class="sql-text">{{ row.sql }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调用次数" width="120" align="right">
          <template slot-scope="{ row }">{{ fmt(row.calls) }}</template>
        </el-table-column>
        <el-table-column label="平均耗时" width="120" align="right">
          <template slot-scope="{ row }">
            <span style="color: #e6a23c">{{ fmt(row.avgMs) }} ms</span>
          </template>
        </el-table-column>
        <el-table-column label="总耗时" width="120" align="right">
          <template slot-scope="{ row }">
            <span style="color: #f56c6c">{{ fmt(row.totalSec) }} s</span>
          </template>
        </el-table-column>
        <el-table-column label="平均行数" width="120" align="right">
          <template slot-scope="{ row }">{{ fmt(row.rowsAvg) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!topSql.length" description="暂无 SQL 数据" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getDatabaseEngine } from "@/api/monitor-database";

const LEVEL_COLOR = { warning: "#e6a23c", critical: "#f56c6c" };

export default {
  name: "DatabaseEngineMetrics",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    engineLabel() {
      return this.d.engineLabel || this.d.dbType || "未知";
    },
    stats() {
      return Array.isArray(this.d.stats) ? this.d.stats : [];
    },
    groups() {
      return Array.isArray(this.d.groups) ? this.d.groups : [];
    },
    topSql() {
      return Array.isArray(this.d.topSql) ? this.d.topSql : [];
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    levelColor(level) {
      return LEVEL_COLOR[level] || "#303133";
    },
    fmt(v) {
      if (v === undefined || v === null) return "-";
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v;
    },
    rankClass(rank) {
      const n = Number(rank);
      return n === 1 ? "rank-badge--gold" : n === 2 ? "rank-badge--silver" : n === 3 ? "rank-badge--bronze" : "";
    },
    groupRows(g) {
      const items = (g && Array.isArray(g.items)) ? g.items : [];
      return items.map((it) => ({
        label: it.label,
        value: (it.value == null ? "-" : it.value) + (it.unit ? " " + it.unit : ""),
        color: LEVEL_COLOR[it.level] || undefined,
      }));
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getDatabaseEngine(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.engine-head {
  display: flex;
  align-items: center;
  background: var(--cm-bg-card, @bg-card);
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 14px 18px;
  margin-bottom: 16px;

  &__icon {
    font-size: 20px;
    color: #409eff;
    margin-right: 10px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-right: 12px;
  }

  &__type {
    margin-left: 10px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.metric-grid {
  margin-bottom: 4px;
}
.metric-grid .el-col {
  margin-bottom: 12px;
}
.metric-card {
  background: var(--cm-bg-card, @bg-card);
  border: 1px solid var(--cm-border-light, @border-light);
  border-left-width: 3px;
  border-radius: 8px;
  padding: 14px 16px;
  height: 100%;
  box-sizing: border-box;

  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
    margin-bottom: 8px;
  }

  &__value {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }

  &__unit {
    font-size: 13px;
    font-weight: 400;
    color: var(--cm-text-secondary, @text-secondary);
    margin-left: 4px;
  }
}
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--cm-bg-page, @bg-page);
  color: var(--cm-text-regular, @text-regular);
  font-size: 12px;
  font-weight: 600;
  &--gold {
    background: #fdf6ec;
    color: #e6a23c;
  }
  &--silver {
    background: #f4f4f5;
    color: var(--cm-text-secondary, @text-secondary);
  }
  &--bronze {
    background: #fef0f0;
    color: #f56c6c;
  }
}
.sql-text {
  font-family: "Consolas", "Monaco", monospace;
  font-size: 12px;
  color: var(--cm-text-primary, @text-primary);
  word-break: break-all;
}
</style>
