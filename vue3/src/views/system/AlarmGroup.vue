<template>
  <div class="page-container">
    <el-card>
      <div class="page-title">告警组列表</div>
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="名称">
          <el-input
            v-model="searchForm.groupName"
            placeholder="请输入名称"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">新增告警组</el-button>
      </div>

      <el-table :data="alarmGroupPage.items" row-key="id">
        <el-table-column prop="groupName" label="告警组名称" />
        <el-table-column prop="groupDescription" label="描述" />
        <el-table-column label="通知人">
          <template #default="{ row }">
            {{ (row.users || []).map((user) => user.username).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="WebHook">
          <template #default="{ row }">
            {{ (row.notifies || []).map((n) => n.webHookName).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间">
          <template #default="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="修改时间">
          <template #default="{ row }">
            {{ formatTime(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
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
        :total="alarmGroupPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="editingAlarmGroup ? '编辑告警组' : '新增告警组'"
      size="400px"
      destroy-on-close
      @closed="editingAlarmGroup = null"
    >
      <CreateAlarmGroupForm
        :initial-values="editingAlarmGroup"
        :webhooks="webhooks"
        :members="userList"
        @save="handleSave"
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
  fetchAlarmGroup,
  createAlarmGroup,
  updateAlarmGroup,
  deleteAlarmGroup,
} from "@/api/alarm-group";
import { fetchWebhooks } from "@/api/webhook";
import { queryMembers } from "@/api/user";
import CreateAlarmGroupForm from "./components/CreateAlarmGroup.vue";

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ groupName: "" });
const filters = reactive({ groupName: "" });

const drawerVisible = ref(false);
const editingAlarmGroup = ref(null);
const userList = ref([]);
const webhooks = ref([]);
const alarmGroupPage = reactive({ items: [], total: 0 });

const formatTime = (time) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";

const getAlarmGroups = async () => {
  const res = await fetchAlarmGroup({ ...pagination, ...filters });
  alarmGroupPage.items = res.content?.items || [];
  alarmGroupPage.total = res.content?.total || 0;
};

const fetchUserList = async () => {
  const res = await queryMembers({});
  userList.value = res.content?.items || [];
};

const loadWebhooks = async () => {
  const res = await fetchWebhooks({ pageNo: 1, pageSize: 10 });
  webhooks.value = res.content?.items || [];
  await fetchUserList();
};

const handleSearch = () => {
  filters.groupName = searchForm.groupName;
  pagination.pageNo = 1;
  getAlarmGroups();
};

const handleReset = () => {
  searchForm.groupName = "";
  filters.groupName = "";
  pagination.pageNo = 1;
  getAlarmGroups();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getAlarmGroups();
};

const handleAdd = () => {
  editingAlarmGroup.value = null;
  drawerVisible.value = true;
};

const handleEdit = (alarmGroup) => {
  editingAlarmGroup.value = alarmGroup;
  drawerVisible.value = true;
};

const handleDelete = (alarmGroupId) => {
  ElMessageBox.confirm("确定要删除该告警组吗？", "确认删除", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await deleteAlarmGroup({ alarmGroupId });
      ElMessage.success("删除成功");
      getAlarmGroups();
    })
    .catch(() => {});
};

const handleCloseDrawer = () => {
  drawerVisible.value = false;
  editingAlarmGroup.value = null;
};

const handleSave = async (values) => {
  if (editingAlarmGroup.value) {
    await updateAlarmGroup({
      ...values,
      alarmGroupId: editingAlarmGroup.value.id,
    });
    ElMessage.success("更新成功");
  } else {
    await createAlarmGroup(values);
    ElMessage.success("创建成功");
  }
  drawerVisible.value = false;
  editingAlarmGroup.value = null;
  getAlarmGroups();
};

onMounted(() => {
  getAlarmGroups();
  loadWebhooks();
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
  background: rgb(219, 242, 121);
}
</style>
