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
  grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
  gap: var(--gap);
}
</style>
