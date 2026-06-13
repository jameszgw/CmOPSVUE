<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="SERVER" title="Server监控" :tabs="tabs">
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
import SystemInfo from "./server/SystemInfo.vue";
import CpuInfo from "./server/CpuInfo.vue";
import MemoryInfo from "./server/MemoryInfo.vue";
import DiskInfo from "./server/DiskInfo.vue";
import NetworkInfo from "./server/NetworkInfo.vue";
import ProcessInfo from "./server/ProcessInfo.vue";

const tabs = [
  { key: "system", label: "系统信息", icon: "Platform" },
  { key: "cpu", label: "CPU信息", icon: "Cpu" },
  { key: "memory", label: "内存信息", icon: "Coin" },
  { key: "disk", label: "磁盘信息", icon: "Files" },
  { key: "network", label: "网络信息", icon: "Connection" },
  { key: "process", label: "进程信息", icon: "List" },
];

const tabComponents = {
  system: SystemInfo,
  cpu: CpuInfo,
  memory: MemoryInfo,
  disk: DiskInfo,
  network: NetworkInfo,
  process: ProcessInfo,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
