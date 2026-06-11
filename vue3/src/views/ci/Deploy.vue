<template>
  <div class="page-container deploy-page" v-loading="loading">
    <div class="page-header">
      <h2 class="page-title">应用中心</h2>
      <el-select
        v-model="selectedEnvironment"
        style="width: 120px"
        placeholder="选择环境"
      >
        <el-option
          v-for="env in appDetail?.appEnvList || []"
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
      <template #extra>
        <el-button type="primary" @click="router.push('/')">创建应用</el-button>
      </template>
    </el-result>

    <!-- 应用没有环境 -->
    <el-result
      v-if="!loading && appDetail && (appDetail.appEnvList || []).length === 0"
      icon="warning"
      title="警告"
      sub-title="当前应用没有环境，请创建环境。"
    >
      <template #extra>
        <el-button type="primary" @click="router.push(`/devops/ci/app/info/${id}`)">
          创建环境
        </el-button>
      </template>
    </el-result>

    <template v-if="appDetail && (appDetail.appEnvList || []).length > 0">
      <!-- 发布进度 -->
      <el-card class="block-card">
        <template #header>
          <div class="card-header">
            <span>{{ appDetail?.appName }}:[{{ appEnv?.envName }}({{ appEnv?.env }})]</span>
            <el-button v-if="parsedProgress?.pipeKey" @click="handleViewLogs(parsedProgress.pipeKey)">
              查看日志
            </el-button>
          </div>
        </template>
        <el-steps
          v-if="parsedProgress"
          :active="parsedProgress.current"
          :process-status="stepStatus"
          align-center
        >
          <el-step
            v-for="(step, index) in parsedProgress.steps"
            :key="index"
            :title="step.title"
            :description="formatStepDescription(step)"
          />
        </el-steps>
      </el-card>

      <!-- Pod 节点 -->
      <el-card class="block-card">
        <template #header>Pod节点</template>
        <el-table :data="pods" row-key="name">
          <el-table-column label="POD名称" prop="name" min-width="220">
            <template #default="{ row }">
              {{ row.name }}
              <el-icon class="copy-icon" @click="copyText(row.name)"><CopyDocument /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="命名空间" prop="namespace" />
          <el-table-column label="POD IP" prop="podIp" />
          <el-table-column label="阶段" prop="phase" />
          <el-table-column label="节点名称" prop="nodeName" />
          <el-table-column label="开始时间">
            <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="是否就绪">
            <template #default="{ row }">{{ row.ready ? "是" : "否" }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 环境配置 -->
      <el-collapse class="block-card">
        <el-collapse-item title="资源配置" name="0">
          <EnvResourcePanel
            :resource-strategy="resourceStrategy"
            :selected-environment="selectedEnvironment"
          />
        </el-collapse-item>
        <el-collapse-item title="环境变量" name="1">
          <EnvVarsPanel
            :initial-env-vars="envVarsData"
            :selected-environment="selectedEnvironment"
          />
        </el-collapse-item>
        <el-collapse-item title="ConfigMap" name="2">
          <ConfigMapPanel
            :initial-config-map="configMapData"
            :selected-environment="selectedEnvironment"
          />
        </el-collapse-item>
        <el-collapse-item title="服务域名配置" name="3">
          <DomainHostConfigPanel :app-env="appEnv" :app-name="appDetail.appName" />
        </el-collapse-item>
      </el-collapse>

      <!-- 发布单 -->
      <el-card class="block-card">
        <template #header>
          <div class="card-header">
            <span>发布单</span>
            <div>
              <el-button :disabled="deployDisabled || !selectedRow" @click="handleRelease">
                立即发布
              </el-button>
              <el-button @click="handleCreateReleaseDrawer">添加发布单</el-button>
            </div>
          </div>
        </template>
        <el-table
          :data="releaseRecordPage.items"
          row-key="releaseId"
          highlight-current-row
          @current-change="handleCurrentChange"
        >
          <el-table-column width="40">
            <template #default="{ row }">
              <el-radio
                :model-value="selectedRow?.releaseId"
                :value="row.releaseId"
                class="row-radio"
              >
                <span />
              </el-radio>
            </template>
          </el-table-column>
          <el-table-column label="发布单号" prop="releaseNo" min-width="180">
            <template #default="{ row }">
              {{ row.releaseNo }}
              <el-icon class="copy-icon" @click.stop="copyText(row.releaseNo)"><CopyDocument /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="预计发布时间">
            <template #default="{ row }">{{ formatTime(row.releaseDate) }}</template>
          </el-table-column>
          <el-table-column label="发布分支" prop="releaseBranch" />
          <el-table-column label="发布版本" prop="releaseVersion" />
          <el-table-column label="创建时间">
            <template #default="{ row }">{{ formatTime(row.gmtCreate) }}</template>
          </el-table-column>
          <el-table-column label="更新时间">
            <template #default="{ row }">{{ formatTime(row.gmtModified) }}</template>
          </el-table-column>
          <el-table-column label="发布状态">
            <template #default="{ row }">{{ getReleaseStatusText(row.releaseStatus) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-link type="primary" class="op-link" @click.stop="handleViewDetails(row)">查看</el-link>
              <el-link
                v-if="row.releaseStatus !== 'PENDING' && row.releaseStatus !== 'FINISHED'"
                type="primary"
                class="op-link"
                @click.stop="handleConfirmClose(row)"
              >
                关闭
              </el-link>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          background
          layout="total, sizes, prev, pager, next"
          :total="releaseRecordPage.total"
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          @current-change="pageReleaseRecord"
          @size-change="handleReleaseSizeChange"
        />
      </el-card>

      <!-- 发布历史 -->
      <el-card class="block-card">
        <template #header>发布历史</template>
        <el-table :data="deployHistoryPage.items" row-key="pipeKey">
          <el-table-column label="pipeKey" prop="pipeKey" min-width="200">
            <template #default="{ row }">
              {{ row.pipeKey }}
              <el-icon class="copy-icon" @click="copyText(row.pipeKey)"><CopyDocument /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="开始时间">
            <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
          </el-table-column>
          <el-table-column label="结束时间">
            <template #default="{ row }">{{ row.endTime ? formatTime(row.endTime) : "" }}</template>
          </el-table-column>
          <el-table-column label="发布内容" prop="content" show-overflow-tooltip />
          <el-table-column label="发布人" prop="creatorName" />
          <el-table-column label="发布状态">
            <template #default="{ row }">{{ getDeployStatusText(row.deployStatus) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-link type="primary" @click="handleViewHistoryLog(row.pipeKey)">查看日志</el-link>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          background
          layout="total, sizes, prev, pager, next"
          :total="deployHistoryPage.total"
          v-model:current-page="historyPagination.pageNo"
          v-model:page-size="historyPagination.pageSize"
          @current-change="pageDeployHistoryRecord"
          @size-change="handleHistorySizeChange"
        />
      </el-card>

      <CreateReleaseDrawer
        :visible="drawerVisible"
        :branches="branches"
        @close="drawerVisible = false"
        @search-branch="listBranch"
        @add-release="handleAddRelease"
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
        :open="logDrawerVisible"
        :pipe-key="pipeKey"
        @close="logDrawerVisible = false"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import {
  getAppDetail as getAppDetailApi,
  getAppEnv,
  listAppPods,
  listAppBranch,
} from "@/api/app";
import {
  page as pageReleaseApi,
  pageDeployHistory,
  queryPipeLog,
  deploy,
  close as closeRelease,
  create as createRelease,
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

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const loading = ref(true);
const appDetail = ref(null);
const appEnv = ref(null);
const pods = ref([]);
const branches = ref([]);
const selectedEnvironment = ref(null);
const selectedRow = ref(null);
const deployDisabled = ref(false);

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const historyPagination = reactive({ pageNo: 1, pageSize: 10 });
const releaseRecordPage = reactive({ items: [], total: 0 });
const deployHistoryPage = reactive({ items: [], total: 0 });
const deployHistoryLogs = ref([]);

// 抽屉状态
const drawerVisible = ref(false);
const viewDrawerVisible = ref(false);
const currentViewRelease = ref(null);
const logDrawerVisible = ref(false);
const historyLogDrawerVisible = ref(false);
const pipeKey = ref("");

let timer = null;

const formatTime = (t) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "--");

