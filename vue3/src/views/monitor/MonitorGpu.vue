<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="GPU" title="GPU监控" :tabs="tabs">
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
import Overview from "./gpu/Overview.vue";
import Gpus from "./gpu/Gpus.vue";
import Workloads from "./gpu/Workloads.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "gpus", label: "GPU卡", icon: "Cpu" },
  { key: "workloads", label: "推理与边缘", icon: "DataLine" },
];

const tabComponents = {
  overview: Overview,
  gpus: Gpus,
  workloads: Workloads,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
