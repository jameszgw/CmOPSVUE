<!--
  CardGrid — 响应式 CSS Grid 容器。
  子卡片按 minmax(min, 1fr) 自动平铺成多列（auto-fill），而非纵向堆叠。
  用法：<CardGrid min="320px" gap="8px"><StatCard ... /> ...</CardGrid>
-->
<template>
  <div class="card-grid" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // 每列最小宽度（达不到则换行）
  min: { type: String, default: "320px" },
  // 列/行间距
  gap: { type: String, default: "8px" },
});

const gridStyle = computed(() => ({
  "--min": props.min,
  "--gap": props.gap,
}));
</script>

<style lang="less" scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--min), 1fr));
  gap: var(--gap);
}
</style>
