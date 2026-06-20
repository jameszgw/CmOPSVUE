<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-share" label="总连接数"
        :value="d.total == null ? '-' : d.total" color="#409eff" />
      <stat-card dense icon="el-icon-share" label="最大连接数"
        :value="d.max == null ? '-' : d.max" color="#909399" />
      <stat-card dense icon="el-icon-odometer" label="活动连接"
        :value="d.active == null ? '-' : d.active" sub="实时活动连接数" color="#67c23a" />
      <stat-card dense icon="el-icon-user" label="空闲连接"
        :value="d.idle == null ? '-' : d.idle" sub="当前空闲连接数" color="#e6a23c" />
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="320px" gap="8px">
        <section-card dense title="连接 pool 状态" icon="el-icon-data-analysis">
          <div class="pool-block">
            <div class="pool-block__head">
              <span class="pool-block__title">连接使用率</span>
              <span class="pool-block__state">{{ pool.state || "空闲" }}&nbsp;{{ num(pool.usage) }}%</span>
            </div>
            <el-progress :percentage="clamp(pool.usage)" :stroke-width="12"
              :color="usageColor(pool.usage)" />
          </div>

          <div class="dist-block">
            <div class="dist-block__title">连接分布</div>
            <div class="dist-item">
              <span class="dist-item__dot" style="background:#67c23a"></span>
              <span class="dist-item__label">活动连接</span>
              <span class="dist-item__val">{{ pool.active == null ? '-' : pool.active }}</span>
            </div>
            <div class="dist-item">
              <span class="dist-item__dot" style="background:#909399"></span>
              <span class="dist-item__label">空闲连接</span>
              <span class="dist-item__val">{{ pool.idle == null ? '-' : pool.idle }}</span>
            </div>
            <div class="dist-item">
              <span class="dist-item__dot" style="background:#409eff"></span>
              <span class="dist-item__label">总连接数</span>
              <span class="dist-item__val">{{ pool.total == null ? '-' : pool.total }}</span>
            </div>
          </div>

          <div class="pool-block">
            <div class="pool-block__head">
              <span class="pool-block__title">连接 pool 容量</span>
              <span class="pool-block__state">已使用 / 最大连接数</span>
            </div>
            <el-progress :percentage="capacityPercent" :stroke-width="12"
              :color="usageColor(capacityPercent)" :show-text="false" />
            <div class="capacity-text">
              {{ pool.capacityUsed == null ? '-' : pool.capacityUsed }}
              &nbsp;/&nbsp;
              {{ pool.capacityMax == null ? '-' : pool.capacityMax }}
            </div>
          </div>
        </section-card>

        <section-card dense title="连接详细信息" icon="el-icon-data-line">
          <InfoTable :rows="detailRows" />
          <el-progress :percentage="clamp(detail.usage)" :stroke-width="10"
            :color="usageColor(detail.usage)" class="usage-bar" />
        </section-card>

        <section-card dense title="连接说明" icon="el-icon-info">
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
import { getDatabaseConnection } from "@/api/monitor-database";

export default {
  name: "DatabaseConnection",
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
        { title: "总连接数", desc: "数据库当前建立的所有连接总数" },
        { title: "最大连接数", desc: "数据库配置的最大允许连接数" },
        { title: "活动连接", desc: "正在执行查询或事务的连接数" },
        { title: "空闲连接", desc: "已建立但未在使用的连接数" },
        { title: "连接使用率", desc: "当前连接数占最大连接数的百分比" },
        { title: "连接状态", desc: "空闲(<50%) / 正常(50-70%) / 繁忙(70-90%) / 拥挤(≥90%)" },
      ],
    };
  },
  computed: {
    pool() {
      return this.d.pool || {};
    },
    detail() {
      return this.d.detail || {};
    },
    capacityPercent() {
      const used = Number(this.pool.capacityUsed) || 0;
      const max = Number(this.pool.capacityMax) || 0;
      return max > 0 ? this.clamp((used / max) * 100) : 0;
    },
    detailRows() {
      const c = this.detail;
      return [
        { label: "总连接数", value: c.total },
        { label: "最大连接数", value: c.max },
        { label: "活动连接", value: c.active == null ? "-" : `${c.active} 个`, color: "#67c23a" },
        { label: "空闲连接", value: c.idle },
        { label: "已使用连接", value: c.used },
        { label: "连接使用率", value: `${this.num(c.usage)}%`, color: "#409eff" },
        { label: "可用连接", value: c.available },
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
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    usageColor(v) {
      const n = Number(v) || 0;
      return n >= 90 ? "#f56c6c" : n >= 70 ? "#e6a23c" : "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getDatabaseConnection(this.deviceId);
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
.pool-block {
  margin-bottom: 18px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__title {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__state {
    margin-left: auto;
    font-size: 12px;
    color: #67c23a;
  }
}
.capacity-text {
  margin-top: 8px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: var(--cm-text-primary, @text-primary);
}
.dist-block {
  margin-bottom: 18px;
  &__title {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
    margin-bottom: 10px;
  }
}
.dist-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__val {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
}
.usage-bar {
  margin-top: 14px;
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
