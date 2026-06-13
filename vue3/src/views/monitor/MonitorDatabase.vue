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

<script setup>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./database/Overview.vue";
import Connection from "./database/Connection.vue";
import Performance from "./database/Performance.vue";
import Tables from "./database/Tables.vue";

const tabs = [
  { key: "overview", label: "概览信息", icon: "Histogram" },
  { key: "connection", label: "连接信息", icon: "Share" },
  { key: "performance", label: "性能统计", icon: "TrendCharts" },
  { key: "tables", label: "表统计", icon: "Grid" },
];

const tabComponents = {
  overview: Overview,
  connection: Connection,
  performance: Performance,
  tables: Tables,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
