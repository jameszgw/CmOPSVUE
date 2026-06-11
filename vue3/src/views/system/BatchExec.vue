<template>
  <div class="page-container">
    <div class="toolbar">
      <el-button @click="fetchCommandExecPage">
        <el-icon style="margin-right: 4px"><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-card class="exec-card">
      <template #header>批量执行命令</template>
      <el-form
        ref="formRef"
        :model="execForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="选择主机" prop="hosts">
          <el-select
            v-model="execForm.hosts"
            multiple
            filterable
            placeholder="请选择要执行的主机"
            style="width: 100%"
          >
            <el-option
              v-for="host in hostList"
              :key="host.hostId"
              :label="`${host.name} (${host.hostName})`"
              :value="host.hostId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="执行命令" prop="command">
          <div style="width: 100%">
            <div style="margin-bottom: 8px">
              <el-select
                v-model="selectedScriptId"
                placeholder="选择脚本模板"
                clearable
                filterable
                style="width: 100%"
                @change="handleScriptChange"
              >
                <el-option
                  v-for="script in scriptList"
                  :key="script.id"
                  :label="script.templateName"
                  :value="script.id"
                />
              </el-select>
            </div>
            <el-input
              v-model="execForm.command"
              type="textarea"
              :rows="4"
              placeholder="请输入要执行的命令"
            />
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="execForm.description"
            type="textarea"
            :rows="1"
            placeholder="请输入指令备注"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleExecute">
            <el-icon style="margin-right: 4px"><VideoPlay /></el-icon>
            执行
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>执行历史</template>
      <el-table :data="commandExecPage.items" row-key="id">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="hostName" label="主机" />
        <el-table-column prop="host" label="主机IP" />
        <el-table-column prop="execType" label="脚本类型" width="90" />
        <el-table-column label="退出码" width="80">
          <template #default="{ row }">
            {{ statusOf(row, "exitCode") }}
          </template>
        </el-table-column>
        <el-table-column label="命令" show-overflow-tooltip min-width="160">
          <template #default="{ row }">
            {{ row.command || row.execCommand }}
          </template>
        </el-table-column>
        <el-table-column label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag :type="renderStatus(execStatusOf(row)).type">
              {{ renderStatus(execStatusOf(row)).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.startTime || row.startDate) }}
          </template>
        </el-table-column>
        <el-table-column label="开始至今">
          <template #default="{ row }">
            {{ row.startTimeAgo || row.startDateAgo }}
          </template>
        </el-table-column>
        <el-table-column label="耗时(ms)" width="90">
          <template #default="{ row }">
            {{ statusOf(row, "used") }}
          </template>
        </el-table-column>
        <el-table-column label="使用时间">
          <template #default="{ row }">
            {{ statusOf(row, "keepTime") }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.endDate) }}
          </template>
        </el-table-column>
        <el-table-column label="结束至今">
          <template #default="{ row }">
            {{ row.endTimeAgo || row.endDateAgo }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">
              查看
            </el-button>
            <el-button
              v-if="execStatusOf(row) === 20"
              type="danger"
              link
              @click="handleTerminate(row.id)"
            >
              停止
            </el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        layout="total, sizes, prev, pager, next"
        :total="commandExecPage.total"
        :current-page="commandPagination.pageNo"
        :page-size="commandPagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 执行详情 -->
    <el-dialog v-model="detailVisible" title="执行详情" width="640px">
      <el-descriptions v-if="execDetail" :column="1" border>
        <el-descriptions-item label="ID">
          {{ execDetail.id }}
        </el-descriptions-item>
        <el-descriptions-item label="主机">
          {{ execDetail.hostName }} ({{ execDetail.host }})
        </el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="renderStatus(execDetail.execStatus).type">
            {{ renderStatus(execDetail.execStatus).text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="退出码">
          {{ execDetail.exitCode }}
        </el-descriptions-item>
        <el-descriptions-item label="命令">
          <pre class="command-pre">{{
            execDetail.command || execDetail.execCommand
          }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ execDetail.description }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  fetchCommandExec,
  createCommandExec,
  listStatus,
  terminal,
  batchDelete,
  detail,
} from "@/api/batch-exec";
import { fetchHosts } from "@/api/host";
import { fetchScripts } from "@/api/script-template";

const formRef = ref(null);
const loading = ref(false);
const hostList = ref([]);
const scriptList = ref([]);
const selectedScriptId = ref(null);

const commandPagination = reactive({ pageNo: 1, pageSize: 10 });
const commandExecPage = reactive({ items: [], total: 0 });
const execStatusMap = ref({});

const detailVisible = ref(false);
const execDetail = ref(null);

const execForm = reactive({
  hosts: [],
  command: "",
  description: "暂无",
});

const rules = {
  hosts: [{ required: true, message: "请选择执行主机", trigger: "change" }],
  command: [{ required: true, message: "请输入要执行的命令", trigger: "blur" }],
};

const formatTime = (time) =>
  time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";

// 优先取最新执行状态
const execStatusOf = (row) =>
  execStatusMap.value[row.id]?.status ?? row.execStatus;

const statusOf = (row, field) => {
  const status = execStatusMap.value[row.id];
  const value = status?.[field] ?? row[field];
  return value === undefined || value === null ? "" : value;
};

const STATUS_MAP = {
  10: { type: "info", text: "未开始" },
  20: { type: "primary", text: "执行中" },
  30: { type: "success", text: "执行完成" },
  40: { type: "danger", text: "执行异常" },
  50: { type: "warning", text: "执行终止" },
};

const renderStatus = (status) => {
  if (status === undefined || status === null) {
    return { type: "info", text: "未知" };
  }
  return STATUS_MAP[status] || { type: "info", text: `状态${status}` };
};

const fetchHostList = async () => {
  const res = await fetchHosts({ pageNo: 1, pageSize: 1000 });
  hostList.value = res.content?.items || [];
};

const queryScripts = async () => {
  const res = await fetchScripts({ pageNo: 1, pageSize: 10 });
  scriptList.value = res.content?.items || [];
};

const fetchExecStatus = async (idList) => {
  const res = await listStatus({ idList });
  const statusMap = {};
  (res.content || []).forEach((status) => {
    statusMap[status.id] = status;
  });
  execStatusMap.value = statusMap;
};

const fetchCommandExecPage = async () => {
  const res = await fetchCommandExec({ ...commandPagination });
  commandExecPage.items = res.content?.items || [];
  commandExecPage.total = res.content?.total || 0;
  if (commandExecPage.items.length > 0) {
    fetchExecStatus(commandExecPage.items.map((item) => item.id));
  }
};

const handlePageChange = (page) => {
  commandPagination.pageNo = page;
  fetchCommandExecPage();
};

const handleSizeChange = (size) => {
  commandPagination.pageSize = size;
  commandPagination.pageNo = 1;
  fetchCommandExecPage();
};

const handleScriptChange = (scriptId) => {
  if (!scriptId) {
    return;
  }
  const script = scriptList.value.find((item) => item.id === scriptId);
  if (script) {
    execForm.command = script.templateValue;
  }
};

const handleExecute = async () => {
  try {
    await formRef.value.validate();
  } catch (e) {
    return;
  }
  loading.value = true;
  try {
    const res = await createCommandExec({
      hostIds: execForm.hosts,
      command: execForm.command,
      description: execForm.description,
    });
    if (res.content) {
      ElMessage.success("命令已提交执行");
      execForm.hosts = [];
      execForm.command = "";
      execForm.description = "暂无";
      selectedScriptId.value = null;
      fetchCommandExecPage();
    }
  } catch (error) {
    console.error("执行失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleTerminate = (id) => {
  ElMessageBox.confirm("确定要停止该执行任务吗？", "确认停止执行", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await terminal({ id });
      ElMessage.success("已停止执行");
      fetchCommandExecPage();
    })
    .catch(() => {});
};

const handleDelete = (id) => {
  ElMessageBox.confirm("确定要删除该执行任务吗？", "确认删除", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      const res = await batchDelete({ idList: [id] });
      ElMessage.success(`成功删除${res.content}条记录`);
      fetchCommandExecPage();
    })
    .catch(() => {});
};

const handleViewDetail = async (record) => {
  const res = await detail({ id: record.id });
  execDetail.value = res.content || record;
  detailVisible.value = true;
};

onMounted(() => {
  fetchHostList();
  queryScripts();
  fetchCommandExecPage();
});
</script>

<style lang="less" scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.exec-card {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.command-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
}
</style>
