<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="VIRT" title="虚拟化监控" :tabs="tabs">
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
import Overview from "./virt/Overview.vue";
import Hosts from "./virt/Hosts.vue";
import Guests from "./virt/Guests.vue";
import Capacity from "./virt/Capacity.vue";

export default {
  name: "MonitorVirt",
  components: {
    MonitorLayout,
    Overview,
    Hosts,
    Guests,
    Capacity,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "hosts", label: "宿主节点", icon: "el-icon-monitor" },
        { key: "guests", label: "虚机/容器", icon: "el-icon-s-grid" },
        { key: "capacity", label: "资源容量", icon: "el-icon-pie-chart" },
      ],
      tabComponents: {
        overview: "Overview",
        hosts: "Hosts",
        guests: "Guests",
        capacity: "Capacity",
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
