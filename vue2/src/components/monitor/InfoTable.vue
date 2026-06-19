<template>
  <table class="info-table">
    <tbody>
      <tr v-for="(row, ri) in groupedRows" :key="ri">
        <template v-for="(cell, ci) in row">
          <td class="info-table__label" :key="'l' + ci">{{ cell.label }}</td>
          <td class="info-table__value" :key="'v' + ci" :title="cellTitle(cell)">
            <span :style="cell.color ? { color: cell.color } : null">{{ cell.value }}</span>
            <span v-if="cell.tag" class="info-table__tag">{{ cell.tag }}</span>
          </td>
        </template>
        <td
          v-for="n in (columns - row.length) * 2"
          :key="'pad' + n"
          class="info-table__pad"
        ></td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "InfoTable",
  props: {
    // [{ label, value, color?, tag? }]
    rows: { type: Array, default: () => [] },
    // 每行展示的"标签/值"对数
    columns: { type: Number, default: 1 },
  },
  computed: {
    groupedRows() {
      const out = [];
      for (let i = 0; i < this.rows.length; i += this.columns) {
        out.push(this.rows.slice(i, i + this.columns));
      }
      return out;
    },
  },
  methods: {
    // 鼠标悬停显示完整值（值被省略号截断时仍可读到全文，如 IP/版本号）
    cellTitle(cell) {
      const v = cell.value == null ? "" : String(cell.value);
      return cell.tag ? v + " " + cell.tag : v;
    },
  },
};
</script>

<style lang="less" scoped>
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  td {
    border: 1px solid var(--cm-border-light);
    /* 紧凑行高：行按内容高度，不再为填满卡片而拉伸出空行 */
    padding: 6px 10px;
    line-height: 1.4;
  }

  &__label {
    background: var(--cm-bg-muted);
    color: var(--cm-text-regular);
    /* 收缩到内容宽度，把剩余空间留给值列：多面板并排时避免值被挤成逐字换行 */
    width: 1%;
    white-space: nowrap;
  }

  &__value {
    color: var(--cm-text-primary);
    /* 单行 + 省略号：长值(IP/版本号/cluster)在窄列里既不逐字符竖排堆叠，也不溢出，
       完整内容通过 title 悬停查看；max-width:0 配合表格让值列吃满剩余宽度后再省略 */
    max-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
