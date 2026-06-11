<template>
  <div class="page-container">
    <h2 class="page-title">WebHook列表</h2>
    <el-card>
      <el-form :inline="true" :model="searchForm" @submit.native.prevent="handleSearch">
        <el-form-item label="名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">新增WebHook</el-button>
      </div>

      <el-table :data="webhooks" row-key="id" v-loading="loading">
        <el-table-column prop="webhookName" label="名称" />
        <el-table-column prop="webhookUrl" label="URL" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template slot-scope="{ row }">
            <el-tooltip v-if="row.webhookType === '10'" content="钉钉">
              <el-tag size="small" type="primary">钉钉</el-tag>
            </el-tooltip>
            <el-tag v-else size="small" type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="{ row }">
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, prev, pager, next, sizes"
        :total="total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-drawer
      :title="editingWebHook ? '编辑WebHook' : '新增WebHook'"
      :visible.sync="drawerVisible"
      size="400px"
      :destroy-on-close="true"
      @close="handleCloseDrawer"
    >
      <div class="drawer-body">
        <create-webhook-form
          v-if="drawerVisible"
          :initial-values="editingWebHook"
          @save="handleSaveWebHook"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "@/api/webhook";
import CreateWebhookForm from "./components/CreateWebhookForm.vue";

export default {
  name: "WebhookConfig",
  components: { CreateWebhookForm },
  data() {
    return {
      loading: false,
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { name: "" },
      filters: { name: "" },
      webhooks: [],
      total: 0,
      drawerVisible: false,
      editingWebHook: null,
    };
  },
  created() {
    this.getWebHooks();
  },
  methods: {
    async getWebHooks() {
      this.loading = true;
      try {
        const res = await fetchWebhooks({ ...this.pagination, ...this.filters });
        const page = res.content || {};
        this.webhooks = page.items || [];
        this.total = page.total || 0;
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.filters = { ...this.searchForm };
      this.pagination.pageNo = 1;
      this.getWebHooks();
    },
    handleReset() {
      this.searchForm = { name: "" };
      this.filters = { name: "" };
      this.pagination.pageNo = 1;
      this.getWebHooks();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getWebHooks();
    },
    handleSizeChange(size) {
      this.pagination = { pageNo: 1, pageSize: size };
      this.getWebHooks();
    },
    handleAdd() {
      this.editingWebHook = null;
      this.drawerVisible = true;
    },
    handleEdit(webhook) {
      this.editingWebHook = webhook;
      this.drawerVisible = true;
    },
    handleDelete(webhookId) {
      this.$confirm("确定要删除该WebHook吗？", "确认删除", {
        type: "warning",
      })
        .then(async () => {
          await deleteWebhook({ id: webhookId });
          this.$message.success("删除成功");
          this.getWebHooks();
        })
        .catch(() => {});
    },
    handleCloseDrawer() {
      this.drawerVisible = false;
      this.editingWebHook = null;
    },
    async handleSaveWebHook(values) {
      try {
        if (this.editingWebHook) {
          await updateWebhook({ ...values, id: this.editingWebHook.id });
          this.$message.success("更新成功");
        } else {
          await createWebhook(values);
          this.$message.success("创建成功");
        }
        this.getWebHooks();
        this.drawerVisible = false;
        this.editingWebHook = null;
      } catch (error) {
        console.error("保存WebHook失败:", error);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 500;
}

.table-toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.drawer-body {
  padding: 0 20px;
}

// 原 webhook-config.less
.title {
  background: rgb(242, 121, 144);
}
</style>
