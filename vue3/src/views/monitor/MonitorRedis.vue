<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="REDIS" title="Redis监控" :tabs="tabs">
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
import Overview from "./redis/Overview.vue";
import MemoryInfo from "./redis/MemoryInfo.vue";
import Clients from "./redis/Clients.vue";
import Keyspace from "./redis/Keyspace.vue";
import Statistics from "./redis/Statistics.vue";
import SlowLog from "./redis/SlowLog.vue";

const tabs = [
  { key: "overview", label: "概览信息", icon: "Histogram" },
  { key: "memory", label: "内存信息", icon: "Coin" },
  { key: "clients", label: "客户端", icon: "User" },
  { key: "keyspace", label: "键空间", icon: "Key" },
  { key: "statistics", label: "统计信息", icon: "TrendCharts" },
  { key: "slowlog", label: "慢日志", icon: "Timer" },
];

const tabComponents = {
  overview: Overview,
  memory: MemoryInfo,
  clients: Clients,
  keyspace: Keyspace,
  statistics: Statistics,
  slowlog: SlowLog,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
