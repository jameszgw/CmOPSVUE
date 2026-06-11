<template>
  <div>
    <el-table :data="data" row-key="hostId" style="width: 100%">
      <el-table-column prop="name" label="实例名称" />
      <el-table-column prop="hostName" label="主机名称" />
      <el-table-column prop="serverAddr" label="服务地址" />
      <el-table-column prop="port" label="端口" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'">
            {{ row.status === "0" ? "正常" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('edit', row)">编辑</el-button>
          <el-button link type="danger" @click="emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pagination"
      background
      layout="total, prev, pager, next"
      :total="total"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="(page) => emit('change', page, pagination.pageSize)"
    />
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
  pagination: {
    type: Object,
    default: () => ({ pageNo: 1, pageSize: 10 }),
  },
});

const emit = defineEmits(["change", "edit", "delete"]);
</script>

<style lang="less" scoped>
.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
