<template>
  <div class="stat-card">
    <div class="stat-card__head">
      <div class="stat-card__icon" :style="{ background: tint, color: color }">
        <el-icon :size="18"><component :is="icon || 'DataLine'" /></el-icon>
      </div>
      <span class="stat-card__label">{{ label }}</span>
      <span v-if="tag" class="stat-card__tag" :style="{ color }">{{ tag }}</span>
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

<script setup>
import { computed } from "vue";

const props = defineProps({
  icon: { type: String, default: "DataLine" },
  label: { type: String, default: "" },
  value: { type: [String, Number], default: "-" },
  sub: { type: String, default: "" },
  tag: { type: String, default: "" },
  percent: { type: [Number, String], default: null },
  color: { type: String, default: "#409eff" },
});

const tint = computed(() => props.color + "1a");
const clampPercent = computed(() =>
  Math.max(0, Math.min(100, Number(props.percent) || 0))
);
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

    :deep(.el-progress) {
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
