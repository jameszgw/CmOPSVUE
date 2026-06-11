<template>
  <div class="page-container app-list-page">
    <h2 class="page-title">应用中心</h2>
    <el-card>
      <el-form inline class="filter-form">
        <el-form-item label="应用名称">
          <el-input
            v-model="filterForm.appName"
            placeholder="请输入应用名称"
            style="width: 140px"
            clearable
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select
            v-model="filterForm.department"
            placeholder="请选择部门"
            style="width: 140px"
            clearable
          >
            <el-option
              v-for="option in departments"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开发语言">
          <el-select
            v-model="filterForm.language"
            placeholder="请选择开发语言"
            style="width: 140px"
            clearable
          >
            <el-option label="Java" value="java" />
            <el-option label="Python" value="python" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="createAppDrawerVisible = true">创建应用</el-button>
      </div>

      <el-table :data="appPage.items" row-key="appId" v-loading="loading">
        <el-table-column label="应用名称" prop="appName">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.appName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="仓库" prop="repo" width="200" show-overflow-tooltip />
        <el-table-column label="默认分支" prop="defaultBranch" />
        <el-table-column label="部门" prop="department" />
        <el-table-column label="开发语言" prop="language" />
        <el-table-column label="描述" prop="description" show-overflow-tooltip />
        <el-table-column label="开发模式" prop="developMode" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'">
              {{ row.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">查看</el-link>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next"
        :total="appPage.total"
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        @current-change="getAppList"
        @size-change="handleSizeChange"
      />
    </el-card>

    <CreateAppDrawer
      :open="createAppDrawerVisible"
      :departments="departments"
      @close="createAppDrawerVisible = false"
      @created="getAppList"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { pageAppList, getDepartments as fetchDepartments } from "@/api/app";
import CreateAppDrawer from "./components/CreateAppDrawer.vue";

const router = useRouter();

const loading = ref(false);
const pagination = reactive({ pageNo: 1, pageSize: 10 });
const filterForm = reactive({ appName: "", department: "", language: "" });
const appPage = reactive({ items: [], total: 0 });
const departments = ref([]);
const createAppDrawerVisible = ref(false);

const getAppList = async () => {
  loading.value = true;
  try {
    const res = await pageAppList({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      appName: filterForm.appName,
      department: filterForm.department,
      language: filterForm.language,
    });
    appPage.items = res.content?.items || [];
    appPage.total = res.content?.total || 0;
  } finally {
    loading.value = false;
  }
};

const getDepartments = async () => {
  const res = await fetchDepartments();
  departments.value = res.content || [];
};

const handleSearch = () => {
  pagination.pageNo = 1;
  getAppList();
};

const handleReset = () => {
  filterForm.appName = "";
  filterForm.department = "";
  filterForm.language = "";
  pagination.pageNo = 1;
  getAppList();
};

const handleSizeChange = () => {
  pagination.pageNo = 1;
  getAppList();
};

const handleView = (row) => {
  router.push(`/devops/ci/app/info/${row.appId}`);
};

onMounted(() => {
  getAppList();
  getDepartments();
});
</script>

<style lang="less" scoped>
.app-list-page {
  .page-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
  }
  .filter-form {
    margin-bottom: 8px;
  }
  .toolbar {
    margin-bottom: 16px;
  }
  .pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
}
</style>
