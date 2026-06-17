<template>
  <ScreenPage title="主机环境变量" gap="8px">
    <template #header-extra>
      <el-form inline :model="searchForm" class="toolbar-form" @submit.prevent>
        <el-form-item label="变量名称">
          <el-input v-model="searchForm.name" placeholder="变量名称" clearable size="small" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="onSearch">查询</el-button>
          <el-button size="small" @click="onReset">重置</el-button>
          <el-button type="primary" size="small" @click="handleAddNew">新增环境变量</el-button>
        </el-form-item>
      </el-form>
    </template>

    <div class="two-pane fill">
      <SectionCard dense scrollable class="side-pane" title="主机" icon="Monitor">
        <LeftHostList @item-click="handleHostItemClick" />
      </SectionCard>

      <SectionCard
        dense
        bodyClass="dense-table fill table-pane"
        class="fill main-pane"
        title="环境变量"
        icon="Setting"
      >
        <el-table class="dense-table fill" height="100%" :data="hostEnvs.items" row-key="id" size="small" stripe>
          <el-table-column prop="attrKey" label="Key" />
          <el-table-column prop="attrValue" label="Value" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="创建时间">
            <template #default="{ row }">{{ formatTime(row.gmtCreate) }}</template>
          </el-table-column>
          <el-table-column label="修改时间">
            <template #default="{ row }">{{ formatTime(row.gmtModified) }}</template>
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
          small
          layout="total, sizes, prev, pager, next"
          :total="hostEnvs.total"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </SectionCard>
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="selectedEnv ? '编辑环境变量' : '新增环境变量'"
      size="360px"
      destroy-on-close
      @close="onCloseDrawer"
    >
      <CreateHostEnvForm
        :initial-values="selectedEnv"
        @save="handleSaveHostEnv"
        @update="handleUpdateHostEnv"
        @cancel="onCloseDrawer"
      />
    </el-drawer>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import LeftHostList from "./components/LeftHostList.vue";
import CreateHostEnvForm from "./components/CreateHostEnvForm.vue";
import {
  fetchVariables,
  addVariable,
  updateVariable,
  deleteVariable,
} from "@/api/host-env";

const selectedMachine = ref("");
const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ name: "" });
const filters = reactive({ name: "" });

const hostEnvs = reactive({ items: [], total: 0 });
const drawerVisible = ref(false);
const selectedEnv = ref(null);

const formatTime = (time) => (time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "");

const getVariables = async (hostId) => {
  const res = await fetchVariables({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    ...filters,
    hostId: hostId || selectedMachine.value,
  });
  hostEnvs.items = res.content?.items || [];
  hostEnvs.total = res.content?.total || 0;
};

const handleHostItemClick = (hostId) => {
  selectedMachine.value = hostId;
  pagination.pageNo = 1;
  getVariables(hostId);
};

const onSearch = () => {
  filters.name = searchForm.name;
  pagination.pageNo = 1;
  getVariables();
};

const onReset = () => {
  searchForm.name = "";
  onSearch();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getVariables();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  getVariables();
};

const handleAddNew = () => {
  selectedEnv.value = null;
  drawerVisible.value = true;
};

const handleEdit = (env) => {
  selectedEnv.value = env;
  drawerVisible.value = true;
};

const onCloseDrawer = () => {
  drawerVisible.value = false;
  selectedEnv.value = null;
};

const handleDelete = async (envId) => {
  await deleteVariable({ envId });
  ElMessage.success("删除成功");
  getVariables();
};

const handleSaveHostEnv = async (values) => {
  await addVariable({ ...values, hostId: selectedMachine.value });
  ElMessage.success("新增成功");
  drawerVisible.value = false;
  getVariables();
};

const handleUpdateHostEnv = async (values) => {
  await updateVariable({ ...values, id: selectedEnv.value.id });
  ElMessage.success("更新成功");
  drawerVisible.value = false;
  selectedEnv.value = null;
  getVariables();
};
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

.two-pane {
  display: flex;
  gap: @space-sm;
  min-height: 0;
}

.side-pane {
  width: 260px;
  flex-shrink: 0;
}

.main-pane {
  min-width: 0;
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
