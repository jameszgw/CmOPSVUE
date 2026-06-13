<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="NETDEV" title="网络设备" :tabs="tabs">
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
import Overview from "./netdev/Overview.vue";
import Ports from "./netdev/Ports.vue";
import Sessions from "./netdev/Sessions.vue";
import Protocols from "./netdev/Protocols.vue";

export default {
  name: "MonitorNetDev",
  components: {
    MonitorLayout,
    Overview,
    Ports,
    Sessions,
    Protocols,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "ports", label: "端口", icon: "el-icon-connection" },
        { key: "sessions", label: "会话", icon: "el-icon-share" },
        { key: "protocols", label: "协议/拓扑", icon: "el-icon-set-up" },
      ],
      tabComponents: {
        overview: "Overview",
        ports: "Ports",
        sessions: "Sessions",
        protocols: "Protocols",
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
