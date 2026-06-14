<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="IOT" title="物联感知" :tabs="tabs">
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
import Overview from "./iot/Overview.vue";
import Sensors from "./iot/Sensors.vue";
import Signal from "./iot/Signal.vue";
import Events from "./iot/Events.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "sensors", label: "传感器", icon: "Cpu" },
  { key: "signal", label: "信号", icon: "Connection" },
  { key: "events", label: "事件", icon: "Bell" },
];

const tabComponents = {
  overview: Overview,
  sensors: Sensors,
  signal: Signal,
  events: Events,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
