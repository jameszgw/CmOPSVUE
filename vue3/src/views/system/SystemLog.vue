<template>
  <ScreenPage title="系统日志" gap="8px">
    <template #header-extra>
      <div class="head-tools">
        <el-input
          v-model="searchForm.userName"
          size="small"
          placeholder="用户名"
          clearable
          class="head-tools__sm"
        />
        <el-select
          v-model="searchForm.eventClassify"
          size="small"
          placeholder="事件分类"
          clearable
          class="head-tools__sm"
          @change="handleClassifyChange"
        >
          <el-option
            v-for="(label, key) in eventClassifyList"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-select
          v-model="searchForm.eventType"
          size="small"
          placeholder="操作内容"
          clearable
          class="head-tools__sm"
        >
          <el-option
            v-for="(label, key) in eventTypeList"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
        <el-date-picker
          v-model="searchForm.timeRange"
          size="small"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="head-tools__range"
        />
        <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="handleReset">重置</el-button>
      </div>
    </template>

    <SectionCard
      dense
      scrollable
      bodyClass="dense-table fill"
      class="fill"
      title="日志"
      icon="Document"
    >
      <el-table class="dense-table" height="100%" :data="logPage.items" row-key="id" size="small" stripe>
        <el-table-column prop="userName" label="用户名" min-width="120" />
        <el-table-column prop="eventClassifyName" label="事件分类" min-width="120" />
        <el-table-column prop="eventTypeName" label="事件类型" min-width="120" />
        <el-table-column label="日志时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.execResult === 1 ? 'success' : 'danger'" size="small">
              {{ row.execResult === 1 ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-popover
              placement="left"
              :width="400"
              trigger="hover"
              title="详细操作内容"
            >
              <div v-html="row.logInfo"></div>
              <template #reference>
                <el-button type="primary" link size="small">查看</el-button>
              </template>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <div class="pager">
      <el-pagination
        background
        small
        layout="total, prev, pager, next"
        :total="logPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </div>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { queryLogs, getEventClassify, getEventType } from "@/api/logs";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";

const pagination = reactive({ pageNo: 1, pageSize: 10 });

const searchForm = reactive({
  userName: "",
  eventClassify: null,
  eventType: null,
  timeRange: [
    dayjs().subtract(7, "day").format("YYYY-MM-DD HH:mm:ss"),
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
  ],
});

const filters = reactive({
  userName: "",
  eventClassify: null,
  eventType: null,
  startDate: null,
  endDate: null,
});

const logPage = reactive({ items: [], total: 0 });
const eventClassifyList = ref({});
const eventTypeList = ref({});

const formatTime = (time) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";

const fetchLogs = async () => {
  const res = await queryLogs({ ...filters, ...pagination });
  logPage.items = res.content?.items || [];
  logPage.total = res.content?.total || 0;
};

const fetchEventClassify = async () => {
  const res = await getEventClassify();
  eventClassifyList.value = res.content || {};
};

const handleClassifyChange = async (value) => {
  searchForm.eventType = null;
  eventTypeList.value = {};
  if (value) {
    const res = await getEventType({ classify: value });
    eventTypeList.value = res.content || {};
  }
};

const handleSearch = () => {
  filters.userName = searchForm.userName;
  filters.eventClassify = searchForm.eventClassify || null;
  filters.eventType = searchForm.eventType || null;
  if (searchForm.timeRange && searchForm.timeRange.length === 2) {
    filters.startDate = searchForm.timeRange[0];
    filters.endDate = searchForm.timeRange[1];
  } else {
    filters.startDate = null;
    filters.endDate = null;
  }
  pagination.pageNo = 1;
  fetchLogs();
};

const handleReset = () => {
  searchForm.userName = "";
  searchForm.eventClassify = null;
  searchForm.eventType = null;
  searchForm.timeRange = null;
  eventTypeList.value = {};
  filters.userName = "";
  filters.eventClassify = null;
  filters.eventType = null;
  filters.startDate = null;
  filters.endDate = null;
  pagination.pageNo = 1;
  fetchLogs();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  fetchLogs();
};

onMounted(() => {
  fetchEventClassify();
  fetchLogs();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.head-tools {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;

  &__sm {
    width: 130px;
  }

  &__range {
    width: 340px;
  }
}

.pager {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}
</style>
