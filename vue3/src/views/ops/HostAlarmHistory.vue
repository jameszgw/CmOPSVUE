<template>
  <div class="page-container">
    <h2 class="page-title">告警管理</h2>
    <el-card shadow="never">
      <el-form inline :model="searchForm" @submit.prevent>
        <el-form-item label="报警类型">
          <el-select
            v-model="searchForm.alarmType"
            placeholder="请选择报警类型"
            clearable
            style="width: 160px"
          >
            <el-option :value="10" label="CPU使用率" />
            <el-option :value="20" label="内存使用率" />
          </el-select>
        </el-form-item>
        <el-form-item label="报警时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
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
            style="width: 120px; margin-left: 8px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
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
        class="pagination"
        background
        layout="total, sizes, prev, pager, next"
        :total="alarmsTotal"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRoute } from "vue-router";
import dayjs from "dayjs";
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
.title {
  background: rgb(238, 242, 121);
}

.page-title {
  margin: 0 0 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
