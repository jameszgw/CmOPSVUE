<template>
  <screen-page title="批量执行" gap="8px">
    <template #header-extra>
      <el-button size="small" icon="el-icon-refresh" @click="fetchCommandExecList">刷新</el-button>
    </template>

    <div class="exec-layout fill">
      <section-card
        dense
        scrollable
        class="exec-form-card"
        title="批量执行命令"
        icon="el-icon-cpu"
      >
        <el-form ref="form" :model="form" :rules="rules" label-position="top">
          <el-form-item label="选择主机" prop="hosts">
            <el-select
              v-model="form.hosts"
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
            <el-select
              v-model="selectedScriptId"
              placeholder="选择脚本模板"
              style="width: 100%; margin-bottom: 8px"
              clearable
              filterable
              @change="handleScriptChange"
            >
              <el-option
                v-for="script in scripts"
                :key="script.id"
                :label="script.templateName"
                :value="script.id"
              />
            </el-select>
            <el-input
              v-model="form.command"
              type="textarea"
              :rows="6"
              placeholder="请输入要执行的命令"
            />
          </el-form-item>

          <el-form-item label="备注" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="1"
              placeholder="请输入指令备注"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-video-play"
              :loading="loading"
              @click="handleExecute"
            >
              执行
            </el-button>
          </el-form-item>
        </el-form>
      </section-card>

      <section-card
        dense
        scrollable
        body-class="dense-table fill"
        class="exec-history-card fill"
        title="执行历史"
        icon="el-icon-document"
      >
        <el-table
          class="dense-table"
          height="100%"
          :data="commandExecList"
          row-key="id"
          size="small"
          v-loading="tableLoading"
        >
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="hostName" label="主机" />
          <el-table-column prop="host" label="主机IP" width="130" />
          <el-table-column prop="execType" label="脚本类型" width="90" />
          <el-table-column prop="exitCode" label="退出码" width="80" />
          <el-table-column label="命令" show-overflow-tooltip min-width="160">
            <template slot-scope="{ row }">
              {{ row.execCommand || row.command }}
            </template>
          </el-table-column>
          <el-table-column label="执行状态" width="100">
            <template slot-scope="{ row }">
              <el-tag :type="statusInfo(row.execStatus).type" size="small">
                {{ statusInfo(row.execStatus).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" width="160">
            <template slot-scope="{ row }">
              {{ formatTime(row.startDate || row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column label="开始至今" width="110">
            <template slot-scope="{ row }">
              {{ row.startDateAgo || row.startTimeAgo }}
            </template>
          </el-table-column>
          <el-table-column prop="used" label="耗时(ms)" width="90" />
          <el-table-column prop="keepTime" label="使用时间" width="100" />
          <el-table-column label="结束时间" width="160">
            <template slot-scope="{ row }">
              {{ formatTime(row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column label="结束至今" width="110">
            <template slot-scope="{ row }">
              {{ row.endDateAgo || row.endTimeAgo }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="small" @click="handleViewDetail(row)">查看</el-button>
              <el-button
                v-if="row.execStatus === 20"
                type="text"
                size="small"
                class="danger-text"
                @click="handleTerminate(row.id)"
              >
                停止
              </el-button>
              <el-button
                type="text"
                size="small"
                class="danger-text"
                @click="handleDelete(row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </section-card>
    </div>

    <el-pagination
      class="pagination"
      layout="total, prev, pager, next, sizes"
      :total="total"
      :current-page="commandPagination.pageNo"
      :page-size="commandPagination.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <el-dialog title="执行详情" :visible.sync="detailVisible" width="640px">
      <el-descriptions v-if="execDetail" :column="1" border>
        <el-descriptions-item label="ID">{{ execDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="主机">
          {{ execDetail.hostName }} ({{ execDetail.host }})
        </el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="statusInfo(execDetail.execStatus).type" size="small">
            {{ statusInfo(execDetail.execStatus).text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="退出码">{{ execDetail.exitCode }}</el-descriptions-item>
        <el-descriptions-item label="命令">
          <pre class="command-pre">{{ execDetail.execCommand || execDetail.command }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ execDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ formatTime(execDetail.startDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ formatTime(execDetail.endDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ execDetail.keepTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </screen-page>
</template>

<script>
import dayjs from "dayjs";
import {
  fetchCommandExec,
  createCommandExec,
  terminal,
  listStatus,
  detail,
  batchDelete,
} from "@/api/batch-exec";
import { fetchHosts } from "@/api/host";
import { fetchScripts } from "@/api/script-template";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";

const STATUS_MAP = {
  10: { type: "info", text: "未开始" },
  20: { type: "", text: "执行中" },
  30: { type: "success", text: "执行完成" },
  40: { type: "danger", text: "执行异常" },
  50: { type: "warning", text: "执行终止" },
};

export default {
  name: "BatchExec",
  components: { ScreenPage, SectionCard },
  data() {
    return {
      loading: false,
      tableLoading: false,
      hostList: [],
      scripts: [],
      selectedScriptId: null,
      form: {
        hosts: [],
        command: "",
        description: "暂无",
      },
      rules: {
        hosts: [{ required: true, message: "请选择执行主机", trigger: "change" }],
        command: [{ required: true, message: "请输入要执行的命令", trigger: "blur" }],
      },
      filters: { name: "" },
      commandPagination: { pageNo: 1, pageSize: 10 },
      commandExecList: [],
      total: 0,
      detailVisible: false,
      execDetail: null,
    };
  },
  created() {
    this.fetchHostList();
    this.queryScripts();
    this.fetchCommandExecList();
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-";
    },
    statusInfo(status) {
      if (status === undefined || status === null) {
        return { type: "info", text: "未知" };
      }
      return STATUS_MAP[status] || { type: "info", text: `状态${status}` };
    },
    async fetchHostList() {
      const res = await fetchHosts({
        pageNo: 1,
        pageSize: 1000,
        ...this.filters,
      });
      this.hostList = (res.content && res.content.items) || [];
    },
    async queryScripts() {
      const res = await fetchScripts({
        pageNo: 1,
        pageSize: 10,
        ...this.filters,
      });
      this.scripts = (res.content && res.content.items) || [];
    },
    async fetchCommandExecList() {
      this.tableLoading = true;
      try {
        const res = await fetchCommandExec({
          ...this.filters,
          ...this.commandPagination,
        });
        const page = res.content || {};
        this.commandExecList = page.items || [];
        this.total = page.total || 0;
        if (this.commandExecList.length > 0) {
          this.fetchExecStatus(this.commandExecList.map((item) => item.id));
        }
      } finally {
        this.tableLoading = false;
      }
    },
    async fetchExecStatus(idList) {
      const res = await listStatus({ idList });
      const statusList = res.content || [];
      const statusMap = {};
      statusList.forEach((status) => {
        statusMap[status.id] = status;
      });
      // 将最新状态合并到表格行
      this.commandExecList = this.commandExecList.map((item) => {
        const status = statusMap[item.id];
        if (!status) return item;
        return {
          ...item,
          execStatus: status.status !== undefined ? status.status : item.execStatus,
          exitCode: status.exitCode !== undefined ? status.exitCode : item.exitCode,
          used: status.used !== undefined ? status.used : item.used,
          keepTime: status.keepTime || item.keepTime,
        };
      });
    },
    handleScriptChange(scriptId) {
      if (!scriptId) return;
      const script = this.scripts.find((item) => item.id === scriptId);
      if (script) {
        this.form.command = script.templateValue;
      }
    },
    handleExecute() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        this.loading = true;
        try {
          const res = await createCommandExec({
            hostIds: this.form.hosts,
            command: this.form.command,
            description: this.form.description,
          });
          if (res.content) {
            this.$message.success("命令已提交执行");
            this.form = { hosts: [], command: "", description: "暂无" };
            this.selectedScriptId = null;
            this.$refs.form.resetFields();
            this.fetchCommandExecList();
          }
        } catch (error) {
          this.$message.error("执行失败");
        } finally {
          this.loading = false;
        }
      });
    },
    handleTerminate(id) {
      this.$confirm("确定要停止该执行任务吗？", "确认停止执行", {
        type: "warning",
      })
        .then(async () => {
          await terminal({ id });
          this.$message.success("已停止执行");
          this.fetchCommandExecList();
        })
        .catch(() => {});
    },
    handleDelete(id) {
      this.$confirm("确定要删除该执行任务吗？", "确认删除", {
        type: "warning",
      })
        .then(async () => {
          const res = await batchDelete({ idList: [id] });
          this.$message.success(`成功删除${res.content}条记录`);
          this.fetchCommandExecList();
        })
        .catch(() => {});
    },
    async handleViewDetail(record) {
      const res = await detail({ id: record.id });
      this.execDetail = res.content || record;
      this.detailVisible = true;
    },
    handlePageChange(page) {
      this.commandPagination.pageNo = page;
      this.fetchCommandExecList();
    },
    handleSizeChange(size) {
      this.commandPagination = { pageNo: 1, pageSize: size };
      this.fetchCommandExecList();
    },
  },
};
</script>

<style lang="less" scoped>
.exec-layout {
  display: flex;
  gap: 8px;
  min-height: 0;
}
.exec-form-card {
  width: 340px;
  flex-shrink: 0;
}
.exec-history-card {
  flex: 1;
  min-width: 0;
}
.pagination {
  flex-shrink: 0;
  text-align: right;
}
.danger-text {
  color: #f56c6c;
}
.command-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: inherit;
}
</style>
