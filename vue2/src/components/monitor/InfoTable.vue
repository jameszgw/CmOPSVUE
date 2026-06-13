<template>
  <table class="info-table">
    <tbody>
      <tr v-for="(row, ri) in groupedRows" :key="ri">
        <template v-for="(cell, ci) in row">
          <td class="info-table__label" :key="'l' + ci">{{ cell.label }}</td>
          <td class="info-table__value" :key="'v' + ci">
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
};
</script>

<style lang="less" scoped>
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  td {
    border: 1px solid #ebeef5;
    padding: 9px 12px;
  }

  &__label {
    background: #fafafa;
    color: #606266;
    width: 160px;
    white-space: nowrap;
  }

  &__value {
    color: #303133;
    word-break: break-all;
  }

  &__tag {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }

  &__pad {
    background: #fff;
    border-color: transparent;
  }

  tr:hover td:not(.info-table__pad) {
    background: #f5f7fa;
  }
}
</style>
