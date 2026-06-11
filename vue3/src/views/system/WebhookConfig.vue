<template>
  <div class="page-container">
    <el-card>
      <div class="page-title">WebHook列表</div>
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入名称"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAddWebHook">
          新增WebHook
        </el-button>
      </div>

      <el-table :data="webhookPage.items" row-key="id">
        <el-table-column prop="webhookName" label="名称" />
        <el-table-column prop="webhookUrl" label="URL" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tooltip v-if="row.webhookType === '10'" content="钉钉">
              <el-icon :size="18" color="#1683e9"><ChatDotRound /></el-icon>
            </el-tooltip>
            <el-tag v-else type="info">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, prev, pager, next"
        :total="webhookPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="editingWebHook ? '编辑WebHook' : '新增WebHook'"
      size="400px"
      destroy-on-close
      @closed="editingWebHook = null"
    >
      <CreateWebhookForm
        :initial-values="editingWebHook"
        @save="handleSaveWebHook"
        @cancel="handleCloseDrawer"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "@/api/webhook";
import CreateWebhookForm from "./components/CreateWebhookForm.vue";

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ name: "" });
const filters = reactive({ name: "" });

const drawerVisible = ref(false);
const editingWebHook = ref(null);
const webhookPage = reactive({ items: [], total: 0 });

const getWebHooks = async () => {
  const res = await fetchWebhooks({ ...pagination, ...filters });
  webhookPage.items = res.content?.items || [];
  webhookPage.total = res.content?.total || 0;
};

const handleSearch = () => {
  filters.name = searchForm.name;
  pagination.pageNo = 1;
  getWebHooks();
};

const handleReset = () => {
  searchForm.name = "";
  filters.name = "";
  pagination.pageNo = 1;
  getWebHooks();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getWebHooks();
};

const handleAddWebHook = () => {
  editingWebHook.value = null;
  drawerVisible.value = true;
};

const handleEdit = (webhook) => {
  editingWebHook.value = webhook;
  drawerVisible.value = true;
};

const handleDelete = (webhookId) => {
  ElMessageBox.confirm("确定要删除该WebHook吗？", "确认删除", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await deleteWebhook({ id: webhookId });
      ElMessage.success("删除成功");
      getWebHooks();
    })
    .catch(() => {});
};

const handleCloseDrawer = () => {
  drawerVisible.value = false;
  editingWebHook.value = null;
};

const handleSaveWebHook = async (values) => {
  try {
    if (editingWebHook.value) {
      await updateWebhook({ ...values, id: editingWebHook.value.id });
      ElMessage.success("更新成功");
    } else {
      await createWebhook(values);
      ElMessage.success("创建成功");
    }
    drawerVisible.value = false;
    editingWebHook.value = null;
    getWebHooks();
  } catch (error) {
    console.error("保存WebHook失败:", error);
  }
};

onMounted(() => {
  getWebHooks();
});
</script>

<style lang="less" scoped>
.page-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.toolbar {
  margin: 16px 0;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.title {
  background: rgb(242, 121, 144);
}
</style>
