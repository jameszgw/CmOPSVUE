<template>
  <div class="page-container">
    <h2 class="title">告警管理</h2>
    <el-card shadow="never">
      <!-- 筛选组件 -->
      <el-form inline :model="searchForm" @submit.native.prevent>
        <el-form-item label="报警类型">
          <el-select v-model="searchForm.alarmType" placeholder="请选择报警类型" clearable style="width: 150px">
            <el-option label="CPU使用率" :value="10" />
            <el-option label="内存使用率" :value="20" />
          </el-select>
        </el-form-item>
        <el-form-item label="报警时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
          />
        </el-form-item>
        <el-form-item label="报警值范围">
          <el-input-number
            v-model="searchForm.minValue"
            placeholder="最小报警值"
            :controls="false"
            style="width: 120px"
          />
          <el-input-number
            v-model="searchForm.maxValue"
            placeholder="最大报警值"
            :controls="false"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="margin-right: 8px" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="alarms" row-key="id" style="width: 100%">
        <el-table-column label="报警类型">
          <template #default="{ row }">
            {{ alarmTypeText(row.alarmType) }}
          </template>
        </el-table-column>
        <el-table-column label="报警时间">
          <template #default="{ row }">
            {{ formatTime(row.alarmTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="alarmValue" label="报警值" />
      </el-table>

      <el-pagination
        style="margin-top: 12px; text-align: right"
        layout="total, prev, pager, next, sizes"
        :total="alarmsTotal"
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
import { pageAlarms } from "@/api/host-alarm-config";

export default {
  name: "HostAlarmHistory",
  data() {
    return {
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: {
        alarmType: "",
        timeRange: [dayjs().subtract(15, "day").toDate(), new Date()],
        minValue: undefined,
        maxValue: undefined,
      },
      filters: {
        alarmType: "",
        startDate: undefined,
        endDate: undefined,
        minValue: undefined,
        maxValue: undefined,
      },
      alarms: [],
      alarmsTotal: 0,
    };
  },
  computed: {
    hostId() {
      return this.$route.params.hostId;
    },
  },
  created() {
    this.fetchAlarms();
  },
  methods: {
    alarmTypeText(alarmType) {
      switch (alarmType) {
        case 10:
          return "CPU使用率";
        case 20:
          return "内存使用率";
        default:
          return "未知";
      }
    },
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";
    },
    async fetchAlarms() {
      // 根据筛选条件获取告警列表
      const res = await pageAlarms({
        ...this.pagination,
        ...this.filters,
        hostId: this.hostId,
      });
      const page = res.content || {};
      this.alarms = page.items || [];
      this.alarmsTotal = page.total || 0;
    },
    onSearch() {
      const { timeRange, alarmType, minValue, maxValue } = this.searchForm;
      this.filters = {
        alarmType,
        minValue,
        maxValue,
        startDate:
          timeRange && timeRange.length === 2 && timeRange[0]
            ? dayjs(timeRange[0]).format("YYYY-MM-DD HH:mm:ss")
            : undefined,
        endDate:
          timeRange && timeRange.length === 2 && timeRange[1]
            ? dayjs(timeRange[1]).format("YYYY-MM-DD HH:mm:ss")
            : undefined,
      };
      this.pagination = { pageNo: 1, pageSize: this.pagination.pageSize };
      this.fetchAlarms();
    },
    onReset() {
      this.searchForm = {
        alarmType: "",
        timeRange: [dayjs().subtract(15, "day").toDate(), new Date()],
        minValue: undefined,
        maxValue: undefined,
      };
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.fetchAlarms();
    },
    handleSizeChange(pageSize) {
      this.pagination = { pageNo: 1, pageSize };
      this.fetchAlarms();
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(238, 242, 121);
}
</style>
