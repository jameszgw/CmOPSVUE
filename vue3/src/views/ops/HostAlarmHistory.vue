<template>
  <ScreenPage title="告警管理" gap="8px">
    <template #header-extra>
      <el-form inline :model="searchForm" class="toolbar-form" @submit.prevent>
        <el-form-item label="报警类型">
          <el-select
            v-model="searchForm.alarmType"
            placeholder="报警类型"
            clearable
            size="small"
            style="width: 140px"
          >
            <el-option :value="10" label="CPU使用率" />
            <el-option :value="20" label="内存使用率" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            size="small"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="报警值">
          <el-input-number
            v-model="searchForm.minValue"
            placeholder="最小值"
            :controls="false"
            size="small"
            style="width: 100px"
          />
          <el-input-number
            v-model="searchForm.maxValue"
            placeholder="最大值"
            :controls="false"
            size="small"
            style="width: 100px; margin-left: 8px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="onSearch">查询</el-button>
          <el-button size="small" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <SectionCard
      dense
      bodyClass="dense-table fill table-pane"
      class="fill"
      title="告警历史"
      icon="Bell"
    >
      <el-table class="dense-table fill" height="100%" :data="alarms" row-key="id" size="small" stripe>
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
        class="pagination"
        background
        small
        layout="total, sizes, prev, pager, next"
        :total="alarmsTotal"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </SectionCard>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { pageAlarms } from "@/api/host-alarm-config";

const route = useRoute();
const hostId = route.params.hostId;

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({
  alarmType: undefined,
  timeRange: [
    dayjs().subtract(15, "day").format("YYYY-MM-DD HH:mm:ss"),
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
  ],
  minValue: undefined,
  maxValue: undefined,
});
const filters = reactive({
  alarmType: undefined,
  startDate: undefined,
  endDate: undefined,
  minValue: undefined,
  maxValue: undefined,
});

const alarms = ref([]);
const alarmsTotal = ref(0);

const alarmTypeText = (type) => {
  switch (type) {
    case 10:
      return "CPU使用率";
    case 20:
      return "内存使用率";
    default:
      return "未知";
  }
};

const formatTime = (time) => (time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "");

const fetchAlarms = async () => {
  const res = await pageAlarms({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    hostId,
    ...filters,
  });
  alarms.value = res.content?.items || [];
  alarmsTotal.value = res.content?.total || 0;
};

const onSearch = () => {
  filters.alarmType = searchForm.alarmType;
  filters.minValue = searchForm.minValue;
  filters.maxValue = searchForm.maxValue;
  if (searchForm.timeRange && searchForm.timeRange.length === 2) {
    filters.startDate = searchForm.timeRange[0];
    filters.endDate = searchForm.timeRange[1];
  } else {
    filters.startDate = undefined;
    filters.endDate = undefined;
  }
  pagination.pageNo = 1;
  fetchAlarms();
};

const onReset = () => {
  searchForm.alarmType = undefined;
  searchForm.timeRange = [];
  searchForm.minValue = undefined;
  searchForm.maxValue = undefined;
  onSearch();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  fetchAlarms();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  fetchAlarms();
};

onMounted(() => {
  fetchAlarms();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.toolbar-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: @space-md;
  }
}

:deep(.table-pane) {
  display: flex;
  flex-direction: column;
}

.pagination {
  margin-top: @space-sm;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
