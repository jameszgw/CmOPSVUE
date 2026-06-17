<template>
  <screen-page title="告警组列表" gap="8px">
    <template #header-extra>
      <el-form
        :inline="true"
        :model="searchForm"
        class="filter-form"
        @submit.native.prevent="handleSearch"
      >
        <el-form-item>
          <el-input
            v-model="searchForm.groupName"
            placeholder="名称"
            style="width: 140px"
            size="small"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" native-type="submit">查询</el-button>
          <el-button size="small" @click="handleReset">重置</el-button>
          <el-button type="primary" size="small" @click="handleAdd">新增告警组</el-button>
        </el-form-item>
      </el-form>
    </template>

    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="告警组"
      icon="el-icon-bell"
    >
      <el-table
        class="dense-table"
        height="100%"
        :data="alarmGroups"
        row-key="id"
        size="small"
        v-loading="loading"
      >
        <el-table-column prop="groupName" label="告警组名称" />
        <el-table-column prop="groupDescription" label="描述" show-overflow-tooltip />
        <el-table-column label="通知人" show-overflow-tooltip>
          <template slot-scope="{ row }">
            {{ (row.users || []).map((user) => user.username).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="WebHook" show-overflow-tooltip>
          <template slot-scope="{ row }">
            {{ (row.notifies || []).map((notify) => notify.webHookName).join(", ") }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template slot-scope="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="修改时间" width="160">
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
    </section-card>

    <el-pagination
      class="pagination"
      layout="total, prev, pager, next, sizes"
      :total="total"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />

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
  </screen-page>
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
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CreateAlarmGroup from "./components/CreateAlarmGroup.vue";

export default {
  name: "AlarmGroup",
  components: { ScreenPage, SectionCard, CreateAlarmGroup },
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
.filter-form {
  display: flex;
  align-items: center;
}
.filter-form /deep/ .el-form-item {
  margin-bottom: 0;
}
.pagination {
  flex-shrink: 0;
  text-align: right;
}
.drawer-body {
  padding: 0 20px;
}
</style>
