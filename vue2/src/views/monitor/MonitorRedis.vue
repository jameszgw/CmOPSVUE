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

<script>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./redis/Overview.vue";
import MemoryInfo from "./redis/MemoryInfo.vue";
import Clients from "./redis/Clients.vue";
import Keyspace from "./redis/Keyspace.vue";
import Statistics from "./redis/Statistics.vue";
import SlowLog from "./redis/SlowLog.vue";

export default {
  name: "MonitorRedis",
  components: {
    MonitorLayout,
    Overview,
    MemoryInfo,
    Clients,
    Keyspace,
    Statistics,
    SlowLog,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览信息", icon: "el-icon-data-analysis" },
        { key: "memory", label: "内存信息", icon: "el-icon-coin" },
        { key: "clients", label: "客户端", icon: "el-icon-user" },
        { key: "keyspace", label: "键空间", icon: "el-icon-key" },
        { key: "statistics", label: "统计信息", icon: "el-icon-data-line" },
        { key: "slowlog", label: "慢日志", icon: "el-icon-time" },
      ],
      tabComponents: {
        overview: "Overview",
        memory: "MemoryInfo",
        clients: "Clients",
        keyspace: "Keyspace",
        statistics: "Statistics",
        slowlog: "SlowLog",
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
