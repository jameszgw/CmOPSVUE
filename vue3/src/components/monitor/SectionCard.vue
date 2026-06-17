<!--
  SectionCard — 带标题头部的区块卡片，正文 flex 填满剩余高度。
  - dense: 紧凑模式（头部 padding ~6px，正文 ~10px，更小标题字号）。
  - bodyClass: 附加到正文容器的 class（如配合 .fill / 内部滚动表格）。
  - scrollable: 正文 overflow:auto，可承载内部独立滚动的表格/列表。
  默认外观与历史完全一致。
-->
<template>
  <div class="section-card" :class="{ 'section-card--dense': dense }">
    <div class="section-card__head">
      <el-icon class="section-card__icon"><component :is="icon || 'Document'" /></el-icon>
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

<script setup>
defineProps({
  title: { type: String, default: "" },
  icon: { type: String, default: "Document" },
  // 紧凑模式：更小的头部/正文内边距与标题字号
  dense: { type: Boolean, default: false },
  // 附加到正文容器的 class（如 "fill" 或 "dense-table"）
  bodyClass: { type: [String, Array, Object], default: "" },
  // 正文 overflow:auto，承载内部独立滚动的表格/列表
  scrollable: { type: Boolean, default: false },
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.section-card {
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: @radius-lg;
  margin-bottom: @space-lg;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* 默认按内容高度，避免作为 flex 子项时 height:100% 抢占整列高度、把"填充"卡片挤成 0；
     仅显式标记 .fill 的卡片才填满（其正文 flex:1 给内部表格/图表定高） */
  &.fill {
    height: 100%;
  }

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
</style>
