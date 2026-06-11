<template>
  <div class="page-container">
    <h2 class="page-title">主机监控</h2>
    <el-card shadow="never">
      <el-form inline :model="searchForm" @submit.prevent>
        <el-form-item label="实例名称">
          <el-input v-model="searchForm.name" placeholder="请输入实例名称" clearable />
        </el-form-item>
        <el-form-item label="主机名称">
          <el-input v-model="searchForm.hostName" placeholder="请输入主机名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="hosts.items" row-key="hostId" style="width: 100%">
        <el-table-column label="实例名称">
          <template #default="{ row }">
            <span class="copyable" title="点击复制" @click="copyText(row.host?.name)">
              {{ row.host?.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="主机名称" min-width="140">
          <template #default="{ row }">
            {{ row.host?.hostName }}
            <br />
            IP:
            <span class="copyable" title="点击复制" @click="copyText(row.host?.serverAddr)">
              {{ row.host?.serverAddr }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="插件状态" width="90">
          <template #default="{ row }">
            <el-tag :type="monitorStatusType(row.monitorStatus)">
              {{ monitorStatusText(row.monitorStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="monitorUrl" label="插件地址" min-width="140" />
        <el-table-column prop="accessToken" label="Token" min-width="120" show-overflow-tooltip />
        <el-table-column prop="agentVersion" label="agent版本" width="90" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.host?.status === '0' ? 'success' : 'danger'">
              {{ row.host?.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleConnect(row)">测试</el-button>
            <el-button link type="primary" @click="handleInstall(row.hostId)">安装</el-button>
            <el-button link type="primary" @click="handleEdit(row)">插件配置</el-button>
            <el-button link type="primary" @click="handleSync(row)">同步</el-button>
            <el-button link type="primary" @click="handleOpenAlarmDrawer(row)">报警配置</el-button>
            <el-button link type="primary" @click="handleView(row)">报警历史</el-button>
            <el-button link type="primary" @click="handleMonitorViewPanel(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next"
        :total="hosts.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 编辑插件的抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="编辑插件配置"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <HostMonitorConfigForm
        :initial-values="editingHost"
        @submit="handleUpdate"
        @cancel="handleCloseDrawer"
      />
    </el-drawer>

    <!-- 报警配置抽屉 -->
    <el-drawer
      v-model="alarmDrawerVisible"
      title="报警配置"
      size="600px"
      destroy-on-close
      @close="handleCloseAlarmDrawer"
    >
      <AlarmConfigureForm
        v-if="alarmConfig"
        :initial-values="alarmConfig"
        :alarm-groups="alarmGroups.items"
        @submit="handleAlarmFormSubmit"
        @cancel="handleCloseAlarmDrawer"
      />
    </el-drawer>

    <!-- 监控查看抽屉 -->
    <el-drawer v-model="monitorViewDrawerVisible" title="监控" size="1000px" destroy-on-close>
      <TopProgressTable
        :host-id="basicMetricVO?.machineId"
        :disks="disks"
        :basic-metric-v-o="basicMetricVO"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import HostMonitorConfigForm from "./components/HostMonitorConfigForm.vue";
import AlarmConfigureForm from "./components/AlarmConfigureForm.vue";
import TopProgressTable from "./components/TopProgressTable.vue";
import {
  fetch as fetchHostMonitors,
  update as updateHostMonitor,
  testConnect,
  install,
  sync,
  sendPing,
  metrics,
  getDiskName,
} from "@/api/host-monitor";
import { getAlarmConfig, configureAlarmConfig } from "@/api/host-alarm-config";
import { fetchAlarmGroup } from "@/api/alarm-group";

const router = useRouter();

const pagination = reactive({ pageNo: 1, pageSize: 10 });
const searchForm = reactive({ name: "", hostName: "" });
const filters = reactive({ name: "", hostName: "" });

const drawerVisible = ref(false);
const alarmDrawerVisible = ref(false);
const monitorViewDrawerVisible = ref(false);
const editingHost = ref(null);
const editingHostForAlarm = ref(null);
const alarmConfig = ref(null);

const disks = ref([]);
const basicMetricVO = ref(null);
const alarmGroups = reactive({ items: [] });
const hosts = reactive({ items: [], total: 0 });

const monitorStatusText = (status) => {
  switch (status) {
    case 1:
      return "未启动";
    case 2:
      return "启动中";
    case 3:
      return "运行中";
    default:
      return "未知";
  }
};

const monitorStatusType = (status) => {
  switch (status) {
    case 1:
      return "warning";
    case 2:
      return "primary";
    case 3:
      return "success";
    default:
      return "info";
  }
};

const copyText = (text) => {
  if (!text) {
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success("复制成功");
  });
};

const getHosts = async () => {
  const res = await fetchHostMonitors({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    ...filters,
  });
  hosts.items = res.content?.items || [];
  hosts.total = res.content?.total || 0;
};

const getAlarmGroups = async () => {
  const res = await fetchAlarmGroup({ pageNo: 1, pageSize: 50 });
  alarmGroups.items = res.content?.items || [];
};

const onSearch = () => {
  filters.name = searchForm.name;
  filters.hostName = searchForm.hostName;
  pagination.pageNo = 1;
  pagination.pageSize = 10;
  getHosts();
};

const onReset = () => {
  searchForm.name = "";
  searchForm.hostName = "";
  onSearch();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getHosts();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.pageNo = 1;
  getHosts();
};

const handleEdit = (host) => {
  editingHost.value = host;
  drawerVisible.value = true;
};

const handleCloseDrawer = () => {
  editingHost.value = null;
  drawerVisible.value = false;
};

const handleUpdate = async (values) => {
  await updateHostMonitor({
    hostId: editingHost.value?.hostId,
    accessToken: values.accessToken,
    url: values.monitorUrl,
  });
  ElMessage.success("操作成功");
  drawerVisible.value = false;
  editingHost.value = null;
  getHosts();
};

const handleConnect = async (host) => {
  await testConnect({ accessToken: host.accessToken, url: host.monitorUrl });
  ElMessage.success("连接成功");
};

const handleInstall = async (hostId) => {
  await install({ hostId, upgrade: false });
  ElMessage.success("安装成功");
  getHosts();
};

const handleSync = async (host) => {
  await sync({
    accessToken: host.accessToken,
    url: host.monitorUrl,
    hostId: host.hostId,
  });
  ElMessage.success("操作成功");
  getHosts();
};

const handleOpenAlarmDrawer = async (host) => {
  const res = await getAlarmConfig({ hostId: host.hostId });
  alarmConfig.value = res.content;
  editingHostForAlarm.value = host;
  alarmDrawerVisible.value = true;
};

const handleCloseAlarmDrawer = () => {
  alarmDrawerVisible.value = false;
  editingHostForAlarm.value = null;
};

const handleAlarmFormSubmit = async (values) => {
  const hostId = editingHostForAlarm.value?.hostId;
  const data = {
    cpu: {
      hostId,
      alarmType: 10,
      alarmThreshold: values.cpuThreshold * 0.01,
      triggerThreshold: values.cpuNotificationThreshold,
      notifySilence: values.cpuSilenceTime,
    },
    memory: {
      hostId,
      alarmType: 20,
      alarmThreshold: values.memoryThreshold * 0.01,
      triggerThreshold: values.memoryNotificationThreshold,
      notifySilence: values.memorySilenceTime,
    },
    hostId,
    groupIdList: values.alertGroupIds,
  };
  await configureAlarmConfig(data);
  ElMessage.success("配置成功");
  handleCloseAlarmDrawer();
};

const handleView = (record) => {
  router.push(`/devops/ops/host/alarm/history/${record.hostId}`);
};

const handleMonitorViewPanel = (record) => {
  monitorViewDrawerVisible.value = true;
  loadMetricData(record);
};

const loadMetricData = async (record) => {
  await sendPing({ hostId: record.hostId });
  ElMessage.success("操作成功");

  const diskRes = await getDiskName({ hostId: record.hostId });
  disks.value = diskRes.content || [];

  const metricRes = await metrics({ hostId: record.hostId });
  basicMetricVO.value = metricRes.content;
};

onMounted(() => {
  getAlarmGroups();
  getHosts();
});
</script>

<style lang="less" scoped>
.title {
  background: rgb(242, 219, 121);
}

.page-title {
  margin: 0 0 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.copyable {
  cursor: pointer;
  color: var(--el-color-primary);
}
</style>
