<template>
  <div class="page-container">
    <h2 class="page-title">告警组列表</h2>
    <el-card>
      <el-form :inline="true" :model="searchForm" @submit.native.prevent="handleSearch">
        <el-form-item label="名称">
          <el-input v-model="searchForm.groupName" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">新增告警组</el-button>
      </div>

      <el-table :data="alarmGroups" row-key="id" v-loading="loading">
        <el-table-column prop="groupName" label="告警组名称" />
        <el-table-column prop="groupDescription" label="描述" />
        <el-table-column label="通知人">
          <template slot-scope="{ row }">
            {{ (row.users || []).map((user) => user.username).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="WebHook">
          <template slot-scope="{ row }">
            {{ (row.notifies || []).map((notify) => notify.webHookName).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template slot-scope="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="修改时间" width="170">
          <template slot-scope="{ row }">
            {{ formatTime(row.gmtModified) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="{ row }">
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
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
      :title="editingAlarmGroup ? '编辑告警组' : '新增告警组'"
      :visible.sync="drawerVisible"
      size="400px"
      :destroy-on-close="true"
      @close="handleCloseDrawer"
    >
      <div class="drawer-body">
        <create-alarm-group
          v-if="drawerVisible"
          :initial-values="editingAlarmGroup"
          :webhooks="webhooks"
          :members="userList"
          @save="handleSave"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import dayjs from "dayjs";
import {
  fetchAlarmGroup,
  createAlarmGroup,
  updateAlarmGroup,
  deleteAlarmGroup,
} from "@/api/alarm-group";
import { fetchWebhooks } from "@/api/webhook";
import { queryMembers } from "@/api/user";
import CreateAlarmGroup from "./components/CreateAlarmGroup.vue";

export default {
  name: "AlarmGroup",
  components: { CreateAlarmGroup },
  data() {
    return {
      loading: false,
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { groupName: "" },
      filters: { groupName: "" },
      alarmGroups: [],
      total: 0,
      drawerVisible: false,
      editingAlarmGroup: null,
      userList: [],
      webhooks: [],
    };
  },
  created() {
    this.getAlarmGroups();
    this.loadWebhooksAndMembers();
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-";
    },
    async getAlarmGroups() {
      this.loading = true;
      try {
        const res = await fetchAlarmGroup({
          ...this.pagination,
          ...this.filters,
        });
        const page = res.content || {};
        this.alarmGroups = page.items || [];
        this.total = page.total || 0;
      } finally {
        this.loading = false;
      }
    },
    async loadWebhooksAndMembers() {
      const res = await fetchWebhooks({ pageNo: 1, pageSize: 10 });
      this.webhooks = (res.content && res.content.items) || [];
      const userRes = await queryMembers({});
      this.userList = (userRes.content && userRes.content.items) || [];
    },
    handleSearch() {
      this.filters = { ...this.searchForm };
      this.pagination.pageNo = 1;
      this.getAlarmGroups();
    },
    handleReset() {
      this.searchForm = { groupName: "" };
      this.filters = { groupName: "" };
      this.pagination.pageNo = 1;
      this.getAlarmGroups();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getAlarmGroups();
    },
    handleSizeChange(size) {
      this.pagination = { pageNo: 1, pageSize: size };
      this.getAlarmGroups();
    },
    handleAdd() {
      this.editingAlarmGroup = null;
      this.drawerVisible = true;
    },
    handleEdit(alarmGroup) {
      this.editingAlarmGroup = alarmGroup;
      this.drawerVisible = true;
    },
    handleDelete(alarmGroupId) {
      this.$confirm("确定要删除该告警组吗？", "确认删除", {
        type: "warning",
      })
        .then(async () => {
          await deleteAlarmGroup({ alarmGroupId });
          this.$message.success("删除成功");
          this.getAlarmGroups();
        })
        .catch(() => {});
    },
    handleCloseDrawer() {
      this.drawerVisible = false;
      this.editingAlarmGroup = null;
    },
    async handleSave(values) {
      if (this.editingAlarmGroup) {
        await updateAlarmGroup({
          ...values,
          alarmGroupId: this.editingAlarmGroup.id,
        });
        this.$message.success("更新成功");
      } else {
        await createAlarmGroup(values);
        this.$message.success("创建成功");
      }
      this.drawerVisible = false;
      this.editingAlarmGroup = null;
      this.getAlarmGroups();
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

// 原 alarm-group.less
.title {
  background: rgb(219, 242, 121);
}
</style>