const copyText = async (text) => {
  try {
    await copyToClipboard(text);
    ElMessage.success("复制成功");
  } catch (e) {
    ElMessage.error("复制失败");
  }
};

// ===== 数据加载 =====
const getAppDetail = async () => {
  const res = await getAppDetailApi(id);
  appDetail.value = res.content;
  const envList = res.content?.appEnvList || [];
  if (envList.length > 0) {
    selectedEnvironment.value = envList[0].envId;
  }
};

const getCurrentAppEnv = async () => {
  if (!selectedEnvironment.value) return;
  const res = await getAppEnv({ envId: selectedEnvironment.value });
  appEnv.value = res.content;
};

const fetchPods = async () => {
  if (!selectedEnvironment.value) return;
  const res = await listAppPods({ envId: selectedEnvironment.value });
  pods.value = res.content || [];
};

const pageReleaseRecord = async () => {
  if (!selectedEnvironment.value) return;
  const res = await pageReleaseApi({
    appId: id,
    envId: selectedEnvironment.value,
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  });
  releaseRecordPage.items = res.content?.items || [];
  releaseRecordPage.total = res.content?.total || 0;
};

const pageDeployHistoryRecord = async () => {
  if (!selectedEnvironment.value) return;
  const res = await pageDeployHistory({
    appId: id,
    envId: selectedEnvironment.value,
    pageNo: historyPagination.pageNo,
    pageSize: historyPagination.pageSize,
  });
  deployHistoryPage.items = res.content?.items || [];
  deployHistoryPage.total = res.content?.total || 0;
};

