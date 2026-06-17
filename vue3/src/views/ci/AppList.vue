<template>
  <ScreenPage title="应用中心" gap="8px">
    <template #header-extra>
      <div class="head-tools">
        <el-input
          v-model="filterForm.appName"
          size="small"
          placeholder="应用名称"
          clearable
          class="head-tools__sm"
        />
        <el-select
          v-model="filterForm.department"
          size="small"
          placeholder="部门"
          clearable
          class="head-tools__sm"
        >
          <el-option
            v-for="option in departments"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select
          v-model="filterForm.language"
          size="small"
          placeholder="开发语言"
          clearable
          class="head-tools__sm"
        >
          <el-option label="Java" value="java" />
          <el-option label="Python" value="python" />
        </el-select>
        <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="handleReset">重置</el-button>
        <el-button size="small" type="primary" @click="createAppDrawerVisible = true">创建应用</el-button>
      </div>
    </template>

    <SectionCard
      dense
      scrollable
      bodyClass="dense-table fill"
      class="fill"
      title="应用"
      icon="Grid"
    >
      <el-table
        class="dense-table"
        height="100%"
        :data="appPage.items"
        row-key="appId"
        size="small"
        stripe
        v-loading="loading"
      >
        <el-table-column label="应用名称" prop="appName" min-width="140">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">{{ row.appName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="仓库" prop="repo" min-width="200" show-overflow-tooltip />
        <el-table-column label="默认分支" prop="defaultBranch" min-width="120" />
        <el-table-column label="部门" prop="department" min-width="100" />
        <el-table-column label="开发语言" prop="language" min-width="100" />
        <el-table-column label="描述" prop="description" min-width="140" show-overflow-tooltip />
        <el-table-column label="开发模式" prop="developMode" min-width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
              {{ row.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-link type="primary" @click="handleView(row)">查看</el-link>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <div class="pager">
      <el-pagination
        background
        small
        layout="total, sizes, prev, pager, next"
        :total="appPage.total"
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        @current-change="getAppList"
        @size-change="handleSizeChange"
      />
    </div>

    <CreateAppDrawer
      :open="createAppDrawerVisible"
      :departments="departments"
      @close="createAppDrawerVisible = false"
      @created="getAppList"
    />
  </ScreenPage>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { pageAppList, getDepartments as fetchDepartments } from "@/api/app";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
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
@import (reference) "@/styles/variables.less";

.head-tools {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;

  &__sm {
    width: 140px;
  }
}

.pager {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}
</style>
