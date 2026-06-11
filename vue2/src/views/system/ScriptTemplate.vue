<template>
  <div class="page-container">
    <h2 class="page-title">脚本列表</h2>
    <el-card>
      <el-form :inline="true" :model="searchForm" @submit.native.prevent="handleSearch">
        <el-form-item label="脚本名称">
          <el-input v-model="searchForm.name" placeholder="请输入脚本名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button type="primary" @click="handleAddScript">新增脚本</el-button>
      </div>

      <el-table :data="scripts" row-key="id" v-loading="loading">
        <el-table-column prop="templateName" label="脚本名称" />
        <el-table-column
          prop="templateValue"
          label="脚本内容"
          width="300"
          show-overflow-tooltip
        />
        <el-table-column prop="description" label="脚本描述" />
        <el-table-column label="创建时间" width="170">
          <template slot-scope="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="170">
          <template slot-scope="{ row }">
            {{ formatTime(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="{ row }">
            <el-button type="text" @click="handleEditScript(row)">编辑</el-button>
            <el-button type="text" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, prev, pager, next, sizes"
        :total="total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-drawer
      :title="editingScript ? '编辑脚本' : '新增脚本'"
      :visible.sync="drawerVisible"
      size="600px"
      :destroy-on-close="true"
      @close="handleCloseDrawer"
    >
      <div class="drawer-body">
        <create-script-form
          v-if="drawerVisible"
          :initial-values="editingScript"
          @save="handleSaveScript"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import dayjs from "dayjs";
import {
  fetchScripts,
  createScript,
  updateScript,
  deleteScript,
} from "@/api/script-template";
import CreateScriptForm from "./components/CreateScriptForm.vue";

export default {
  name: "ScriptTemplate",
  components: { CreateScriptForm },
  data() {
    return {
      loading: false,
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { name: "" },
      filters: { name: "" },
      scripts: [],
      total: 0,
      drawerVisible: false,
      editingScript: null,
    };
  },
  created() {
    this.queryScripts();
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-";
    },
    async queryScripts() {
      this.loading = true;
      try {
        const res = await fetchScripts({ ...this.pagination, ...this.filters });
        const page = res.content || {};
        this.scripts = page.items || [];
        this.total = page.total || 0;
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      this.filters = { ...this.searchForm };
      this.pagination.pageNo = 1;
      this.queryScripts();
    },
    handleReset() {
      this.searchForm = { name: "" };
      this.filters = { name: "" };
      this.pagination.pageNo = 1;
      this.queryScripts();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.queryScripts();
    },
    handleSizeChange(size) {
      this.pagination = { pageNo: 1, pageSize: size };
      this.queryScripts();
    },
    handleAddScript() {
      this.editingScript = null;
      this.drawerVisible = true;
    },
    handleEditScript(script) {
      this.editingScript = script;
      this.drawerVisible = true;
    },
    handleDelete(id) {
      this.$confirm("确定要删除该脚本吗？", "确认删除", {
        type: "warning",
      })
        .then(async () => {
          await deleteScript({ id });
          this.$message.success("删除成功");
          this.queryScripts();
        })
        .catch(() => {});
    },
    handleCloseDrawer() {
      this.drawerVisible = false;
      this.editingScript = null;
    },
    async handleSaveScript(values) {
      if (this.editingScript) {
        await updateScript({ ...values, id: this.editingScript.id });
        this.$message.success("脚本编辑成功");
      } else {
        await createScript(values);
        this.$message.success("脚本添加成功");
      }
      this.drawerVisible = false;
      this.editingScript = null;
      this.queryScripts();
    },
  },
};
</script>

<style lang="less" scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 500;
}

.table-toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  text-align: right;
}

.drawer-body {
  padding: 0 20px;
}

// 原 script-template.less
.title {
  background: rgb(125, 242, 121);
}
</style>
