<template>
  <div class="page-container">
    <h2 class="page-title">系统日志</h2>
    <el-card>
      <el-form :inline="true" :model="searchForm" @submit.native.prevent="handleSearch">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.userName" placeholder="请输入用户名称" clearable />
        </el-form-item>

        <el-form-item label="事件分类">
          <el-select
            v-model="searchForm.eventClassify"
            placeholder="请选择事件分类"
            style="width: 150px"
            clearable
            @change="handleClassifyChange"
          >
            <el-option
              v-for="(label, key) in eventClassifyList"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="操作内容">
          <el-select
            v-model="searchForm.eventType"
            placeholder="请选择操作内容"
            style="width: 150px"
            clearable
          >
            <el-option
              v-for="(label, key) in eventTypeList"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="logs" row-key="id" v-loading="loading">
        <el-table-column prop="userName" label="用户名" />
        <el-table-column prop="eventClassifyName" label="事件分类" />
        <el-table-column prop="eventTypeName" label="事件类型" />
        <el-table-column label="日志时间" width="170">
          <template slot-scope="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作状态" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.execResult === 1 ? 'success' : 'danger'" size="small">
              {{ row.execResult === 1 ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="{ row }">
            <el-popover placement="left" title="详细操作内容" trigger="click" width="400">
              <div v-html="row.logInfo"></div>
              <el-button slot="reference" type="text">查看</el-button>
            </el-popover>
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
  </div>
</template>

<script>
import dayjs from "dayjs";
import { queryLogs, getEventClassify, getEventType } from "@/api/logs";

export default {
  name: "SystemLog",
  data() {
    return {
      loading: false,
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: {
        userName: "",
        eventClassify: null,
        eventType: null,
        timeRange: [
          dayjs().subtract(7, "day").format("YYYY-MM-DD HH:mm:ss"),
          dayjs().format("YYYY-MM-DD HH:mm:ss"),
        ],
      },
      filters: {
        userName: "",
        eventClassify: null,
        eventType: null,
        startDate: null,
        endDate: null,
      },
      logs: [],
      total: 0,
      eventClassifyList: {},
      eventTypeList: {},
    };
  },
  created() {
    this.getEventClassifyList();
    this.queryLogList();
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-";
    },
    async queryLogList() {
      this.loading = true;
      try {
        const res = await queryLogs({ ...this.filters, ...this.pagination });
        const page = res.content || {};
        this.logs = page.items || [];
        this.total = page.total || 0;
      } finally {
        this.loading = false;
      }
    },
    async getEventClassifyList() {
      const res = await getEventClassify();
      this.eventClassifyList = res.content || {};
    },
    async getEventTypeList(classify) {
      const res = await getEventType({ classify });
      this.eventTypeList = res.content || {};
    },
    handleClassifyChange(value) {
      // 切换分类时清空之前选择的事件类型并加载新的事件类型
      this.searchForm.eventType = null;
      this.eventTypeList = {};
      if (value) {
        this.getEventTypeList(value);
      }
    },
    handleSearch() {
      const { timeRange, userName, eventClassify, eventType } = this.searchForm;
      this.filters = {
        userName,
        eventClassify: eventClassify || null,
        eventType: eventType || null,
        startDate: timeRange && timeRange.length === 2 ? timeRange[0] : null,
        endDate: timeRange && timeRange.length === 2 ? timeRange[1] : null,
      };
      this.pagination.pageNo = 1;
      this.queryLogList();
    },
    handleReset() {
      this.searchForm = {
        userName: "",
        eventClassify: null,
        eventType: null,
        timeRange: null,
      };
      this.eventTypeList = {};
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.queryLogList();
    },
    handleSizeChange(size) {
      this.pagination = { pageNo: 1, pageSize: size };
      this.queryLogList();
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

.pagination {
  margin-top: 16px;
  text-align: right;
}

// 原 system-log.less
.title {
  background: rgb(242, 121, 135);
}
</style>
