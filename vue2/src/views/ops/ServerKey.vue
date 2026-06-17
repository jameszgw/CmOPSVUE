<template>
  <screen-page title="主机秘钥" gap="8px">
    <template #header-extra>
      <el-form inline size="mini" :model="searchForm" class="filter-form" @submit.native.prevent>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.displayName" placeholder="请输入用户名" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="活跃状态">
          <el-select v-model="searchForm.active" placeholder="活跃状态" clearable style="width: 120px">
            <el-option label="活 跃" value="1" />
            <el-option label="不活跃" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleAddKey">新增秘钥</el-button>
        </el-form-item>
      </el-form>
    </template>

    <section-card dense scrollable body-class="dense-table fill" class="fill" title="秘钥列表" icon="el-icon-key">
      <el-table class="dense-table" height="100%" :data="serverKeys.items" row-key="id" size="small" stripe style="width: 100%">
        <el-table-column prop="displayName" label="显示名称" />
        <el-table-column label="账户类型">
          <template #default="{ row }">
            <el-tag :type="row.accountType === 1 ? 'danger' : ''">
              {{ row.accountType === 1 ? "管理员" : "普通账户" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" />
        <el-table-column label="活跃状态">
          <template #default="{ row }">
            <el-tag :type="row.active === '1' ? 'success' : 'info'">
              {{ row.active === "1" ? "活跃" : "不活跃" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section-card>

    <el-pagination
      class="page-pagination"
      layout="total, prev, pager, next, sizes"
      :total="serverKeys.total"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 添加或编辑服务器秘钥的抽屉 -->
    <el-drawer
      :title="editingServerKey ? '编辑秘钥' : '新增秘钥'"
      :visible.sync="drawerVisible"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <div style="padding: 0 20px">
        <create-server-key-form
          v-if="drawerVisible"
          :initial-values="editingServerKey"
          @save="handleSaveKey"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CreateServerKeyForm from "./components/CreateServerKeyForm.vue";
import {
  queryServerKeys,
  createServerKey,
  updateServerKey,
  deleteServerKey,
} from "@/api/host";

export default {
  name: "ServerKey",
  components: {
    ScreenPage,
    SectionCard,
    CreateServerKeyForm,
  },
  data() {
    return {
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { displayName: "", active: "" },
      filters: { displayName: "", active: "" },
      drawerVisible: false,
      editingServerKey: null,
      serverKeys: { items: [], total: 0 },
    };
  },
  created() {
    this.getServerKeys();
  },
  methods: {
    async getServerKeys() {
      const res = await queryServerKeys({ ...this.pagination, ...this.filters });
      this.serverKeys = res.content || { items: [], total: 0 };
    },
    onSearch() {
      this.filters = { ...this.searchForm };
      this.pagination = { pageNo: 1, pageSize: this.pagination.pageSize };
      this.getServerKeys();
    },
    onReset() {
      this.searchForm = { displayName: "", active: "" };
      this.filters = { displayName: "", active: "" };
      this.getServerKeys();
    },
    handleAddKey() {
      this.drawerVisible = true;
    },
    handleCloseDrawer() {
      this.drawerVisible = false;
      this.editingServerKey = null;
    },
    handleEdit(record) {
      this.editingServerKey = record;
      this.drawerVisible = true;
    },
    async handleSaveKey(values, fileBase64) {
      const content = { ...values, fileBase64 };
      const editing = this.editingServerKey;
      this.drawerVisible = false;
      if (editing) {
        // 如果存在 editingServerKey，则执行更新操作
        await updateServerKey({ ...content, id: editing.id });
      } else {
        // 否则执行新增操作
        await createServerKey(content);
      }
      this.editingServerKey = null;
      this.getServerKeys();
    },
    async handleDelete(serverKeyId) {
      await deleteServerKey({ serverKeyId });
      this.$message.success("删除成功");
      this.getServerKeys();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getServerKeys();
    },
    handleSizeChange(pageSize) {
      this.pagination = { pageNo: 1, pageSize };
      this.getServerKeys();
    },
  },
};
</script>

<style lang="less" scoped>
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.filter-form /deep/ .el-form-item {
  margin-bottom: 0;
}
.page-pagination {
  flex-shrink: 0;
  text-align: right;
}
</style>
