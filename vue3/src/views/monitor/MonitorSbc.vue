<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="SBC" title="单板机监控" :tabs="tabs">
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
import Overview from "./sbc/Overview.vue";
import BoardSensors from "./sbc/BoardSensors.vue";
import Gpio from "./sbc/Gpio.vue";
import Trend from "./sbc/Trend.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "boardSensors", label: "板载传感器", icon: "Sunny" },
  { key: "gpio", label: "GPIO", icon: "Connection" },
  { key: "trend", label: "趋势", icon: "TrendCharts" },
];

const tabComponents = {
  overview: Overview,
  boardSensors: BoardSensors,
  gpio: Gpio,
  trend: Trend,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
