<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-s-grid" label="表数量"
        :value="d.tableCount == null ? '-' : d.tableCount" sub="数据库表总数" color="#409eff" />
      <stat-card dense icon="el-icon-tickets" label="总行数"
        :value="d.totalRows == null ? '-' : d.totalRows" sub="所有表行数合计" color="#67c23a" />
      <stat-card dense icon="el-icon-coin" label="总大小"
        :value="d.totalSize == null ? '-' : d.totalSize" sub="所有表占用空间" color="#e6a23c" />
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="320px" gap="8px">
        <section-card dense scrollable class="fill" body-class="dense-table fill" title="Top 10 最大的表" icon="el-icon-data-analysis">
          <el-table class="dense-table" height="100%" :data="d.topTables || []" size="small" stripe>
            <el-table-column label="排名" width="80">
              <template slot-scope="{ row }">
                <span class="rank-badge" :class="rankClass(row.rank)">{{ row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column label="模式" width="160">
              <template slot-scope="{ row }">
                <el-tag size="small" type="info" effect="plain">{{ row.schema }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="表名" />
            <el-table-column label="行数" width="160" align="right">
              <template slot-scope="{ row }">
                <span style="color: #67c23a">{{ row.rows == null ? '-' : row.rows }}</span>
              </template>
            </el-table-column>
            <el-table-column label="大小" width="160" align="right">
              <template slot-scope="{ row }">
                <span style="color: #e6a23c">{{ row.size == null ? '-' : row.size }}</span>
              </template>
            </el-table-column>
          </el-table>
        </section-card>
      </card-grid>

      <!-- 所有表详情数据较多：独占一行(上下结构) -->
      <card-grid min="320px" gap="8px">
        <section-card dense scrollable class="fill" title="所有表详情" icon="el-icon-s-grid">
          <template #extra>共 {{ (d.allTables && d.allTables.length) || 0 }} 张表</template>
          <el-row :gutter="12">
            <el-col v-for="(t, i) in d.allTables || []" :key="i" :xs="24" :sm="12" :lg="8" :xl="6">
              <div class="table-card">
                <div class="table-card__head">
                  <el-tag size="mini" type="info" effect="plain">{{ t.schema }}</el-tag>
                  <span class="table-card__name">{{ t.name }}</span>
                </div>
                <div class="table-card__grid">
                  <div class="metric"><span class="metric__label">行数</span><span class="metric__value">{{ fmt(t.rows) }}</span></div>
                  <div class="metric"><span class="metric__label">大小</span><span class="metric__value">{{ t.size == null ? '-' : t.size }}</span></div>
                  <div class="metric"><span class="metric__label">插入</span><span class="metric__value" style="color:#67c23a">{{ fmt(t.inserts) }}</span></div>
                  <div class="metric"><span class="metric__label">更新</span><span class="metric__value" style="color:#409eff">{{ fmt(t.updates) }}</span></div>
                  <div class="metric"><span class="metric__label">删除</span><span class="metric__value" style="color:#f56c6c">{{ fmt(t.deletes) }}</span></div>
                  <div class="metric"><span class="metric__label">死元组</span><span class="metric__value" style="color:#e6a23c">{{ fmt(t.deadTuples) }}</span></div>
                </div>
              </div>
            </el-col>
          </el-row>
          <el-empty v-if="!(d.allTables && d.allTables.length)" description="暂无表数据" />
        </section-card>
      </card-grid>
    </div>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getDatabaseTables } from "@/api/monitor-database";

export default {
  name: "DatabaseTables",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
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
    fmt(v) {
      if (v === undefined || v === null) return "-";
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v;
    },
    rankClass(rank) {
      const n = Number(rank);
      return n === 1 ? "rank-badge--gold" : n === 2 ? "rank-badge--silver" : n === 3 ? "rank-badge--bronze" : "";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getDatabaseTables(this.deviceId);
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
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: 8px;
}
.kpi-grid {
  flex-shrink: 0;
}
.screen-tab__main {
  flex: 1;
  min-height: 0;
  overflow: auto;
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
.table-card {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  &__name {
    margin-left: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    word-break: break-all;
  }
  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
  }
}
.metric {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  &__label {
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__value {
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
}
</style>
