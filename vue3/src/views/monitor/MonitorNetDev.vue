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

<script setup>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./netdev/Overview.vue";
import Ports from "./netdev/Ports.vue";
import Sessions from "./netdev/Sessions.vue";
import Protocols from "./netdev/Protocols.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "ports", label: "端口", icon: "Connection" },
  { key: "sessions", label: "会话", icon: "Share" },
  { key: "protocols", label: "协议/拓扑", icon: "SetUp" },
];

const tabComponents = {
  overview: Overview,
  ports: Ports,
  sessions: Sessions,
  protocols: Protocols,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
