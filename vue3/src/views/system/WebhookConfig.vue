<template>
  <ScreenPage title="WebHook列表" gap="8px">
    <template #header-extra>
      <div class="head-tools">
        <el-input
          v-model="searchForm.name"
          size="small"
          placeholder="请输入名称"
          clearable
          class="head-tools__input"
          @keyup.enter="handleSearch"
        />
        <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="handleReset">重置</el-button>
        <el-button size="small" type="primary" @click="handleAddWebHook">新增WebHook</el-button>
      </div>
    </template>

    <SectionCard
      dense
      scrollable
      bodyClass="dense-table fill"
      class="fill"
      title="WebHook"
      icon="Link"
    >
      <el-table class="dense-table" height="100%" :data="webhookPage.items" row-key="id" size="small" stripe>
        <el-table-column prop="webhookName" label="名称" min-width="160" />
        <el-table-column prop="webhookUrl" label="URL" min-width="220" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tooltip v-if="row.webhookType === '10'" content="钉钉">
              <el-icon :size="18" color="#1683e9"><ChatDotRound /></el-icon>
            </el-tooltip>
            <el-tag v-else type="info" size="small">未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <div class="pager">
      <el-pagination
        background
        small
        layout="total, prev, pager, next"
        :total="webhookPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </div>

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
  </ScreenPage>
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
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
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
@import (reference) "@/styles/variables.less";

.head-tools {
  display: flex;
  align-items: center;
  gap: @space-sm;

  &__input {
    width: 180px;
  }
}

.pager {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}
</style>
