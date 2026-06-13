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

<script setup>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./lb/Overview.vue";
import Traffic from "./lb/Traffic.vue";
import Upstreams from "./lb/Upstreams.vue";
import Connections from "./lb/Connections.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "traffic", label: "流量", icon: "TrendCharts" },
  { key: "upstreams", label: "上游", icon: "Share" },
  { key: "connections", label: "连接与安全", icon: "Connection" },
];

const tabComponents = {
  overview: Overview,
  traffic: Traffic,
  upstreams: Upstreams,
  connections: Connections,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
