<template>
  <!-- 不支持时：渲染紧凑的占位卡片（锁图标 + 真实原因），不再覆盖大段空内容、不留白 -->
  <div v-if="unsupported" class="unsupported-empty">
    <i class="el-icon-lock unsupported-empty__icon"></i>
    <div class="unsupported-empty__title">{{ title }}</div>
    <div class="unsupported-empty__reason">{{ reason || "该指标在当前设备/采集方式下不可用" }}</div>
  </div>
  <!-- 支持时：正常渲染内容 -->
  <slot v-else />
</template>

<script>
export default {
  name: "UnsupportedMask",
  props: {
    unsupported: { type: Boolean, default: false },
    reason: { type: String, default: "" },
    title: { type: String, default: "该指标暂不支持" },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.unsupported-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 260px;
  padding: 32px 24px;
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: @radius-lg;

  &__icon {
    font-size: 34px;
    color: var(--cm-text-placeholder);
  }

  &__title {
    margin-top: 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-regular);
  }

  &__reason {
    margin-top: 8px;
    max-width: 460px;
    font-size: 12px;
    line-height: 1.7;
    color: var(--cm-text-secondary);
  }
}
</style>
