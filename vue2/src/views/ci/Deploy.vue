<template>
  <div v-loading="loading" class="page-container">
    <div class="page-header">
      <h2 class="page-title">应用中心</h2>
      <el-select
        v-model="selectedEnvironment"
        style="width: 160px"
        placeholder="选择环境"
      >
        <el-option
          v-for="env in (appDetail && appDetail.appEnvList) || []"
          :key="env.envId"
          :label="env.envName"
          :value="env.envId"
        />
      </el-select>
    </div>

    <!-- 未找到应用 -->
    <el-result
      v-if="!loading && !appDetail"
      icon="error"
      title="警告"
      sub-title="未找到应用"
    >
      <template slot="extra">
        <el-button type="primary" @click="$router.push('/')">创建应用</el-button>
      </template>
    </el-result>

    <!-- 应用没有环境 -->
    <el-result
      v-if="appDetail && (!appDetail.appEnvList || appDetail.appEnvList.length === 0)"
      icon="warning"
      title="警告"
      sub-title="当前应用没有环境，请创建环境。"
    >
      <template slot="extra">
        <el-button type="primary" @click="$router.push(`/devops/ci/app/info/${id}`)">
          创建环境
        </el-button>
      </template>
    </el-result>

    <template v-if="appDetail && appDetail.appEnvList && appDetail.appEnvList.length > 0">
      <!-- 发布进度 -->
      <el-card class="block-card">
        <div slot="header" class="card-header">
          <span>
            {{ appDetail.appName }}:[{{ appEnv && appEnv.envName }}({{ appEnv && appEnv.env }})]
          </span>
          <el-button
            v-if="parsedProgress && parsedProgress.pipeKey"
            @click="handleViewLogs(parsedProgress.pipeKey)"
          >
            查看日志
          </el-button>
        </div>
        <el-steps
          v-if="parsedProgress"
          :active="parsedProgress.current"
          :process-status="stepsStatus"
          size="small"
        >
          <el-step
            v-for="(step, index) in parsedProgress.steps"
            :key="index"
            :title="step.title"
            :description="stepDescription(step)"
          />
        </el-steps>
      </el-card>

      <!-- Pod 节点 -->
      <el-card class="block-card">
        <div slot="header">Pod节点</div>
        <el-table :data="pods" row-key="name" border>
          <el-table-column label="POD名称" min-width="220">
            <template slot-scope="{ row }">
              {{ row.name }}
              <i class="el-icon-document-copy copy-icon" @click="copyText(row.name)" />
            </template>
          </el-table-column>
          <el-table-column label="命名空间" prop="namespace" min-width="100" />
          <el-table-column label="POD IP" prop="podIp" min-width="120" />
          <el-table-column label="阶段" prop="phase" width="90" />
          <el-table-column label="节点名称" prop="nodeName" min-width="120" />
          <el-table-column label="开始时间" min-width="150">
            <template slot-scope="{ row }">{{ formatTime(row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="是否就绪" width="90">
            <template slot-scope="{ row }">{{ row.ready ? "是" : "否" }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 环境配置折叠面板 -->
      <el-collapse class="block-card">
        <el-collapse-item title="资源配置" name="0">
          <EnvResourcePanel
            :resource-strategy="resourceStrategy"
            :selected-environment="selectedEnvironment"
            @updated="getCurrentAppEnv"
          />
        </el-collapse-item>
        <el-collapse-item title="环境变量" name="1">
          <EnvVarsPanel
            :initial-env-vars="envVarsData"
            :selected-environment="selectedEnvironment"
            @updated="getCurrentAppEnv"
          />
        </el-collapse-item>
        <el-collapse-item title="ConfigMap" name="2">
          <ConfigMapPanel
            :initial-config-map="configMapData"
            :selected-environment="selectedEnvironment"
            @updated="getCurrentAppEnv"
          />
        </el-collapse-item>
        <el-collapse-item title="服务域名配置" name="3">
          <DomainHostConfigPanel
            :app-env="appEnv"
            :app-name="appDetail.appName"
            @updated="getCurrentAppEnv"
          />
        </el-collapse-item>
      </el-collapse>

      <!-- 发布单 -->
      <el-card class="block-card">
        <div slot="header" class="card-header">
          <span>发布单</span>
          <div>
            <el-button :disabled="deployDisabled || !selectedRow" @click="handleRelease">
              立即发布
            </el-button>
            <el-button @click="handleCreateReleaseDrawer">添加发布单</el-button>
          </div>
        </div>
        <el-table
          ref="releaseTable"
          :data="releaseRecordPage.items"
          row-key="releaseId"
          border
          highlight-current-row
          @current-change="handleReleaseRowChange"
        >
          <el-table-column width="44">
            <template slot-scope="{ row }">
              <el-radio
                class="row-radio"
                :value="selectedRow ? selectedRow.releaseId : null"
                :label="row.releaseId"
                @change.native.stop
              >
                <span />
              </el-radio>
            </template>
          </el-table-column>
          <el-table-column label="发布单号" min-width="170">
            <template slot-scope="{ row }">
              {{ row.releaseNo }}
              <i class="el-icon-document-copy copy-icon" @click.stop="copyText(row.releaseNo)" />
            </template>
          </el-table-column>
          <el-table-column label="预计发布时间" min-width="150">
            <template slot-scope="{ row }">{{ formatTime(row.releaseDate) }}</template>
          </el-table-column>
          <el-table-column label="发布分支" prop="releaseBranch" min-width="120" />
          <el-table-column label="发布版本" prop="releaseVersion" min-width="100" />
          <el-table-column label="创建时间" min-width="150">
            <template slot-scope="{ row }">{{ formatTime(row.gmtCreate) }}</template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="150">
            <template slot-scope="{ row }">{{ formatTime(row.gmtModified) }}</template>
          </el-table-column>
          <el-table-column label="发布状态" width="100">
            <template slot-scope="{ row }">
              {{ getReleaseStatusText(row.releaseStatus) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template slot-scope="{ row }">
              <el-button type="text" @click.stop="handleViewDetails(row)">查看</el-button>
              <el-button
                v-if="row.releaseStatus !== 'PENDING' && row.releaseStatus !== 'FINISHED'"
                type="text"
                @click.stop="handleConfirmClose(row)"
              >
                关闭
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          layout="total, prev, pager, next"
          :total="releaseRecordPage.total"
          :current-page="pagination.pageNo"
          :page-size="pagination.pageSize"
          @current-change="handleReleasePageChange"
        />
      </el-card>

      <!-- 发布历史 -->
      <el-card class="block-card">
        <div slot="header">发布历史</div>
        <el-table :data="deployHistoryPage.items" row-key="pipeKey" border>
          <el-table-column label="pipeKey" min-width="200">
            <template slot-scope="{ row }">
              {{ row.pipeKey }}
              <i class="el-icon-document-copy copy-icon" @click="copyText(row.pipeKey)" />
            </template>
          </el-table-column>
          <el-table-column label="开始时间" min-width="150">
            <template slot-scope="{ row }">{{ formatTime(row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="结束时间" min-width="150">
            <template slot-scope="{ row }">
              {{ row.endTime ? formatTime(row.endTime) : "" }}
            </template>
          </el-table-column>
          <el-table-column label="发布内容" prop="content" min-width="150" show-overflow-tooltip />
          <el-table-column label="发布人" prop="creatorName" min-width="100" />
          <el-table-column label="发布状态" width="100">
            <template slot-scope="{ row }">
              {{ getDeployStatusText(row.deployStatus) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template slot-scope="{ row }">
              <el-button type="text" @click="handleViewHistoryLog(row.pipeKey)">查看日志</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          layout="total, prev, pager, next"
          :total="deployHistoryPage.total"
          :current-page="historyPagination.pageNo"
          :page-size="historyPagination.pageSize"
          @current-change="handleHistoryPageChange"
        />
      </el-card>

      <CreateReleaseDrawer
        :visible="drawerVisible"
        :branches="branches"
        @close="drawerVisible = false"
        @search="listAppBranch"
        @submit="handleAddRelease"
      />

      <ReleaseDetailDrawer
        :visible="viewDrawerVisible"
        :release="currentViewRelease"
        @close="viewDrawerVisible = false"
      />

      <DeployHistoryLogsDrawer
        :visible="historyLogDrawerVisible"
        :deploy-history-logs="deployHistoryLogs"
        @close="historyLogDrawerVisible = false"
      />

      <DeployLogDrawer
        :visible="logDrawerVisible"
        :pipe-key="pipeKey"
        @close="logDrawerVisible = false"
      />
    </template>
  </div>
</template>

<script>
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import {
  getAppDetail,
  getAppEnv,
  listAppPods,
  listAppBranch,
} from "@/api/app";
import {
  page as pageRelease,
  pageDeployHistory,
  queryPipeLog,
  create as createRelease,
  deploy,
  close as closeRelease,
} from "@/api/release";
import {
  getReleaseStatusText,
  getDeployStatusText,
  copyToClipboard,
} from "@/utils/release-utils";
import DeployLogDrawer from "./components/DeployLogDrawer.vue";
import EnvVarsPanel from "./components/EnvVarsPanel.vue";
import ConfigMapPanel from "./components/ConfigMapPanel.vue";
import EnvResourcePanel from "./components/EnvResourcePanel.vue";
import DomainHostConfigPanel from "./components/DomainHostConfigPanel.vue";
import ReleaseDetailDrawer from "./components/ReleaseDetailDrawer.vue";
import DeployHistoryLogsDrawer from "./components/DeployHistoryLogsDrawer.vue";
import CreateReleaseDrawer from "./components/CreateReleaseDrawer.vue";

export default {
  name: "DeployPage",
  components: {
    DeployLogDrawer,
    EnvVarsPanel,
    ConfigMapPanel,
    EnvResourcePanel,
    DomainHostConfigPanel,
    ReleaseDetailDrawer,
    DeployHistoryLogsDrawer,
    CreateReleaseDrawer,
  },
  data() {
    return {
      loading: true,
      appDetail: null,
      appEnv: null,
      selectedEnvironment: null,
      deployDisabled: false,
      timer: null,
      pods: [],
      branches: [],
      releaseRecordPage: { items: [], total: 0 },
      deployHistoryPage: { items: [], total: 0 },
      pagination: { pageNo: 1, pageSize: 10 },
      historyPagination: { pageNo: 1, pageSize: 10 },
      selectedRow: null,
      drawerVisible: false,
      viewDrawerVisible: false,
      currentViewRelease: null,
      logDrawerVisible: false,
      pipeKey: "",
      historyLogDrawerVisible: false,
      deployHistoryLogs: [],
      resourceStrategy: null,
      configMapData: [],
      envVarsData: [],
    };
  },
  computed: {
    id() {
      return this.$route.params.id;
    },
    parsedProgress() {
      if (this.appEnv && this.appEnv.progress) {
        try {
          return JSON.parse(this.appEnv.progress);
        } catch (e) {
          return null;
        }
      }
      return null;
    },
    stepsStatus() {
      // antd Steps status → el-steps process-status
      const status = this.parsedProgress && this.parsedProgress.status;
      if (status === "error") return "error";
      if (status === "finish") return "finish";
      return "process";
    },
  },
  watch: {
    selectedEnvironment(val) {
      if (val) {
        this.pagination.pageNo = 1;
        this.historyPagination.pageNo = 1;
        this.loadEnvData();
      }
    },
  },
  async created() {
    await this.getAppDetail();
    this.loading = false;
  },
  beforeDestroy() {
    this.clearTimer();
  },
  methods: {
    getReleaseStatusText,
    getDeployStatusText,
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "--";
    },
    copyText(text) {
      copyToClipboard(text).then(() => this.$message.success("复制成功"));
    },
    stepDescription(step) {
      if (step.description === "AWAIT_EXECUTE") return "待执行";
      if (step.description === "EXECUTING") return "执行中";
      if (step.description === "EXECUTED") return `已执行 耗时:${step.cost}秒`;
      return step.description;
    },
    clearTimer() {
      if (this.timer !== null) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    async getAppDetail() {
      if (!this.id) return;
      const res = await getAppDetail(this.id);
      this.appDetail = res.content;
      if (
        this.appDetail &&
        this.appDetail.appEnvList &&
        this.appDetail.appEnvList.length > 0
      ) {
        this.selectedEnvironment = this.appDetail.appEnvList[0].envId;
      }
    },
    loadEnvData() {
      this.getCurrentAppEnv();
      this.listAppPods();
      this.pageReleaseRecord();
      this.pageDeployHistoryRecord();
    },
    async getCurrentAppEnv() {
      if (!this.selectedEnvironment) return;
      const res = await getAppEnv({ envId: this.selectedEnvironment });
      this.appEnv = res.content;
      this.syncEnvConfig();
      this.checkDeployStatus();
    },
    syncEnvConfig() {
      const configMap = (this.appEnv && this.appEnv.configMap) || {};
      const envVars = (this.appEnv && this.appEnv.envVars) || {};
      this.configMapData = Object.entries(configMap).map(([label, value]) => ({
        id: nanoid(),
        label,
        value,
        editable: false,
      }));
      this.envVarsData = Object.entries(envVars).map(([label, value]) => ({
        id: nanoid(),
        label,
        value,
        editable: false,
      }));
      this.resourceStrategy = this.appEnv ? this.appEnv.resourceStrategy : null;
    },
    checkDeployStatus() {
      const deployStatus = this.appEnv && this.appEnv.deployStatus;
      if (String(deployStatus) === "1") {
        this.deployDisabled = true;
        // 发布中：每 3 秒轮询一次环境详情
        if (this.timer === null) {
          this.timer = setInterval(() => {
            this.getCurrentAppEnv();
            this.listAppPods();
          }, 3000);
        }
      } else {
        this.deployDisabled = false;
        this.clearTimer();
      }
    },
    async listAppPods() {
      if (!this.selectedEnvironment) return;
      const res = await listAppPods({ envId: this.selectedEnvironment });
      this.pods = res.content || [];
    },
    async listAppBranch(search) {
      if (!this.appDetail) return;
      const res = await listAppBranch({
        appId: this.appDetail.appId,
        search: search || "",
      });
      this.branches = res.content || [];
    },
    async pageReleaseRecord() {
      if (!this.selectedEnvironment || !this.id) return;
      const res = await pageRelease({
        appId: this.id,
        pageNo: this.pagination.pageNo,
        pageSize: this.pagination.pageSize,
        envId: this.selectedEnvironment,
      });
      this.releaseRecordPage = res.content || { items: [], total: 0 };
    },
    async pageDeployHistoryRecord() {
      if (!this.selectedEnvironment || !this.id) return;
      const res = await pageDeployHistory({
        pageNo: this.historyPagination.pageNo,
        pageSize: this.historyPagination.pageSize,
        appId: this.id,
        envId: this.selectedEnvironment,
      });
      this.deployHistoryPage = res.content || { items: [], total: 0 };
    },
    handleReleasePageChange(page) {
      this.pagination.pageNo = page;
      this.pageReleaseRecord();
    },
    handleHistoryPageChange(page) {
      this.historyPagination.pageNo = page;
      this.pageDeployHistoryRecord();
    },
    handleReleaseRowChange(row) {
      this.selectedRow = row;
    },
    handleConfirmClose(record) {
      this.$confirm("确定要关闭审批单吗？", "确认关闭", { type: "warning" })
        .then(async () => {
          await closeRelease({ releaseId: record.releaseId });
          this.pageReleaseRecord();
        })
        .catch(() => {});
    },
    handleViewDetails(record) {
      this.currentViewRelease = record;
      this.viewDrawerVisible = true;
    },
    async handleViewHistoryLog(pipeKey) {
      const res = await queryPipeLog({ pipeKey });
      this.deployHistoryLogs = res.content || [];
      this.historyLogDrawerVisible = true;
    },
    async handleRelease() {
      if (!this.selectedRow) {
        this.$message.warning("请选择符合条件的变更单");
        return;
      }
      if (this.selectedRow.releaseStatus === "CLOSED") {
        this.$message.warning("已关闭的变更单不允许发布");
        return;
      }
      await deploy({ releaseId: this.selectedRow.releaseId });
      this.$message.success("开始发布");
      // 清空选择并刷新
      this.selectedRow = null;
      if (this.$refs.releaseTable) {
        this.$refs.releaseTable.setCurrentRow(null);
      }
      this.loadEnvData();
    },
    handleCreateReleaseDrawer() {
      if (!this.drawerVisible) {
        this.listAppBranch("");
      }
      this.drawerVisible = !this.drawerVisible;
    },
    async handleAddRelease(values) {
      await createRelease({
        ...values,
        appId: this.id,
        envId: this.selectedEnvironment,
      });
      this.$message.success("添加成功");
      this.drawerVisible = false;
      this.pageReleaseRecord();
    },
    handleViewLogs(pipeKey) {
      this.pipeKey = pipeKey;
      this.logDrawerVisible = true;
    },
  },
};
</script>

<style lang="less" scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
}
.block-card {
  margin-bottom: 12px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.copy-icon {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
}
.pagination {
  margin-top: 16px;
  text-align: right;
}
.row-radio {
  margin-right: 0;
  :deep(.el-radio__label) {
    display: none;
  }
}
</style>
