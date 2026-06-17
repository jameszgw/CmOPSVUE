<template>
  <div class="section-card" :class="{ 'section-card--dense': dense }">
    <div class="section-card__head">
      <i :class="['section-card__icon', icon || 'el-icon-document']"></i>
      <span class="section-card__title">{{ title }}</span>
      <div class="section-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div
      class="section-card__body"
      :class="[bodyClass, { 'section-card__body--scroll': scrollable }]"
    >
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
    // 紧凑模式：更小的头部/正文内边距与标题字号。不传时外观不变。
    dense: { type: Boolean, default: false },
    // 附加到正文容器的 class（如 "fill" 或 "dense-table"）。
    bodyClass: { type: [String, Array, Object], default: "" },
    // 正文 overflow:auto，承载内部独立滚动的表格/列表。
    scrollable: { type: Boolean, default: false },
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

    &--scroll {
      overflow: auto;
    }
  }

  // ---- 紧凑模式 ----
  &--dense {
    margin-bottom: 0;

    .section-card__head {
      padding: @dense-card-head-pad @dense-card-pad;
    }

    .section-card__title {
      font-size: 13px;
    }

    .section-card__body {
      padding: @dense-card-pad;
    }
  }
}

[data-theme="dark"] .section-card__head {
  border-bottom-color: var(--cm-border-light);
}
</style>
