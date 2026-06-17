<!--
  ScreenPage — "一屏看完" 页面外壳。
  height:100% + flex 纵向布局 + overflow:hidden，使页面恰好填满视口，
  内部区域（表格/列表）各自独立滚动，而非整页滚动。
  - 可选 header 插槽（或 title 属性 + header-extra 插槽）。
  - 默认插槽为 flex 主体（flex:1; min-height:0），放置卡片/CardGrid。
  作为一屏页面的根元素使用。
-->
<template>
  <div class="screen-page" :style="{ gap }">
    <div v-if="title || $slots.header || $slots['header-extra']" class="screen-page__head">
      <slot name="header">
        <h2 v-if="title" class="screen-page__title">{{ title }}</h2>
      </slot>
      <div v-if="$slots['header-extra']" class="screen-page__extra">
        <slot name="header-extra" />
      </div>
    </div>
    <div class="screen-page__body" :style="{ gap }">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  // 可选页面标题（也可改用 #header 插槽自定义）
  title: { type: String, default: "" },
  // 区块间距
  gap: { type: String, default: "8px" },
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.screen-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: @screen-page-pad;
  background: var(--cm-bg-page);
  box-sizing: border-box;

  &__head {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--cm-text-primary);
    margin: 0;
  }

  &__extra {
    margin-left: auto;
  }

  // 主体填满剩余高度；内部区域各自滚动
  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}
</style>
