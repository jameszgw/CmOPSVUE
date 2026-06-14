<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="ESS" title="储能监控" :tabs="tabs">
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
import Overview from "./ess/Overview.vue";
import Cells from "./ess/Cells.vue";
import ChargeDischarge from "./ess/ChargeDischarge.vue";
import Trend from "./ess/Trend.vue";

export default {
  name: "MonitorEss",
  components: {
    MonitorLayout,
    Overview,
    Cells,
    ChargeDischarge,
    Trend,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "cells", label: "电芯", icon: "el-icon-menu" },
        { key: "chargeDischarge", label: "充放电", icon: "el-icon-refresh" },
        { key: "trend", label: "趋势", icon: "el-icon-data-line" },
      ],
      tabComponents: {
        overview: "Overview",
        cells: "Cells",
        chargeDischarge: "ChargeDischarge",
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
