<template>
  <div class="page-container">
    <el-card>
      <div class="page-title">脚本列表</div>
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="脚本名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入脚本名称"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAddScript">新增脚本</el-button>
      </div>

      <el-table :data="scriptPage.items" row-key="id">
        <el-table-column prop="templateName" label="脚本名称" />
        <el-table-column
          prop="templateValue"
          label="脚本内容"
          width="300"
          show-overflow-tooltip
        />
        <el-table-column prop="description" label="脚本描述" />
        <el-table-column label="创建时间">
          <template #default="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间">
          <template #default="{ row }">
            {{ formatTime(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEditScript(row)">
              编辑
            </el-button>
            <el-button type="primary" link @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, prev, pager, next"
        :total="scriptPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="editingScript ? '编辑脚本' : '新增脚本'"
      size="600px"
      destroy-on-close
      @closed="editingScript = null"
    >
      <CreateScriptForm
        :initial-values="editingScript"
        @save="handleSaveScript"
        @cancel="handleCloseDrawer"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  fetchScripts,
  createScript,
  updateScript,
  deleteScript,
} from "@/api/script-template";
import CreateScriptForm from "./components/CreateScriptForm.vue";

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ name: "" });
const filters = reactive({ name: "" });

const drawerVisible = ref(false);
const editingScript = ref(null);
const scriptPage = reactive({ items: [], total: 0 });

const formatTime = (time) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";

const queryScripts = async () => {
  const res = await fetchScripts({ ...pagination, ...filters });
  scriptPage.items = res.content?.items || [];
  scriptPage.total = res.content?.total || 0;
};

const handleSearch = () => {
  filters.name = searchForm.name;
  pagination.pageNo = 1;
  queryScripts();
};

const handleReset = () => {
  searchForm.name = "";
  filters.name = "";
  pagination.pageNo = 1;
  queryScripts();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  queryScripts();
};

const handleAddScript = () => {
  editingScript.value = null;
  drawerVisible.value = true;
};

const handleEditScript = (script) => {
  editingScript.value = script;
  drawerVisible.value = true;
};

const handleDelete = (id) => {
  ElMessageBox.confirm("确定要删除该脚本吗？", "确认删除", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await deleteScript({ id });
      ElMessage.success("删除成功");
      queryScripts();
    })
    .catch(() => {});
};

const handleCloseDrawer = () => {
  drawerVisible.value = false;
  editingScript.value = null;
};

const handleSaveScript = async (values) => {
  if (editingScript.value) {
    await updateScript({ ...values, id: editingScript.value.id });
    ElMessage.success("脚本编辑成功");
  } else {
    await createScript(values);
    ElMessage.success("脚本添加成功");
  }
  drawerVisible.value = false;
  editingScript.value = null;
  queryScripts();
};

onMounted(() => {
  queryScripts();
});
</script>

<style lang="less" scoped>
.page-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.toolbar {
  margin: 16px 0;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.title {
  background: rgb(125, 242, 121);
}
</style>
