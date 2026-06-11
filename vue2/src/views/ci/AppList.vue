<template>
  <div class="page-container">
    <h2 class="page-title">应用中心</h2>
    <el-card>
      <el-form :inline="true" :model="queryForm" class="filter-form" @submit.native.prevent="handleSearch">
        <el-form-item label="应用名称">
          <el-input
            v-model="queryForm.appName"
            placeholder="请输入应用名称"
            style="width: 140px"
            clearable
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select
            v-model="queryForm.department"
            placeholder="请选择部门"
            style="width: 140px"
            clearable
          >
            <el-option
              v-for="dep in departments"
              :key="dep.value"
              :label="dep.label"
              :value="dep.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开发语言">
          <el-select
            v-model="queryForm.language"
            placeholder="请选择开发语言"
            style="width: 140px"
            clearable
          >
            <el-option label="Java" value="java" />
            <el-option label="Python" value="python" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="createAppDrawerVisible = true">创建应用</el-button>
      </div>

      <el-table :data="appPage.items" row-key="appId" border>
        <el-table-column label="应用名称" prop="appName" min-width="140">
          <template slot-scope="{ row }">
            <a class="link" @click="handleView(row)">{{ row.appName }}</a>
          </template>
        </el-table-column>
        <el-table-column label="仓库" prop="repo" width="200" show-overflow-tooltip />
        <el-table-column label="默认分支" prop="defaultBranch" min-width="100" />
        <el-table-column label="部门" prop="department" min-width="100" />
        <el-table-column label="开发语言" prop="language" min-width="90" />
        <el-table-column label="描述" prop="description" min-width="140" show-overflow-tooltip />
        <el-table-column label="开发模式" prop="developMode" min-width="90" />
        <el-table-column label="状态" width="90">
          <template slot-scope="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'">
              {{ row.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template slot-scope="{ row }">
            <a class="link" @click="handleView(row)">查看</a>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, sizes, prev, pager, next"
        :total="appPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <CreateAppDrawer
        :visible="createAppDrawerVisible"
        :departments="departments"
        @close="createAppDrawerVisible = false"
        @created="getAppList"
      />
    </el-card>
  </div>
</template>

<script>
import { pageAppList, getDepartments } from "@/api/app";
import CreateAppDrawer from "./components/CreateAppDrawer.vue";

export default {
  name: "AppList",
  components: { CreateAppDrawer },
  data() {
    return {
      pagination: { pageNo: 1, pageSize: 10 },
      queryForm: { appName: "", department: "", language: "" },
      filters: { appName: "", department: "", language: "" },
      createAppDrawerVisible: false,
      appPage: { items: [], total: 0 },
      departments: [],
    };
  },
  created() {
    this.getAppList();
    this.getDepartments();
  },
  methods: {
    async getAppList() {
      const res = await pageAppList({ ...this.pagination, ...this.filters });
      this.appPage = res.content || { items: [], total: 0 };
    },
    async getDepartments() {
      const res = await getDepartments();
      this.departments = res.content || [];
    },
    handleSearch() {
      this.filters = { ...this.queryForm };
      this.pagination.pageNo = 1;
      this.getAppList();
    },
    handleReset() {
      this.queryForm = { appName: "", department: "", language: "" };
      this.filters = { appName: "", department: "", language: "" };
      this.pagination.pageNo = 1;
      this.getAppList();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getAppList();
    },
    handleSizeChange(size) {
      this.pagination = { pageNo: 1, pageSize: size };
      this.getAppList();
    },
    handleView(row) {
      this.$router.push(`/devops/ci/app/info/${row.appId}`);
    },
  },
};
</script>

<style lang="less" scoped>
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
.link {
  color: #409eff;
  cursor: pointer;
}
.pagination {
  margin-top: 16px;
  text-align: right;
}
</style>