const listBranch = async (search) => {
  if (!appDetail.value) return;
  const res = await listAppBranch({
    appId: appDetail.value.appId,
    search: search || "",
  });
  branches.value = res.content || [];
};

const refreshAll = () => {
  getCurrentAppEnv();
  fetchPods();
  pageReleaseRecord();
  pageDeployHistoryRecord();
};

// ===== 环境配置数据 =====
const configMapData = computed(() =>
  Object.entries(appEnv.value?.configMap || {}).map(([label, value]) => ({
    id: nanoid(),
    label,
    value,
    editable: false,
  }))
);

const envVarsData = computed(() =>
  Object.entries(appEnv.value?.envVars || {}).map(([label, value]) => ({
    id: nanoid(),
    label,
    value,
    editable: false,
  }))
);

const resourceStrategy = computed(() => appEnv.value?.resourceStrategy || null);

// ===== 发布进度 =====
const parsedProgress = computed(() => {
  if (appEnv.value && appEnv.value.progress) {
    try {
      return JSON.parse(appEnv.value.progress);
    } catch (e) {
      return null;
    }
  }
  return null;
});

const stepStatus = computed(() => {
  const status = parsedProgress.value?.status;
  const allowed = ["wait", "process", "finish", "error", "success"];
  return allowed.includes(status) ? status : "process";
});

const formatStepDescription = (step) => {
  if (step.description === "AWAIT_EXECUTE") return "待执行";
  if (step.description === "EXECUTING") return "执行中";
  if (step.description === "EXECUTED") return `已执行 耗时:${step.cost}秒`;
  return step.description;
};

// ===== 轮询: 发布中每3秒刷新环境 =====
const clearTimer = () => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
};

watch(
  () => appEnv.value?.deployStatus,
  (status) => {
    clearTimer();
    if (status?.toString() === "1") {
      deployDisabled.value = true;
      timer = setInterval(() => {
        getCurrentAppEnv();
      }, 3000);
    } else {
      deployDisabled.value = false;
    }
  }
);

watch(selectedEnvironment, (v) => {
  if (v) {
    selectedRow.value = null;
    pagination.pageNo = 1;
    historyPagination.pageNo = 1;
    refreshAll();
  }
});

// ===== 交互 =====
const handleCurrentChange = (row) => {
  selectedRow.value = row;
};

const handleViewDetails = (record) => {
  currentViewRelease.value = record;
  viewDrawerVisible.value = true;
};

const handleConfirmClose = (record) => {
  ElMessageBox.confirm("确定要关闭审批单吗？", "确认关闭", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await closeRelease({ releaseId: record.releaseId });
      refreshAll();
    })
    .catch(() => {});
};

const handleViewHistoryLog = async (key) => {
  const res = await queryPipeLog({ pipeKey: key });
  deployHistoryLogs.value = res.content || [];
  historyLogDrawerVisible.value = true;
};

const handleViewLogs = (key) => {
  pipeKey.value = key;
  logDrawerVisible.value = true;
};

const handleRelease = async () => {
  if (!selectedRow.value) {
    ElMessage.warning("请选择符合条件的变更单");
    return;
  }
  if (selectedRow.value.releaseStatus === "CLOSED") {
    ElMessage.warning("已关闭的变更单不允许发布");
    return;
  }
  await deploy({ releaseId: selectedRow.value.releaseId });
  ElMessage.success("开始发布");
  selectedRow.value = null;
  refreshAll();
};

const handleCreateReleaseDrawer = () => {
  if (!drawerVisible.value) {
    listBranch("");
  }
  drawerVisible.value = !drawerVisible.value;
};

const handleAddRelease = async (values) => {
  await createRelease({
    ...values,
    appId: id,
    envId: selectedEnvironment.value,
  });
  ElMessage.success("添加成功");
  drawerVisible.value = false;
  refreshAll();
};

const handleReleaseSizeChange = () => {
  pagination.pageNo = 1;
  pageReleaseRecord();
};

const handleHistorySizeChange = () => {
  historyPagination.pageNo = 1;
  pageDeployHistoryRecord();
};

onMounted(async () => {
  try {
    await getAppDetail();
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style lang="less" scoped>
.deploy-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    justify-content: space-between;
    align-items: center;
  }
  .copy-icon {
    margin-left: 4px;
    cursor: pointer;
    color: var(--el-color-primary);
    vertical-align: middle;
  }
  .op-link {
    margin-right: 12px;
  }
  .row-radio {
    :deep(.el-radio__label) {
      display: none;
    }
  }
  .pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
  :deep(.el-collapse-item__content) {
    padding: 16px;
  }
}
</style>
