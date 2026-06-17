<template>
  <ScreenPage title="告警组列表" gap="8px">
    <template #header-extra>
      <div class="head-tools">
        <el-input
          v-model="searchForm.groupName"
          size="small"
          placeholder="请输入名称"
          clearable
          class="head-tools__input"
          @keyup.enter="handleSearch"
        />
        <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="handleReset">重置</el-button>
        <el-button size="small" type="primary" @click="handleAdd">新增告警组</el-button>
      </div>
    </template>

    <SectionCard
      dense
      scrollable
      bodyClass="dense-table fill"
      class="fill"
      title="告警组"
      icon="Bell"
    >
      <el-table class="dense-table" height="100%" :data="alarmGroupPage.items" row-key="id" size="small" stripe>
        <el-table-column prop="groupName" label="告警组名称" min-width="140" />
        <el-table-column prop="groupDescription" label="描述" min-width="140" show-overflow-tooltip />
        <el-table-column label="通知人" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row.users || []).map((user) => user.username).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="WebHook" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row.notifies || []).map((n) => n.webHookName).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="修改时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <div class="pager">
      <el-pagination
        background
        small
        layout="total, prev, pager, next"
        :total="alarmGroupPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </div>

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
  </ScreenPage>
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
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
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
@import (reference) "@/styles/variables.less";

.head-tools {
  display: flex;
  align-items: center;
  gap: @space-sm;

  &__input {
    width: 180px;
  }
}

.pager {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}
</style>
