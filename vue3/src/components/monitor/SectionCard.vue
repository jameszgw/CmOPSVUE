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

  &__head {
    display: flex;
    align-items: center;
    padding: @space-md @space-lg;
    border-bottom: 1px solid var(--cm-bg-page);
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
  }
}
</style>
