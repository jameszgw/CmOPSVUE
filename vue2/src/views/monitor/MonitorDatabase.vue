<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="DATABASE" title="数据库监控" :tabs="tabs">
      <template #default="{ deviceId, device, activeKey, refreshToken }">
        <component
          :is="tabComponents[activeKey]"
          :device-id="deviceId"
          :device="device"
          :refresh-token="refreshToken"
        />
      </template>
    </MonitorLayout>
  </div>
</template>

<script>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./database/Overview.vue";
import Connection from "./database/Connection.vue";
import Performance from "./database/Performance.vue";
import Tables from "./database/Tables.vue";

export default {
  name: "MonitorDatabase",
  components: {
    MonitorLayout,
    Overview,
    Connection,
    Performance,
    Tables,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览信息", icon: "el-icon-data-analysis" },
        { key: "connection", label: "连接信息", icon: "el-icon-share" },
        { key: "performance", label: "性能统计", icon: "el-icon-data-line" },
        { key: "tables", label: "表统计", icon: "el-icon-s-grid" },
      ],
      tabComponents: {
        overview: "Overview",
        connection: "Connection",
        performance: "Performance",
        tables: "Tables",
      },
    };
  },
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
