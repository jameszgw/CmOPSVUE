<!--
  CardGrid — 流式自适应卡片容器（flexbox 流式布局）。
  子卡片按 flex-grow 平铺：每一行（含最后一行不满的行）都拉伸铺满整行宽度，
  不会在右侧留空（这是 flex 流式相对 CSS grid auto-fit 的关键优势）。
  - min: 每张卡片的基准/最小宽度（达不到则换行）。
  - gap: 间距。
  - 给本组件加 class="fill"（全局 .fill = flex:1;min-height:0）时：网格填满剩余高度，
    行随高度拉伸、卡片 height:100% 占满，实现"一屏占满"。
  用法：<CardGrid min="300px" gap="8px"><StatCard .../> ...</CardGrid>
-->
<template>
  <div class="card-grid" :style="gridStyle">
    <slot />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // 每张卡片基准/最小宽度（按此换行；同行卡片再 grow 平分剩余宽度）
  min: { type: String, default: "300px" },
  // 卡片间距
  gap: { type: String, default: "8px" },
});

const gridStyle = computed(() => ({
  "--min": props.min,
  "--gap": props.gap,
}));
</script>

<style lang="less" scoped>
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
  align-content: flex-start;
}
/* 每张卡片以 min 为基准，并按 grow 平分整行剩余宽度——所有行都铺满，无右侧空白 */
.card-grid > * {
  flex: 1 1 var(--min);
  /* 下限取 min 与 100% 的较小者：窄屏不溢出，宽屏按 min 换行 */
  min-width: min(100%, var(--min));
}

/* 主内容网格：填满剩余高度，行随高度拉伸、卡片 height:100% 占满一屏 */
.card-grid.fill {
  flex: 1;
  min-height: 0;
  align-content: stretch;
}
</style>
