<template>
  <div class="section-card">
    <div class="section-card__head">
      <el-icon class="section-card__icon"><component :is="icon || 'Document'" /></el-icon>
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

<script setup>
defineProps({
  title: { type: String, default: "" },
  icon: { type: String, default: "Document" },
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.section-card {
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
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
    border-bottom: 1px solid var(--cm-bg-page);
    flex-shrink: 0;
  }

  &__icon {
    color: var(--cm-color-primary);
    margin-right: @space-sm;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }

  &__extra {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary);
  }

  &__body {
    padding: @space-lg;
    /* 内容区填满卡片剩余高度，便于内部表格/图表占满、必要时内部滚动 */
    flex: 1;
    min-height: 0;
  }
}
</style>
