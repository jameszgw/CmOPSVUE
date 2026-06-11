<template>
  <div class="page-container">
    <h2 class="title">主机管理</h2>
    <el-row :gutter="16">
      <el-col :span="4">
        <host-group-tree :data="hostGroups" @group-select="handleGroupSelect" />
      </el-col>
      <el-col :span="20">
        <el-card shadow="never">
          <el-form inline :model="searchForm" @submit.native.prevent>
            <el-form-item label="实例名称">
              <el-input v-model="searchForm.name" placeholder="请输入实例名称" />
            </el-form-item>
            <el-form-item label="主机名称">
              <el-input v-model="searchForm.hostName" placeholder="请输入主机名称" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" style="margin-right: 8px" @click="onSearch">
                查询
              </el-button>
              <el-button @click="onReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-button type="primary" style="margin-bottom: 16px" @click="handleCreateHostDrawer">
            新增主机
          </el-button>

          <el-table :data="hostPage.items" row-key="hostId" style="width: 100%">
            <el-table-column prop="name" label="实例名称" />
            <el-table-column prop="hostName" label="主机名称" />
            <el-table-column prop="serverAddr" label="服务地址" />
            <el-table-column prop="port" label="端口" />
            <el-table-column label="认证模式">
              <template #default="{ row }">
                <el-tag type="success">
                  {{ row.authType === 1 ? "基础模式" : "秘钥模式" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === '0' ? 'success' : 'danger'">
                  {{ row.status === "0" ? "正常" : "停用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300">
              <template #default="{ row }">
                <el-button type="text" @click="handlePing(row.hostId)">Ping</el-button>
                <el-button type="text" @click="openTerminal(row)">终端</el-button>
                <el-button type="text" @click="handleSftpView(row)">SFTP</el-button>
                <el-button type="text" @click="handleCopy(row.hostId)">复制</el-button>
                <el-button type="text" @click="handleEdit(row)">编辑</el-button>
                <el-button type="text" @click="handleDelete(row.hostId)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            style="margin-top: 12px; text-align: right"
            layout="total, prev, pager, next, sizes"
            :total="hostPage.total"
            :current-page="pagination.pageNo"
            :page-size="pagination.pageSize"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增和编辑主机的抽屉 -->
    <el-drawer
      :title="editingHost ? '编辑主机' : '新增主机'"
      :visible.sync="drawerVisible"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <div style="padding: 0 20px">
        <create-host-form
          v-if="drawerVisible"
          :initial-values="editingHost"
          :host-groups="hostGroups"
          :machine-proxies="proxyItems"
          :server-keys="serverKeyItems"
          @submit="handleSaveHost"
          @update="handleUpdateHost"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>

    <single-terminal-component
      :ws-url="wsUrl"
      :open="isModalOpen"
      :modal-host="modalHost"
      @close="closeTerminal"
    />
  </div>
</template>

<script>
import HostGroupTree from "./components/HostGroupTree.vue";
import CreateHostForm from "./components/CreateHostForm.vue";
import SingleTerminalComponent from "./components/SingleTerminalComponent.vue";
import {
  fetchHosts,
  createHost,
  updateHost,
  deleteHost,
  pingHost,
  copyHost,
  fetchHostGroups,
  queryServerKeys,
} from "@/api/host";
import { fetchProxies } from "@/api/proxy";

export default {
  name: "HostList",
  components: {
    HostGroupTree,
    CreateHostForm,
    SingleTerminalComponent,
  },
  data() {
    return {
      // 获取主机的 WebSocket 地址
      wsUrl: `ws://${window.location.host}/api/keep-alive/machine/terminal/`,
      selectedGroup: null,
      pagination: { pageNo: 1, pageSize: 10 },
      filters: { name: "", hostName: "" },
      searchForm: { name: "", hostName: "" },
      hostPage: { items: [], total: 0 },
      hostGroups: [],
      proxyItems: [],
      serverKeyItems: [],
      drawerVisible: false,
      editingHost: null,
      isModalOpen: false,
      modalHost: null,
    };
  },
  created() {
    this.fetchHostGroups();
    this.getHosts();
    this.fetchMachineProxies();
    this.fetchServerKeys();
  },
  methods: {
    async getHosts() {
      let allGroupIds = [];
      if (this.selectedGroup) {
        allGroupIds = this.getAllGroupIds(this.selectedGroup);
      }
      const res = await fetchHosts({
        ...this.pagination,
        hostGroupsIds: allGroupIds,
        name: this.filters.name,
        hostName: this.filters.hostName,
      });
      this.hostPage = res.content || { items: [], total: 0 };
    },
    async fetchHostGroups() {
      const res = await fetchHostGroups();
      this.hostGroups = res.content || [];
    },
    async fetchMachineProxies() {
      const res = await fetchProxies({});
      this.proxyItems = (res.content && res.content.items) || [];
    },
    async fetchServerKeys() {
      const res = await queryServerKeys({});
      this.serverKeyItems = (res.content && res.content.items) || [];
    },
    handleGroupSelect(groupId) {
      this.selectedGroup = groupId;
      this.pagination = { pageNo: 1, pageSize: this.pagination.pageSize };
      this.getHosts();
    },
    flattenTreeToList(tree) {
      const result = [];
      const flatten = (node) => {
        result.push(node);
        if (node.children) {
          node.children.forEach(flatten);
        }
      };
      tree.forEach(flatten);
      return result;
    },
    getAllGroupIds(groupId) {
      const treeList = this.flattenTreeToList(this.hostGroups);
      const findNodeById = (id) => treeList.find((group) => group.hostGroupId === id);
      const result = [];
      const findChildren = (nodeId) => {
        const node = findNodeById(nodeId);
        if (node) {
          result.push(nodeId);
          if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
              findChildren(child.hostGroupId);
            });
          }
        }
      };
      findChildren(groupId);
      return result;
    },
    onSearch() {
      this.filters = { ...this.searchForm };
      this.pagination = { pageNo: 1, pageSize: 10 }; // 重置分页
      this.getHosts();
    },
    onReset() {
      this.searchForm = { name: "", hostName: "" };
      this.filters = { name: "", hostName: "" };
      this.pagination = { pageNo: 1, pageSize: 10 };
      this.getHosts();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getHosts();
    },
    handleSizeChange(pageSize) {
      this.pagination = { pageNo: 1, pageSize };
      this.getHosts();
    },
    handleSftpView(record) {
      this.$router.push(`/devops/ops/sftp-manage/${record.hostId}`);
    },
    handleEdit(host) {
      this.editingHost = host;
      this.drawerVisible = true;
    },
    handleDelete(hostId) {
      this.$confirm("确定要删除该主机吗？", "确认删除", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          await deleteHost({ hostId });
          this.$message.success("删除成功");
          this.getHosts();
        })
        .catch(() => {});
    },
    async handlePing(hostId) {
      await pingHost({ hostId });
      this.$message.success("Ping 操作成功");
    },
    async handleCopy(hostId) {
      await copyHost({ hostId });
      this.$message.success("复制成功");
      this.getHosts();
    },
    openTerminal(record) {
      this.modalHost = record;
      this.isModalOpen = true;
    },
    closeTerminal() {
      this.modalHost = null;
      this.isModalOpen = false;
    },
    handleCreateHostDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    handleCloseDrawer() {
      this.editingHost = null;
      this.drawerVisible = false;
    },
    async handleSaveHost(values) {
      this.drawerVisible = false;
      await createHost(values);
      this.$message.info("添加成功");
      this.getHosts();
    },
    async handleUpdateHost(values) {
      const hostId = this.editingHost && this.editingHost.hostId;
      this.drawerVisible = false;
      await updateHost({ ...values, hostId });
      this.$message.success("更新成功");
      this.getHosts();
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(121, 124, 242);
}
</style>
