<template>
  <div class="page-container">
    <h2 class="title">主机环境变量</h2>
    <el-row :gutter="16">
      <el-col :span="6">
        <left-host-list @item-click="handleHostItemClick" />
      </el-col>
      <el-col :span="18">
        <el-form inline :model="searchForm" @submit.native.prevent>
          <el-form-item label="变量名称">
            <el-input v-model="searchForm.name" placeholder="变量名称" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="margin-right: 8px" @click="onSearch">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-button type="primary" style="margin-bottom: 16px" @click="handleAddNew">
          新增环境变量
        </el-button>

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
              <el-button type="text" @click="handleEdit(row)">编辑</el-button>
              <el-button type="text" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          style="margin-top: 12px; text-align: right"
          layout="total, prev, pager, next, sizes"
          :total="hostEnvs.total"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />

        <el-drawer
          :title="selectedEnv ? '编辑环境变量' : '新增环境变量'"
          :visible.sync="drawerVisible"
          size="360px"
          destroy-on-close
        >
          <div style="padding: 0 20px">
            <create-host-env-form
              v-if="drawerVisible"
              :initial-values="selectedEnv"
              @save="handleSaveHostEnv"
              @update="handleUpdateHostEnv"
              @cancel="onCloseDrawer"
            />
          </div>
        </el-drawer>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import dayjs from "dayjs";
import LeftHostList from "./components/LeftHostList.vue";
import CreateHostEnvForm from "./components/CreateHostEnvForm.vue";
import {
  fetchVariables,
  addVariable,
  updateVariable,
  deleteVariable,
} from "@/api/host-env";

export default {
  name: "ServerEnv",
  components: {
    LeftHostList,
    CreateHostEnvForm,
  },
  data() {
    return {
      selectedMachine: "",
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { name: "" },
      filters: { name: "" },
      hostEnvs: { items: [], total: 0 },
      drawerVisible: false,
      selectedEnv: null,
    };
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";
    },
    async fetchVariables(hostId) {
      const res = await fetchVariables({
        ...this.pagination,
        ...this.filters,
        hostId,
      });
      this.hostEnvs = res.content || { items: [], total: 0 };
    },
    handleHostItemClick(hostId) {
      this.selectedMachine = hostId; // 设置选中的主机ID
      this.fetchVariables(hostId); // 调用加载环境变量数据的函数
    },
    onSearch() {
      this.filters = { ...this.searchForm };
      this.pagination = { pageNo: 1, pageSize: this.pagination.pageSize };
      this.fetchVariables(this.selectedMachine);
    },
    onReset() {
      this.searchForm = { name: "" };
      this.filters = { name: "" };
      this.fetchVariables(this.selectedMachine);
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.fetchVariables(this.selectedMachine);
    },
    handleSizeChange(pageSize) {
      this.pagination = { pageNo: 1, pageSize };
      this.fetchVariables(this.selectedMachine);
    },
    handleAddNew() {
      this.selectedEnv = null;
      this.drawerVisible = true;
    },
    handleEdit(env) {
      this.selectedEnv = env;
      this.drawerVisible = true;
    },
    onCloseDrawer() {
      this.drawerVisible = false;
    },
    async handleDelete(envId) {
      await deleteVariable({ envId });
      this.$message.success("删除成功");
      this.fetchVariables(this.selectedMachine);
    },
    async handleSaveHostEnv(values) {
      this.drawerVisible = false;
      await addVariable({ ...values, hostId: this.selectedMachine });
      this.$message.success("新增成功");
      this.fetchVariables(this.selectedMachine);
    },
    async handleUpdateHostEnv(values) {
      const id = this.selectedEnv && this.selectedEnv.id;
      this.drawerVisible = false;
      await updateVariable({ ...values, id });
      this.$message.success("更新成功");
      this.fetchVariables(this.selectedMachine);
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(242, 171, 121);
}
</style>
