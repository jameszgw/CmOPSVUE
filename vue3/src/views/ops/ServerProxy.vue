<template>
  <div class="page-container">
    <h2 class="page-title">主机代理</h2>
    <el-card shadow="never">
      <el-form inline :model="searchForm" @submit.prevent>
        <el-form-item label="代理主机">
          <el-input v-model="searchForm.proxyHost" placeholder="请输入代理主机" clearable />
        </el-form-item>
        <el-form-item label="代理用户">
          <el-input v-model="searchForm.proxyUsername" placeholder="请输入用户" clearable />
        </el-form-item>
        <el-form-item label="代理类型">
          <el-select
            v-model="searchForm.proxyType"
            placeholder="请选择代理类型"
            clearable
            style="width: 150px"
          >
            <el-option :value="1" label="HTTP" />
            <el-option :value="2" label="HTTPS" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAddProxy">新增代理</el-button>
      </div>

      <el-table :data="proxyPage.items" row-key="id" style="width: 100%">
        <el-table-column prop="proxyHost" label="代理主机" />
        <el-table-column prop="proxyPort" label="代理端口" />
        <el-table-column prop="proxyUsername" label="代理用户" />
        <el-table-column label="代理类型">
          <template #default="{ row }">
            {{ row.proxyType === 1 ? "HTTP" : "HTTPS" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
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
        :total="proxyPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 新增和编辑主机代理的抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="editingProxy ? '编辑代理' : '新增代理'"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <CreateProxyForm
        :initial-values="editingProxy"
        @save="handleSaveProxy"
        @update="handleUpdateProxy"
        @cancel="handleCloseDrawer"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import CreateProxyForm from "./components/CreateProxyForm.vue";
import { fetchProxies, createProxy, updateProxy, deleteProxy } from "@/api/proxy";

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({
  proxyHost: "",
  proxyType: undefined,
  proxyUsername: undefined,
});
const filters = reactive({
  proxyHost: "",
  proxyType: undefined,
  proxyUsername: undefined,
});

const drawerVisible = ref(false);
const editingProxy = ref(null);
const proxyPage = reactive({ items: [], total: 0 });

const getProxies = async () => {
  const res = await fetchProxies({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    ...filters,
  });
  proxyPage.items = res.content?.items || [];
  proxyPage.total = res.content?.total || 0;
};

const onSearch = () => {
  filters.proxyHost = searchForm.proxyHost;
  filters.proxyType = searchForm.proxyType;
  filters.proxyUsername = searchForm.proxyUsername;
  pagination.pageNo = 1;
  getProxies();
};

const onReset = () => {
  searchForm.proxyHost = "";
  searchForm.proxyType = undefined;
  searchForm.proxyUsername = undefined;
  onSearch();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getProxies();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  getProxies();
};

const handleAddProxy = () => {
  editingProxy.value = null;
  drawerVisible.value = true;
};

const handleCloseDrawer = () => {
  drawerVisible.value = false;
  editingProxy.value = null;
};

const handleEdit = (proxy) => {
  editingProxy.value = proxy;
  drawerVisible.value = true;
};

const handleDelete = async (proxyId) => {
  await deleteProxy({ serverProxyId: proxyId });
  ElMessage.success("删除成功");
  getProxies();
};

const handleSaveProxy = async (values) => {
  await createProxy(values);
  ElMessage.success("创建成功");
  drawerVisible.value = false;
  getProxies();
};

const handleUpdateProxy = async (values) => {
  await updateProxy({ ...values, id: editingProxy.value?.id });
  ElMessage.success("更新成功");
  drawerVisible.value = false;
  editingProxy.value = null;
  getProxies();
};

onMounted(() => {
  getProxies();
});
</script>

<style lang="less" scoped>
.title {
  background: rgb(148, 121, 242);
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
