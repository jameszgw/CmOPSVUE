<template>
  <ScreenPage title="主机秘钥" gap="8px">
    <template #header-extra>
      <el-form inline :model="searchForm" class="toolbar-form" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.displayName" placeholder="用户名" clearable size="small" style="width: 150px" />
        </el-form-item>
        <el-form-item label="活跃状态">
          <el-select
            v-model="searchForm.active"
            placeholder="活跃状态"
            clearable
            size="small"
            style="width: 130px"
          >
            <el-option value="1" label="活 跃" />
            <el-option value="0" label="不活跃" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="onSearch">查询</el-button>
          <el-button size="small" @click="onReset">重置</el-button>
          <el-button type="primary" size="small" @click="handleAddKey">新增秘钥</el-button>
        </el-form-item>
      </el-form>
    </template>

    <SectionCard
      dense
      bodyClass="dense-table fill table-pane"
      class="fill"
      title="秘钥列表"
      icon="Key"
    >
      <el-table class="dense-table fill" height="100%" :data="serverKeys.items" row-key="id" size="small" stripe>
        <el-table-column prop="displayName" label="显示名称" />
        <el-table-column label="账户类型">
          <template #default="{ row }">
            <el-tag :type="row.accountType === 1 ? 'danger' : 'primary'" size="small">
              {{ row.accountType === 1 ? "管理员" : "普通账户" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" />
        <el-table-column label="活跃状态">
          <template #default="{ row }">
            <el-tag :type="row.active === '1' ? 'success' : 'info'" size="small">
              {{ row.active === "1" ? "活跃" : "不活跃" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        background
        small
        layout="total, sizes, prev, pager, next"
        :total="serverKeys.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </SectionCard>

    <!-- 添加或编辑服务器秘钥的抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="editingServerKey ? '编辑秘钥' : '新增秘钥'"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <CreateServerKeyForm
        :initial-values="editingServerKey"
        @save="handleSaveKey"
        @cancel="handleCloseDrawer"
      />
    </el-drawer>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CreateServerKeyForm from "./components/CreateServerKeyForm.vue";
import {
  queryServerKeys,
  createServerKey,
  updateServerKey,
  deleteServerKey,
} from "@/api/host";

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ displayName: "", active: "" });
const filters = reactive({ displayName: "", active: "" });

const drawerVisible = ref(false);
const editingServerKey = ref(null);
const serverKeys = reactive({ items: [], total: 0 });

const getServerKeys = async () => {
  const res = await queryServerKeys({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    ...filters,
  });
  serverKeys.items = res.content?.items || [];
  serverKeys.total = res.content?.total || 0;
};

const onSearch = () => {
  filters.displayName = searchForm.displayName;
  filters.active = searchForm.active;
  pagination.pageNo = 1;
  getServerKeys();
};

const onReset = () => {
  searchForm.displayName = "";
  searchForm.active = "";
  onSearch();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getServerKeys();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  getServerKeys();
};

const handleAddKey = () => {
  editingServerKey.value = null;
  drawerVisible.value = true;
};

const handleCloseDrawer = () => {
  drawerVisible.value = false;
  editingServerKey.value = null;
};

const handleEdit = (record) => {
  editingServerKey.value = record;
  drawerVisible.value = true;
};

const handleSaveKey = async (values, fileBase64) => {
  const content = { ...values, fileBase64 };
  if (editingServerKey.value) {
    await updateServerKey({ ...content, id: editingServerKey.value.id });
    ElMessage.success("更新成功");
  } else {
    await createServerKey(content);
    ElMessage.success("保存成功");
  }
  drawerVisible.value = false;
  editingServerKey.value = null;
  getServerKeys();
};

const handleDelete = async (serverKeyId) => {
  await deleteServerKey({ serverKeyId });
  ElMessage.success("删除成功");
  getServerKeys();
};

onMounted(() => {
  getServerKeys();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.toolbar-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: @space-md;
  }
}

:deep(.table-pane) {
  display: flex;
  flex-direction: column;
}

.pagination {
  margin-top: @space-sm;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
