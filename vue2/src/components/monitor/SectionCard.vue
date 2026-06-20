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
    /* 头部允许换行：超长的 #extra（如"获取方式·来源"徽标）换到下一行，而非顶破卡片右边界 */
    flex-wrap: wrap;
    row-gap: 2px;
    padding: @space-md @space-lg;
    // 浅色保持原值 #f0f2f5；深色跟随边框
    border-bottom: 1px solid #f0f2f5;
    flex-shrink: 0;
    overflow: hidden;
  }

  &__icon {
    color: var(--cm-color-primary, @color-primary);
    margin-right: @space-sm;
    flex-shrink: 0;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    /* 标题保持单行，绝不被 #extra 挤成逐字竖排 */
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__extra {
    margin-left: auto;
    min-width: 0;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    text-align: right;

    /* #extra 内的徽标/标签超长时内部换行，不撑破卡片 */
    /deep/ .el-tag {
      white-space: normal;
      height: auto;
      max-width: 100%;
    }
    /deep/ span {
      white-space: normal;
      word-break: break-word;
    }
  }

  &__body {
    padding: @space-lg;
    flex: 1;
    min-height: 0;
    /* 关键：当"占满一屏"把卡片压得比内容矮时，内部滚动而非被卡片底边裁切遮挡数据 */
    overflow: auto;

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
