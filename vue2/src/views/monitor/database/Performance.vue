<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-odometer" label="缓存命中率" :value="`${num(hitRate)}%`"
        :percent="hitRate" color="#67c23a" />
      <stat-card dense icon="el-icon-data-line" label="事务提交"
        :value="d.commits == null ? '-' : d.commits" sub="累计提交事务数" color="#409eff" />
      <stat-card dense icon="el-icon-data-analysis" label="事务回滚"
        :value="d.rollbacks == null ? '-' : d.rollbacks" sub="累计回滚事务数" color="#e6a23c" />
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="320px" gap="8px">
        <section-card dense title="事务统计" icon="el-icon-data-line">
          <InfoTable :rows="txRows" />
          <div class="bar-row">
            <span class="bar-row__label">提交率</span>
            <el-progress :percentage="clamp(tx.commitRate)" :stroke-width="10"
              color="#e6a23c" class="bar-row__bar" />
            <span class="bar-row__val">{{ num(tx.commitRate) }}%</span>
          </div>
          <div class="bar-row">
            <span class="bar-row__label">缓存命中率</span>
            <el-progress :percentage="clamp(tx.hitRate)" :stroke-width="10"
              color="#67c23a" class="bar-row__bar" />
            <span class="bar-row__val">{{ num(tx.hitRate) }}%</span>
          </div>
        </section-card>
        <section-card dense title="元组操作" icon="el-icon-s-grid">
          <InfoTable :rows="tupleRows" />
        </section-card>
        <section-card dense title="性能指标说明" icon="el-icon-info">
          <el-row :gutter="12">
            <el-col v-for="(it, i) in notes" :key="i" :xs="24" :sm="12" :lg="8">
              <div class="note-item">
                <div class="note-item__title">{{ it.title }}</div>
                <div class="note-item__desc">{{ it.desc }}</div>
              </div>
            </el-col>
          </el-row>
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
import { getDatabasePerformance } from "@/api/monitor-database";

export default {
  name: "DatabasePerformance",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return {
      loading: false,
      d: {},
      notes: [
        { title: "缓存命中率", desc: "从缓存中读取数据的比例，越高性能越好" },
        { title: "事务提交", desc: "成功提交的事务总数" },
        { title: "事务回滚", desc: "回滚的事务总数，过高可能表示有问题" },
        { title: "元组操作", desc: "数据行的增删改查操作统计" },
      ],
    };
  },
  computed: {
    tx() {
      return this.d.txStats || {};
    },
    tupleOps() {
      return this.d.tupleOps || {};
    },
    hitRate() {
      return this.tx.hitRate != null ? this.tx.hitRate : this.d.hitRate;
    },
    txRows() {
      const t = this.tx;
      return [
        { label: "事务提交", value: t.commits == null ? this.d.commits : t.commits },
        { label: "事务回滚", value: t.rollbacks == null ? this.d.rollbacks : t.rollbacks },
      ];
    },
    tupleRows() {
      const t = this.tupleOps;
      return [
        { label: "元组返回", value: t.returned },
        { label: "元组获取", value: t.fetched },
        { label: "元组插入", value: t.inserted, color: "#67c23a" },
        { label: "元组更新", value: t.updated, color: "#409eff" },
        { label: "元组删除", value: t.deleted, color: "#f56c6c" },
      ];
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
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getDatabasePerformance(this.deviceId);
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
.bar-row {
  display: flex;
  align-items: center;
  margin-top: 14px;
  &__label {
    width: 84px;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__bar {
    flex: 1;
  }
  &__val {
    margin-left: 10px;
    width: 64px;
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
}
.note-item {
  background: var(--cm-bg-muted, @bg-muted);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-bottom: 6px;
  }
  &__desc {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    line-height: 1.5;
  }
}
</style>
