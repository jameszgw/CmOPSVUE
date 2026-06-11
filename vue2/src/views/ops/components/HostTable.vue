<template>
  <div>
    <el-table :data="data" row-key="hostId" style="width: 100%">
      <el-table-column prop="name" label="实例名称" />
      <el-table-column prop="hostName" label="主机名称" />
      <el-table-column prop="serverAddr" label="服务地址" />
      <el-table-column prop="port" label="端口" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'">
            {{ row.status === "0" ? "正常" : "停用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="text" @click="$emit('edit', row)">编辑</el-button>
          <el-button type="text" @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top: 12px; text-align: right"
      layout="total, prev, pager, next, sizes"
      :total="total"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script>
export default {
  name: "HostTable",
  props: {
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
  },
  methods: {
    handleCurrentChange(page) {
      this.$emit("change", page, this.pagination.pageSize);
    },
    handleSizeChange(pageSize) {
      this.$emit("change", 1, pageSize);
    },
  },
};
</script>
