<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="STORAGE" title="存储监控" :tabs="tabs">
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
import Overview from "./storage/Overview.vue";
import Pools from "./storage/Pools.vue";
import Performance from "./storage/Performance.vue";
import Disks from "./storage/Disks.vue";

export default {
  name: "MonitorStorage",
  components: {
    MonitorLayout,
    Overview,
    Pools,
    Performance,
    Disks,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "pools", label: "存储池", icon: "el-icon-coin" },
        { key: "performance", label: "性能", icon: "el-icon-data-line" },
        { key: "disks", label: "磁盘/OSD", icon: "el-icon-files" },
      ],
      tabComponents: {
        overview: "Overview",
        pools: "Pools",
        performance: "Performance",
        disks: "Disks",
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
