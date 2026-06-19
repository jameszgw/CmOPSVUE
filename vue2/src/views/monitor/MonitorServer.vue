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

<script>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import SystemInfo from "./server/SystemInfo.vue";
import CpuInfo from "./server/CpuInfo.vue";
import MemoryInfo from "./server/MemoryInfo.vue";
import DiskInfo from "./server/DiskInfo.vue";
import NetworkInfo from "./server/NetworkInfo.vue";
import ProcessInfo from "./server/ProcessInfo.vue";
import HardwareSensors from "./server/HardwareSensors.vue";
import VirtualizationInfo from "./server/VirtualizationInfo.vue";

export default {
  name: "MonitorServer",
  components: {
    MonitorLayout,
    SystemInfo,
    CpuInfo,
    MemoryInfo,
    DiskInfo,
    NetworkInfo,
    ProcessInfo,
    HardwareSensors,
    VirtualizationInfo,
  },
  data() {
    return {
      tabs: [
        { key: "system", label: "系统信息", icon: "el-icon-monitor" },
        { key: "cpu", label: "CPU信息", icon: "el-icon-cpu" },
        { key: "memory", label: "内存信息", icon: "el-icon-coin" },
        { key: "disk", label: "磁盘信息", icon: "el-icon-files" },
        { key: "network", label: "网络信息", icon: "el-icon-connection" },
        { key: "process", label: "进程信息", icon: "el-icon-s-order" },
        { key: "hardware", label: "硬件传感器", icon: "el-icon-odometer" },
        { key: "virtualization", label: "虚拟化", icon: "el-icon-menu" },
      ],
      tabComponents: {
        system: "SystemInfo",
        cpu: "CpuInfo",
        memory: "MemoryInfo",
        disk: "DiskInfo",
        network: "NetworkInfo",
        process: "ProcessInfo",
        hardware: "HardwareSensors",
        virtualization: "VirtualizationInfo",
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
