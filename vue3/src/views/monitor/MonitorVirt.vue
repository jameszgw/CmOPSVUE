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

<script setup>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./virt/Overview.vue";
import Hosts from "./virt/Hosts.vue";
import Guests from "./virt/Guests.vue";
import Capacity from "./virt/Capacity.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "hosts", label: "宿主节点", icon: "Monitor" },
  { key: "guests", label: "虚机/容器", icon: "Grid" },
  { key: "capacity", label: "资源容量", icon: "PieChart" },
];

const tabComponents = {
  overview: Overview,
  hosts: Hosts,
  guests: Guests,
  capacity: Capacity,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
