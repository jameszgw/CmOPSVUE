<template>
  <div class="page-container">
    <el-card>
      <div class="page-title">系统日志</div>
      <el-form inline @submit.prevent="handleSearch">
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.userName"
            placeholder="请输入用户名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="事件分类">
          <el-select
            v-model="searchForm.eventClassify"
            placeholder="请选择事件分类"
            clearable
            style="width: 150px"
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
            clearable
            style="width: 150px"
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
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="logPage.items" row-key="id">
        <el-table-column prop="userName" label="用户名" />
        <el-table-column prop="eventClassifyName" label="事件分类" />
        <el-table-column prop="eventTypeName" label="事件类型" />
        <el-table-column label="日志时间">
          <template #default="{ row }">
            {{ formatTime(row.gmtCreate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.execResult === 1 ? 'success' : 'danger'">
              {{ row.execResult === 1 ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-popover
              placement="left"
              :width="400"
              trigger="hover"
              title="详细操作内容"
            >
              <div v-html="row.logInfo"></div>
              <template #reference>
                <el-button type="primary" link>查看</el-button>
              </template>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, prev, pager, next"
        :total="logPage.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { queryLogs, getEventClassify, getEventType } from "@/api/logs";

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
.page-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
