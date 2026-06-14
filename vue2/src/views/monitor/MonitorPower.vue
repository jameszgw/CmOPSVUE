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

<script>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./power/Overview.vue";
import Circuits from "./power/Circuits.vue";
import Battery from "./power/Battery.vue";
import Trend from "./power/Trend.vue";

export default {
  name: "MonitorPower",
  components: {
    MonitorLayout,
    Overview,
    Circuits,
    Battery,
    Trend,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "circuits", label: "回路", icon: "el-icon-menu" },
        { key: "battery", label: "电池", icon: "el-icon-mobile" },
        { key: "trend", label: "趋势", icon: "el-icon-data-line" },
      ],
      tabComponents: {
        overview: "Overview",
        circuits: "Circuits",
        battery: "Battery",
        trend: "Trend",
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
