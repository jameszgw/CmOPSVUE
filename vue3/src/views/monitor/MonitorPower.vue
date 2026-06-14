<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="POWER" title="电能监控" :tabs="tabs">
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
import Overview from "./power/Overview.vue";
import Circuits from "./power/Circuits.vue";
import Battery from "./power/Battery.vue";
import Trend from "./power/Trend.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "circuits", label: "回路", icon: "Connection" },
  { key: "battery", label: "电池", icon: "Lightning" },
  { key: "trend", label: "趋势", icon: "TrendCharts" },
];

const tabComponents = {
  overview: Overview,
  circuits: Circuits,
  battery: Battery,
  trend: Trend,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
