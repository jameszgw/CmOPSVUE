<template>
  <div class="section-card">
    <div class="section-card__head">
      <i :class="['section-card__icon', icon || 'el-icon-document']"></i>
      <span class="section-card__title">{{ title }}</span>
      <div class="section-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="section-card__body">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: "SectionCard",
  props: {
    title: { type: String, default: "" },
    icon: { type: String, default: "el-icon-document" },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.section-card {
  background: var(--cm-bg-card, @bg-card);
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: @radius-lg;
  margin-bottom: @space-lg;
  /* 同行卡片等高：在 el-row(flex) 中拉伸；单列堆叠时父高 auto，height:100% 无副作用 */
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &__head {
    display: flex;
    align-items: center;
    padding: @space-md @space-lg;
    // 浅色保持原值 #f0f2f5；深色跟随边框
    border-bottom: 1px solid #f0f2f5;
    flex-shrink: 0;
  }

  &__icon {
    color: var(--cm-color-primary, @color-primary);
    margin-right: @space-sm;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }

  &__extra {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }

  &__body {
    padding: @space-lg;
    flex: 1;
    min-height: 0;
  }
}

[data-theme="dark"] .section-card__head {
  border-bottom-color: var(--cm-border-light);
}
</style>
