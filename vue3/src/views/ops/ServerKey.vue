<template>
  <div class="page-container">
    <h2 class="page-title">主机秘钥</h2>
    <el-card shadow="never">
      <el-form inline :model="searchForm" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.displayName" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="活跃状态">
          <el-select
            v-model="searchForm.active"
            placeholder="请选择活跃状态"
            clearable
            style="width: 150px"
          >
            <el-option value="1" label="活 跃" />
            <el-option value="0" label="不活跃" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAddKey">新增秘钥</el-button>
      </div>

      <el-table :data="serverKeys.items" row-key="id" style="width: 100%">
        <el-table-column prop="displayName" label="显示名称" />
        <el-table-column label="账户类型">
          <template #default="{ row }">
            <el-tag :type="row.accountType === 1 ? 'danger' : 'primary'">
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
        layout="total, sizes, prev, pager, next"
        :total="serverKeys.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
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
.title {
  background: rgb(121, 242, 154);
}

.page-title {
  margin: 0 0 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
