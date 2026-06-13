<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="LB" title="负载均衡" :tabs="tabs">
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
import Overview from "./lb/Overview.vue";
import Traffic from "./lb/Traffic.vue";
import Upstreams from "./lb/Upstreams.vue";
import Connections from "./lb/Connections.vue";

export default {
  name: "MonitorLb",
  components: {
    MonitorLayout,
    Overview,
    Traffic,
    Upstreams,
    Connections,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "traffic", label: "流量", icon: "el-icon-data-line" },
        { key: "upstreams", label: "上游", icon: "el-icon-share" },
        { key: "connections", label: "连接与安全", icon: "el-icon-connection" },
      ],
      tabComponents: {
        overview: "Overview",
        traffic: "Traffic",
        upstreams: "Upstreams",
        connections: "Connections",
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
