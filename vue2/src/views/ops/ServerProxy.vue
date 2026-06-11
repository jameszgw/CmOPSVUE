<template>
  <div class="page-container">
    <h2 class="title">主机代理</h2>
    <el-card shadow="never">
      <el-form inline :model="searchForm" @submit.native.prevent>
        <el-form-item label="代理主机">
          <el-input v-model="searchForm.proxyHost" placeholder="请输入代理主机" />
        </el-form-item>
        <el-form-item label="代理用户">
          <el-input v-model="searchForm.proxyUsername" placeholder="请输入用户" />
        </el-form-item>
        <el-form-item label="代理类型">
          <el-select v-model="searchForm.proxyType" placeholder="请选择代理类型" clearable style="width: 150px">
            <el-option label="HTTP" :value="1" />
            <el-option label="HTTPS" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="margin-right: 8px" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-button type="primary" style="margin-bottom: 16px" @click="handleAddProxy">
        新增代理
      </el-button>

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
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
            <el-button type="text" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 12px; text-align: right"
        layout="total, prev, pager, next, sizes"
        :total="proxyPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 新增和编辑主机代理的抽屉 -->
    <el-drawer
      :title="editingProxy ? '编辑代理' : '新增代理'"
      :visible.sync="drawerVisible"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <div style="padding: 0 20px">
        <create-proxy-form
          v-if="drawerVisible"
          :initial-values="editingProxy"
          @save="handleSaveProxy"
          @update="handleUpdateProxy"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import CreateProxyForm from "./components/CreateProxyForm.vue";
import {
  fetchProxies,
  createProxy,
  updateProxy,
  deleteProxy,
} from "@/api/proxy";

export default {
  name: "ServerProxy",
  components: {
    CreateProxyForm,
  },
  data() {
    return {
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { proxyHost: "", proxyType: undefined, proxyUsername: undefined },
      filters: { proxyHost: "", proxyType: undefined, proxyUsername: undefined },
      drawerVisible: false,
      editingProxy: null,
      proxyPage: { items: [], total: 0 },
    };
  },
  created() {
    this.getProxies();
  },
  methods: {
    async getProxies() {
      const res = await fetchProxies({ ...this.pagination, ...this.filters });
      this.proxyPage = res.content || { items: [], total: 0 };
    },
    onSearch() {
      this.filters = { ...this.searchForm };
      this.pagination = { pageNo: 1, pageSize: this.pagination.pageSize };
      this.getProxies();
    },
    onReset() {
      this.searchForm = { proxyHost: "", proxyType: undefined, proxyUsername: undefined };
      this.filters = { proxyHost: "", proxyType: undefined, proxyUsername: undefined };
      this.getProxies();
    },
    handleEdit(proxy) {
      this.editingProxy = proxy;
      this.drawerVisible = true;
    },
    async handleDelete(proxyId) {
      await deleteProxy({ serverProxyId: proxyId });
      this.getProxies();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getProxies();
    },
    handleSizeChange(pageSize) {
      this.pagination = { pageNo: 1, pageSize };
      this.getProxies();
    },
    handleAddProxy() {
      this.drawerVisible = true;
    },
    handleCloseDrawer() {
      this.drawerVisible = false;
      this.editingProxy = null;
    },
    async handleSaveProxy(values) {
      try {
        await createProxy(values);
        this.getProxies();
        this.drawerVisible = false;
      } catch (error) {
        console.error("创建主机代理失败:", error);
      }
    },
    async handleUpdateProxy(values) {
      try {
        const id = this.editingProxy && this.editingProxy.id;
        await updateProxy({ ...values, id });
        this.getProxies();
        this.drawerVisible = false;
        this.editingProxy = null;
      } catch (error) {
        console.error("更新主机代理失败:", error);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(148, 121, 242);
}
</style>
