<template>
  <screen-page title="主机环境变量" gap="8px">
    <template #header-extra>
      <el-form inline size="mini" :model="searchForm" class="filter-form" @submit.native.prevent>
        <el-form-item label="变量名称">
          <el-input v-model="searchForm.name" placeholder="变量名称" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" icon="el-icon-plus" @click="handleAddNew">新增环境变量</el-button>
        </el-form-item>
      </el-form>
    </template>

    <div class="two-pane fill">
      <section-card dense scrollable body-class="fill" class="pane-side" title="主机列表" icon="el-icon-cpu">
        <left-host-list @item-click="handleHostItemClick" />
      </section-card>

      <section-card dense body-class="pane-main-body" class="pane-main" title="环境变量" icon="el-icon-set-up">
        <div class="table-wrap dense-table fill">
          <el-table class="dense-table" height="100%" :data="hostEnvs.items" row-key="id" size="small" stripe style="width: 100%">
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
        </div>
        <el-pagination
          class="pane-pagination"
          layout="total, prev, pager, next, sizes"
          :total="hostEnvs.total"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </section-card>
    </div>

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
  </screen-page>
</template>

<script>
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

export default {
  name: "ServerEnv",
  components: {
    ScreenPage,
    SectionCard,
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
  width: 260px;
  flex-shrink: 0;
}
.pane-main {
  flex: 1;
  min-width: 0;
}

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
