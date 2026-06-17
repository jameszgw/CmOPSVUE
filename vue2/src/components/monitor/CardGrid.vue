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
  display: grid;
  /* auto-fit（非 auto-fill）：空轨道塌缩，现有卡片拉伸铺满整行宽度，
     避免右侧出现成片空白；列数随屏宽自适应（流式/响应式） */
  grid-template-columns: repeat(auto-fit, minmax(var(--min), 1fr));
  gap: var(--gap);
  /* 卡片按内容高度、顶端对齐——不再被同行最高卡片拉伸出大片空白 */
  align-items: start;
}
/* 显式要求填满高度的卡片（如主表格）仍可铺满整格 */
.card-grid > .fill {
  align-self: stretch;
}
</style>
