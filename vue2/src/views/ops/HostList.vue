<template>
  <screen-page title="主机管理" gap="8px">
    <template #header-extra>
      <el-form inline size="mini" :model="searchForm" class="filter-form" @submit.native.prevent>
        <el-form-item label="实例名称">
          <el-input v-model="searchForm.name" placeholder="请输入实例名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="主机名称">
          <el-input v-model="searchForm.hostName" placeholder="请输入主机名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleCreateHostDrawer">新增主机</el-button>
          <el-button icon="el-icon-download" :loading="importLoading" @click="importDevices">从设备维护导入</el-button>
        </el-form-item>
      </el-form>
    </template>

    <div class="two-pane fill">
      <section-card dense scrollable body-class="fill" class="pane-side" title="主机分组" icon="el-icon-files">
        <host-group-tree :data="hostGroups" @group-select="handleGroupSelect" />
      </section-card>

      <section-card dense body-class="pane-main-body" class="pane-main" title="主机列表" icon="el-icon-cpu">
        <div class="table-wrap dense-table fill">
          <el-table class="dense-table" height="100%" :data="hostPage.items" row-key="hostId" size="small" stripe style="width: 100%">
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
        </div>
        <el-pagination
          class="pane-pagination"
          layout="total, prev, pager, next, sizes"
          :total="hostPage.total"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </section-card>
    </div>

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
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
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
  importFromDevices,
} from "@/api/host";
import { fetchProxies } from "@/api/proxy";

export default {
  name: "HostList",
  components: {
    ScreenPage,
    SectionCard,
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
      importLoading: false,
    };
  },
  created() {
    this.fetchHostGroups();
    this.getHosts();
    this.fetchMachineProxies();
    this.fetchServerKeys();
  },
  methods: {
    async importDevices() {
      try {
        await this.$confirm(
          "将「设备维护」中的 SERVER 服务器导入为运维主机（按 IP 去重，已存在则跳过）。是否继续？",
          "从设备维护导入",
          { confirmButtonText: "导入", cancelButtonText: "取消", type: "info" }
        );
      } catch (e) {
        return;
      }
      this.importLoading = true;
      try {
        const res = await importFromDevices();
        this.$message.success((res.content && res.content.message) || "导入完成");
        await this.getHosts();
      } finally {
        this.importLoading = false;
      }
    },
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
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.filter-form /deep/ .el-form-item {
  margin-bottom: 0;
}

.two-pane {
  display: flex;
  gap: 8px;
  min-height: 0;
}
.pane-side {
  width: 240px;
  flex-shrink: 0;
}
.pane-main {
  flex: 1;
  min-width: 0;
}

// 主体填满，表格占据剩余高度内部滚动，分页固定在底部
.pane-main /deep/ .pane-main-body {
  display: flex;
  flex-direction: column;
}
.table-wrap {
  flex: 1;
  min-height: 0;
}
.pane-pagination {
  flex-shrink: 0;
  text-align: right;
  padding-top: 8px;
}
</style>
