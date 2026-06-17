<template>
  <screen-page title="告警管理" gap="8px">
    <template #header-extra>
      <!-- 筛选组件 -->
      <el-form inline size="mini" :model="searchForm" class="filter-form" @submit.native.prevent>
        <el-form-item label="报警类型">
          <el-select v-model="searchForm.alarmType" placeholder="报警类型" clearable style="width: 130px">
            <el-option label="CPU使用率" :value="10" />
            <el-option label="内存使用率" :value="20" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item label="报警值">
          <el-input-number
            v-model="searchForm.minValue"
            placeholder="最小"
            :controls="false"
            style="width: 90px"
          />
          <el-input-number
            v-model="searchForm.maxValue"
            placeholder="最大"
            :controls="false"
            style="width: 90px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <section-card dense scrollable body-class="dense-table fill" class="fill" title="告警历史" icon="el-icon-warning-outline">
      <el-table class="dense-table" height="100%" :data="alarms" row-key="id" size="small" stripe style="width: 100%">
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
    </section-card>

    <el-pagination
      class="page-pagination"
      layout="total, prev, pager, next, sizes"
      :total="alarmsTotal"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </screen-page>
</template>

<script>
import dayjs from "dayjs";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { pageAlarms } from "@/api/host-alarm-config";

export default {
  name: "HostAlarmHistory",
  components: {
    ScreenPage,
    SectionCard,
  },
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
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.filter-form /deep/ .el-form-item {
  margin-bottom: 0;
}
.page-pagination {
  flex-shrink: 0;
  text-align: right;
}
</style>
