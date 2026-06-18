<!--
  CardGrid — 响应式 CSS Grid 容器。
  子卡片按 minmax(min, 1fr) 自动平铺成多列（auto-fill），而非纵向堆叠。
  用法：<card-grid min="320px" gap="8px"><stat-card ... /> ...</card-grid>
-->
<template>
  <div class="card-grid" :style="gridStyle">
    <slot />
  </div>
</template>

<script>
export default {
  name: "CardGrid",
  props: {
    // 每列最小宽度（达不到则换行）
    min: { type: String, default: "320px" },
    // 列/行间距
    gap: { type: String, default: "8px" },
  },
  computed: {
    gridStyle() {
      return {
        "--min": this.min,
        "--gap": this.gap,
      };
    },
  },
};
</script>

<style lang="less" scoped>
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
  align-content: flex-start;
}
/* 每张卡片以 min 为基准，并按 grow 平分整行剩余宽度——所有行(含最后一行)都铺满，无右侧空白 */
.card-grid > * {
  flex: 1 1 var(--min);
  min-width: min(100%, var(--min));
}
/* 主内容网格：填满剩余高度，行随高度拉伸、卡片 height:100% 占满一屏 */
.card-grid.fill {
  flex: 1;
  min-height: 0;
  align-content: stretch;
}
</style>
