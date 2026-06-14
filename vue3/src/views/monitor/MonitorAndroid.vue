<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="ANDROID" title="安卓多开" :tabs="tabs">
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
import Overview from "./android/Overview.vue";
import Instances from "./android/Instances.vue";
import GroupControl from "./android/GroupControl.vue";
import Trend from "./android/Trend.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "instances", label: "实例", icon: "Grid" },
  { key: "groupControl", label: "群控", icon: "Operation" },
  { key: "trend", label: "趋势", icon: "TrendCharts" },
];

const tabComponents = {
  overview: Overview,
  instances: Instances,
  groupControl: GroupControl,
  trend: Trend,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
