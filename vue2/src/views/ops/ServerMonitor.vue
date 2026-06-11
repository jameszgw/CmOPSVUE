<template>
  <div class="page-container">
    <h2 class="title">主机监控</h2>
    <el-card shadow="never">
      <el-form inline :model="searchForm" @submit.native.prevent>
        <el-form-item label="实例名称">
          <el-input v-model="searchForm.name" placeholder="请输入实例名称" />
        </el-form-item>
        <el-form-item label="主机名称">
          <el-input v-model="searchForm.hostName" placeholder="请输入主机名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="margin-right: 8px" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="hosts.items" row-key="hostId" style="width: 100%">
        <el-table-column label="实例名称">
          <template #default="{ row }">
            <span>{{ row.host && row.host.name }}</span>
            <el-button
              type="text"
              icon="el-icon-document-copy"
              @click="copyText(row.host && row.host.name)"
            />
          </template>
        </el-table-column>
        <el-table-column label="主机名称">
          <template #default="{ row }">
            {{ row.host && row.host.hostName }}
            <br />
            IP:
            <span>{{ row.host && row.host.serverAddr }}</span>
            <el-button
              type="text"
              icon="el-icon-document-copy"
              @click="copyText(row.host && row.host.serverAddr)"
            />
          </template>
        </el-table-column>
        <el-table-column label="插件状态">
          <template #default="{ row }">
            <el-tag :type="monitorStatusTag(row.monitorStatus).type">
              {{ monitorStatusTag(row.monitorStatus).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="monitorUrl" label="插件地址" />
        <el-table-column prop="accessToken" label="Token" />
        <el-table-column prop="agentVersion" label="agent版本" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.host && row.host.status === '0' ? 'success' : 'danger'">
              {{ row.host && row.host.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330">
          <template #default="{ row }">
            <el-button type="text" @click="handleConnect(row)">测试</el-button>
            <el-button type="text" @click="handleInstall(row.hostId)">安装</el-button>
            <el-button type="text" @click="handleEdit(row)">插件配置</el-button>
            <el-button type="text" @click="handleSync(row)">同步</el-button>
            <el-button type="text" @click="handleOpenAlarmDrawer(row)">报警配置</el-button>
            <el-button type="text" @click="handleView(row)">报警历史</el-button>
            <el-button type="text" @click="handleMonitorViewPanel(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 12px; text-align: right"
        layout="total, prev, pager, next, sizes"
        :total="hosts.total"
        :current-page="pagination.pageNo"
        :page-size="pagination.pageSize"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 编辑插件的抽屉 -->
    <el-drawer
      title="编辑插件配置"
      :visible.sync="drawerVisible"
      size="400px"
      destroy-on-close
      @close="handleCloseDrawer"
    >
      <div style="padding: 0 20px">
        <host-monitor-config-form
          v-if="drawerVisible"
          :initial-values="editingHost"
          @submit="handleUpdate"
          @cancel="handleCloseDrawer"
        />
      </div>
    </el-drawer>

    <!-- 报警配置抽屉 -->
    <el-drawer
      title="报警配置"
      :visible.sync="alarmDrawerVisible"
      size="600px"
      destroy-on-close
      @close="handleCloseAlarmDrawer"
    >
      <div style="padding: 0 20px">
        <alarm-configure-form
          v-if="alarmDrawerVisible && alarmConfig"
          :initial-values="alarmConfig"
          :alarm-groups="alarmGroupItems"
          @submit="handleAlarmFormSubmit"
          @cancel="handleCloseAlarmDrawer"
        />
      </div>
    </el-drawer>

    <!-- 监控查看抽屉 -->
    <el-drawer
      title="监控"
      :visible.sync="monitorViewDrawerVisible"
      size="1000px"
      destroy-on-close
    >
      <top-progress-table
        v-if="monitorViewDrawerVisible"
        :host-id="basicMetricVO && basicMetricVO.machineId"
        :disks="disks"
        :basic-metric-v-o="basicMetricVO"
      />
    </el-drawer>
  </div>
</template>

<script>
import HostMonitorConfigForm from "./components/HostMonitorConfigForm.vue";
import AlarmConfigureForm from "./components/AlarmConfigureForm.vue";
import TopProgressTable from "./components/TopProgressTable.vue";
import {
  fetch as fetchMonitorHosts,
  update as updateMonitor,
  testConnect,
  install,
  sync as syncMonitor,
  sendPing,
  metrics,
  getDiskName,
} from "@/api/host-monitor";
import { getAlarmConfig, configureAlarmConfig } from "@/api/host-alarm-config";
import { fetchAlarmGroup } from "@/api/alarm-group";

export default {
  name: "ServerMonitor",
  components: {
    HostMonitorConfigForm,
    AlarmConfigureForm,
    TopProgressTable,
  },
  data() {
    return {
      pagination: { pageNo: 1, pageSize: 10 },
      searchForm: { name: "", hostName: "" },
      filters: { name: "", hostName: "" },
      drawerVisible: false,
      alarmDrawerVisible: false,
      monitorViewDrawerVisible: false,
      editingHost: null,
      editingHostForAlarm: null,
      alarmConfig: null,
      alarmGroupItems: [],
      disks: [],
      basicMetricVO: null,
      hosts: { items: [], total: 0 },
    };
  },
  created() {
    this.getAlarmGroups();
    this.getHosts();
  },
  methods: {
    copyText(text) {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        this.$message.success("复制成功");
      });
    },
    monitorStatusTag(status) {
      switch (status) {
        case 1:
          return { type: "warning", text: "未启动" };
        case 2:
          return { type: "", text: "启动中" };
        case 3:
          return { type: "success", text: "运行中" };
        default:
          return { type: "info", text: "" };
      }
    },
    async getHosts() {
      const res = await fetchMonitorHosts({ ...this.pagination, ...this.filters });
      this.hosts = res.content || { items: [], total: 0 };
    },
    async getAlarmGroups() {
      const res = await fetchAlarmGroup({ pageNo: 1, pageSize: 50 });
      this.alarmGroupItems = (res.content && res.content.items) || [];
    },
    onSearch() {
      this.filters = { ...this.searchForm };
      this.pagination = { pageNo: 1, pageSize: 10 }; // 重置分页
      this.getHosts();
    },
    onReset() {
      this.searchForm = { name: "", hostName: "" };
      this.filters = { name: "", hostName: "" };
      this.getHosts();
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.getHosts();
    },
    handleSizeChange(pageSize) {
      this.pagination = { pageNo: 1, pageSize };
      this.getHosts();
    },
    handleEdit(host) {
      this.editingHost = host;
      this.drawerVisible = true;
    },
    handleCloseDrawer() {
      this.editingHost = null;
      this.drawerVisible = false;
    },
    async handleConnect(host) {
      await testConnect({ accessToken: host.accessToken, url: host.monitorUrl });
      this.$message.success("连接成功");
    },
    async handleInstall(hostId) {
      await install({ hostId, upgrade: false });
      this.$message.success("安装成功");
      this.getHosts();
    },
    async handleSync(host) {
      await syncMonitor({
        accessToken: host.accessToken,
        url: host.monitorUrl,
        hostId: host.hostId,
      });
      this.$message.success("操作成功");
      this.getHosts();
    },
    async handleUpdate(values) {
      const hostId = this.editingHost && this.editingHost.hostId;
      this.drawerVisible = false;
      await updateMonitor({
        hostId,
        accessToken: values.accessToken,
        url: values.monitorUrl,
      });
      this.$message.success("操作成功");
      this.getHosts();
    },
    async handleOpenAlarmDrawer(host) {
      const res = await getAlarmConfig({ hostId: host.hostId });
      this.alarmConfig = res.content;
      this.alarmDrawerVisible = true;
      this.editingHostForAlarm = host;
    },
    handleCloseAlarmDrawer() {
      this.alarmDrawerVisible = false;
      this.editingHostForAlarm = null;
    },
    async handleAlarmFormSubmit(values) {
      const hostId = this.editingHostForAlarm && this.editingHostForAlarm.hostId;
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
      this.handleCloseAlarmDrawer();
      await configureAlarmConfig(data);
      this.$message.success("配置成功");
    },
    handleView(record) {
      this.$router.push(`/devops/ops/host/alarm/history/${record.hostId}`);
    },
    handleMonitorViewPanel(record) {
      this.monitorViewDrawerVisible = !this.monitorViewDrawerVisible;
      this.loadMetricData(record);
    },
    async loadMetricData(record) {
      sendPing({ hostId: record.hostId }).then(() => {
        this.$message.success("操作成功");
      });
      getDiskName({ hostId: record.hostId }).then((res) => {
        this.disks = res.content || [];
      });
      metrics({ hostId: record.hostId }).then((res) => {
        this.basicMetricVO = res.content;
      });
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(242, 219, 121);
}
</style>
