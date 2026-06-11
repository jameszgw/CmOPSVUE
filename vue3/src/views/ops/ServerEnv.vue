<template>
  <div class="page-container">
    <h2 class="page-title">主机环境变量</h2>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never">
          <LeftHostList @item-click="handleHostItemClick" />
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card shadow="never">
          <el-form inline :model="searchForm" @submit.prevent>
            <el-form-item label="变量名称">
              <el-input v-model="searchForm.name" placeholder="变量名称" clearable />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSearch">查询</el-button>
              <el-button @click="onReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar">
            <el-button type="primary" @click="handleAddNew">新增环境变量</el-button>
          </div>

          <el-table :data="hostEnvs.items" row-key="id" style="width: 100%">
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
            layout="total, sizes, prev, pager, next"
            :total="hostEnvs.total"
            :current-page="pagination.pageNo"
            :page-size="pagination.pageSize"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </el-card>
      </el-col>
    </el-row>

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
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
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
.title {
  background: rgb(242, 171, 121);
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
