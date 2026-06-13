<template>
  <div class="stat-card">
    <div class="stat-card__head">
      <div class="stat-card__icon" :style="{ background: tint, color: color }">
        <i :class="icon || 'el-icon-data-line'"></i>
      </div>
      <span class="stat-card__label">{{ label }}</span>
      <span v-if="tag" class="stat-card__tag" :style="{ color: color }">{{ tag }}</span>
    </div>
    <div class="stat-card__value">{{ value }}</div>
    <div v-if="percent !== null && percent !== undefined" class="stat-card__progress">
      <el-progress
        :percentage="clampPercent"
        :stroke-width="6"
        :color="color"
        :show-text="false"
      />
      <span class="stat-card__percent">{{ Number(percent).toFixed(1) }}%</span>
    </div>
    <div v-else-if="sub" class="stat-card__sub">{{ sub }}</div>
  </div>
</template>

<script>
export default {
  name: "StatCard",
  props: {
    icon: { type: String, default: "el-icon-data-line" },
    label: { type: String, default: "" },
    value: { type: [String, Number], default: "-" },
    sub: { type: String, default: "" },
    tag: { type: String, default: "" },
    percent: { type: [Number, String], default: null },
    color: { type: String, default: "#409eff" },
  },
  computed: {
    tint() {
      return this.color + "1a";
    },
    clampPercent() {
      return Math.max(0, Math.min(100, Number(this.percent) || 0));
    },
  },
};
</script>

<style lang="less" scoped>
.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px 20px;
  height: 100%;
  box-sizing: border-box;

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    font-size: 18px;
  }

  &__label {
    font-size: 13px;
    color: #606266;
  }

  &__tag {
    margin-left: auto;
    font-size: 12px;
  }

  &__value {
    font-size: 26px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
  }

  &__progress {
    display: flex;
    align-items: center;
    margin-top: 12px;

    /deep/ .el-progress {
      flex: 1;
    }

    .stat-card__percent {
      margin-left: 8px;
      font-size: 12px;
      color: #909399;
      white-space: nowrap;
    }
  }

  &__sub {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
