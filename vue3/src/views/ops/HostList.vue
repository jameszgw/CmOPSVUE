<template>
  <ScreenPage title="主机管理" gap="8px">
    <template #header-extra>
      <el-form inline :model="searchForm" class="toolbar-form" @submit.prevent>
        <el-form-item label="实例名称">
          <el-input v-model="searchForm.name" placeholder="实例名称" clearable size="small" style="width: 160px" />
        </el-form-item>
        <el-form-item label="主机名称">
          <el-input v-model="searchForm.hostName" placeholder="主机名称" clearable size="small" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="onSearch">查询</el-button>
          <el-button size="small" @click="onReset">重置</el-button>
          <el-button type="primary" size="small" @click="handleCreateHostDrawer">新增主机</el-button>
        </el-form-item>
      </el-form>
    </template>

    <div class="two-pane fill">
      <SectionCard dense scrollable class="side-pane" title="机组" icon="Menu">
        <HostGroupTree :data="hostGroups" @group-select="handleGroupSelect" />
      </SectionCard>

      <SectionCard
        dense
        bodyClass="dense-table fill table-pane"
        class="fill main-pane"
        title="主机列表"
        icon="Monitor"
      >
        <el-table class="dense-table fill" height="100%" :data="hostPage.items" row-key="hostId" size="small" stripe>
          <el-table-column prop="name" label="实例名称" />
          <el-table-column prop="hostName" label="主机名称" />
          <el-table-column prop="serverAddr" label="服务地址" />
          <el-table-column prop="port" label="端口" width="80" />
          <el-table-column label="认证模式" width="100">
            <template #default="{ row }">
              <el-tag type="success" size="small">{{ row.authType === 1 ? "基础模式" : "秘钥模式" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
                {{ row.status === "0" ? "正常" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300">
            <template #default="{ row }">
              <el-button link type="primary" @click="handlePing(row.hostId)">Ping</el-button>
              <el-button link type="primary" @click="openTerminal(row)">终端</el-button>
              <el-button link type="primary" @click="handleSftpView(row)">SFTP</el-button>
              <el-button link type="primary" @click="handleCopy(row.hostId)">复制</el-button>
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row.hostId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          class="pagination"
          background
          small
          layout="total, sizes, prev, pager, next"
          :total="hostPage.total"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </SectionCard>
    </div>

    <!-- 新增和编辑主机的抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="editingHost ? '编辑主机' : '新增主机'"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <CreateHostForm
        :initial-values="editingHost"
        :host-groups="hostGroups"
        :machine-proxies="proxyPage.items"
        :server-keys="serverKeys.items"
        @submit="handleSaveHost"
        @update="handleUpdateHost"
        @cancel="handleCloseDrawer"
      />
    </el-drawer>

    <SingleTerminalComponent
      :ws-url="wsUrl"
      :open="isModalOpen"
      :modal-host="modalHost"
      @close="closeTerminal"
    />
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
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
} from "@/api/host";
import { fetchProxies } from "@/api/proxy";

const router = useRouter();

// 主机终端 WebSocket 地址
const wsUrl = `ws://${window.location.host}/api/keep-alive/machine/terminal/`;

const selectedGroup = ref(null);
const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ name: "", hostName: "" });
const filters = reactive({ name: "", hostName: "" });

const drawerVisible = ref(false);
const editingHost = ref(null);
const isModalOpen = ref(false);
const modalHost = ref(null);

const hostPage = reactive({ items: [], total: 0 });
const proxyPage = reactive({ items: [] });
const serverKeys = reactive({ items: [] });
const hostGroups = ref([]);

const flattenTreeToList = (tree) => {
  const result = [];
  const flatten = (node) => {
    result.push(node);
    (node.children || []).forEach(flatten);
  };
  (tree || []).forEach(flatten);
  return result;
};

const getAllGroupIds = (groupId) => {
  const treeList = flattenTreeToList(hostGroups.value);
  const findNodeById = (id) => treeList.find((group) => group.hostGroupId === id);
  const result = [];
  const findChildren = (nodeId) => {
    const node = findNodeById(nodeId);
    if (node) {
      result.push(nodeId);
      (node.children || []).forEach((child) => findChildren(child.hostGroupId));
    }
  };
  findChildren(groupId);
  return result;
};

const getHosts = async () => {
  const hostGroupsIds = selectedGroup.value ? getAllGroupIds(selectedGroup.value) : [];
  const res = await fetchHosts({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    hostGroupsIds,
    name: filters.name,
    hostName: filters.hostName,
  });
  hostPage.items = res.content?.items || [];
  hostPage.total = res.content?.total || 0;
};

const getHostGroups = async () => {
  const res = await fetchHostGroups();
  hostGroups.value = res.content || [];
};

const getMachineProxies = async () => {
  const res = await fetchProxies({});
  proxyPage.items = res.content?.items || [];
};

const getServerKeys = async () => {
  const res = await queryServerKeys({});
  serverKeys.items = res.content?.items || [];
};

const handleGroupSelect = (groupId) => {
  selectedGroup.value = groupId;
  pagination.pageNo = 1;
  getHosts();
};

const onSearch = () => {
  filters.name = searchForm.name;
  filters.hostName = searchForm.hostName;
  pagination.pageNo = 1;
  pagination.pageSize = 10;
  getHosts();
};

const onReset = () => {
  searchForm.name = "";
  searchForm.hostName = "";
  filters.name = "";
  filters.hostName = "";
  pagination.pageNo = 1;
  getHosts();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getHosts();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  getHosts();
};

const handleSftpView = (record) => {
  router.push(`/devops/ops/sftp-manage/${record.hostId}`);
};

const handleEdit = (host) => {
  editingHost.value = host;
  drawerVisible.value = true;
};

const handleDelete = (hostId) => {
  ElMessageBox.confirm("确定要删除该主机吗？", "确认删除", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await deleteHost({ hostId });
      ElMessage.success("删除成功");
      getHosts();
    })
    .catch(() => {});
};

const handlePing = async (hostId) => {
  await pingHost({ hostId });
  ElMessage.success("Ping 操作成功");
};

const handleCopy = async (hostId) => {
  await copyHost({ hostId });
  ElMessage.success("复制成功");
  getHosts();
};

const openTerminal = (record) => {
  modalHost.value = record;
  isModalOpen.value = true;
};

const closeTerminal = () => {
  modalHost.value = null;
  isModalOpen.value = false;
};

const handleCreateHostDrawer = () => {
  editingHost.value = null;
  drawerVisible.value = true;
};

const handleCloseDrawer = () => {
  editingHost.value = null;
  drawerVisible.value = false;
};

const handleSaveHost = async (values) => {
  await createHost(values);
  ElMessage.info("添加成功");
  drawerVisible.value = false;
  getHosts();
};

const handleUpdateHost = async (values) => {
  await updateHost({ ...values, hostId: editingHost.value?.hostId });
  ElMessage.success("更新成功");
  drawerVisible.value = false;
  editingHost.value = null;
  getHosts();
};

onMounted(() => {
  getHostGroups();
  getHosts();
  getMachineProxies();
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

// 左右两栏：左侧机组树固定窄宽，右侧表格占满剩余空间，整体填满一屏。
.two-pane {
  display: flex;
  gap: @space-sm;
  min-height: 0;
}

.side-pane {
  width: 220px;
  flex-shrink: 0;
}

.main-pane {
  min-width: 0;
}

// 表格正文：纵向 flex，表格占满、分页固定在底部可见。
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
