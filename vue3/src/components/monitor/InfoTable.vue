<template>
  <table class="info-table">
    <tbody>
      <tr v-for="(row, ri) in groupedRows" :key="ri">
        <template v-for="(cell, ci) in row" :key="ci">
          <td class="info-table__label">{{ cell.label }}</td>
          <td class="info-table__value">
            <span :style="cell.color ? { color: cell.color } : null">{{ cell.value }}</span>
            <span v-if="cell.tag" class="info-table__tag">{{ cell.tag }}</span>
          </td>
        </template>
        <template v-if="row.length < columns">
          <td
            v-for="n in (columns - row.length) * 2"
            :key="'pad' + n"
            class="info-table__pad"
          ></td>
        </template>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // [{ label, value, color?, tag? }]
  rows: { type: Array, default: () => [] },
  // 每行展示的"标签/值"对数
  columns: { type: Number, default: 1 },
});

const groupedRows = computed(() => {
  const out = [];
  for (let i = 0; i < props.rows.length; i += props.columns) {
    out.push(props.rows.slice(i, i + props.columns));
  }
  return out;
});
</script>

<style lang="less" scoped>
.info-table {
  width: 100%;
  /* 等高卡片内填满高度：多余高度按行均分，避免底部留空 */
  height: 100%;
  border-collapse: collapse;
  font-size: 13px;

  td {
    border: 1px solid var(--cm-border-light);
    padding: 9px 12px;
  }

  &__label {
    background: var(--cm-bg-muted);
    color: var(--cm-text-regular);
    width: 160px;
    white-space: nowrap;
  }

  &__value {
    color: var(--cm-text-primary);
    word-break: break-all;
  }

  &__tag {
    margin-left: 8px;
    color: var(--cm-text-secondary);
    font-size: 12px;
  }

  &__pad {
    background: var(--cm-bg-card);
    border-color: transparent;
  }

  tr:hover td:not(.info-table__pad) {
    background: var(--cm-bg-soft);
  }
}
</style>
