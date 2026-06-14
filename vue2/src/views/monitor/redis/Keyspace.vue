<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-key" label="总键数" :value="fmt(d.totalKeys)"
          sub="所有数据库" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-time" label="过期键数" :value="fmt(d.expiredKeys)"
          :sub="expiredSub" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-odometer" label="平均TTL" :value="d.avgTtl == null ? '-' : d.avgTtl"
          sub="平均存活时间" color="#67c23a" />
      </el-col>
    </el-row>

    <SectionCard title="数据库列表" icon="el-icon-coin">
      <template #extra>共 {{ dbCount }} 个数据库</template>
      <el-empty v-if="!dbCount" description="暂无数据库" />
      <div v-for="db in d.databases || []" :key="db.index" class="db-card">
        <div class="db-card__head">
          <div class="db-card__icon"><i class="el-icon-coin"></i></div>
          <div class="db-card__title">
            <div class="db-card__name">{{ db.name }}</div>
            <div class="db-card__sub">数据库 {{ db.index }}</div>
          </div>
          <el-tag size="small" type="success" effect="plain" class="db-card__tag">活跃</el-tag>
        </div>
        <el-row :gutter="16" class="db-card__body">
          <el-col :xs="24" :sm="8">
            <div class="db-metric">
              <div class="db-metric__label"><i class="el-icon-key"></i> 键数量</div>
              <div class="db-metric__value">{{ fmt(db.keys) }}</div>
              <el-progress :percentage="clamp(db.expireRate)" :stroke-width="6"
                :show-text="false" color="#409eff" class="db-metric__bar" />
              <div class="db-metric__hint">
                <span style="color:#67c23a">{{ num(db.expireRate) }}%</span> 过期率
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="db-metric">
              <div class="db-metric__label"><i class="el-icon-time"></i> 过期键</div>
              <div class="db-metric__value">{{ fmt(db.expires) }}</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="db-metric">
              <div class="db-metric__label"><i class="el-icon-odometer"></i> 平均TTL</div>
              <div class="db-metric__value">{{ db.avgTtl == null ? '-' : db.avgTtl }}</div>
              <div class="db-metric__hint">{{ fmt(db.avgTtlMs) }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </SectionCard>

    <SectionCard title="字段说明" icon="el-icon-data-line">
      <el-row :gutter="16">
        <el-col v-for="f in fieldDesc" :key="f.label" :xs="24" :sm="12" :lg="8">
          <div class="field-desc">
            <div class="field-desc__label">{{ f.label }}</div>
            <div class="field-desc__text">{{ f.text }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisKeyspace } from "@/api/monitor-redis";

export default {
  name: "RedisKeyspace",
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
    dbCount() {
      return (this.d.databases && this.d.databases.length) || 0;
    },
    expiredSub() {
      const total = Number(this.d.totalKeys) || 0;
      const expired = Number(this.d.expiredKeys) || 0;
      if (!total) return "占比: -";
      return `占比: ${((expired / total) * 100).toFixed(1)}%`;
    },
    fieldDesc() {
      return [
        { label: "键数量", text: "数据库中存储的键的总数量" },
        { label: "过期键", text: "设置了过期时间的键的数量" },
        { label: "平均TTL", text: "所有过期键的平均存活时间（毫秒）" },
        { label: "过期率", text: "过期键占总键数的百分比" },
        { label: "数据库编号", text: "Redis数据库编号（0-15）" },
        { label: "使用率", text: "数据库键数量相对于最大容量的占比" },
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
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000
        ? v.toLocaleString()
        : v == null
        ? "-"
        : v;
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getRedisKeyspace(this.deviceId);
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.db-card {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 14px;
  background: var(--cm-bg-muted, @bg-muted);
  &:last-child {
    margin-bottom: 0;
  }
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }
  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #409eff1a;
    color: #409eff;
    font-size: 18px;
    margin-right: 10px;
  }
  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
  &__sub {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__tag {
    margin-left: auto;
  }
}
.db-metric {
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    margin-bottom: 6px;
    i {
      margin-right: 4px;
    }
  }
  &__value {
    font-size: 22px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    line-height: 1.2;
  }
  &__bar {
    margin-top: 8px;
  }
  &__hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.field-desc {
  padding: 12px 14px;
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  margin-bottom: 12px;
  &__label {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-bottom: 4px;
  }
  &__text {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
</style>
