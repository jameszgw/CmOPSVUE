<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="K8S" title="容器监控" :tabs="tabs">
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
import Overview from "./k8s/Overview.vue";
import Nodes from "./k8s/Nodes.vue";
import Pods from "./k8s/Pods.vue";
import ControlPlane from "./k8s/ControlPlane.vue";
import NetStorage from "./k8s/NetStorage.vue";
import Events from "./k8s/Events.vue";

const tabs = [
  { key: "overview", label: "集群概览", icon: "Histogram" },
  { key: "nodes", label: "节点", icon: "Platform" },
  { key: "pods", label: "工作负载", icon: "Box" },
  { key: "controlplane", label: "控制平面", icon: "SetUp" },
  { key: "netstorage", label: "网络与存储", icon: "Connection" },
  { key: "events", label: "事件", icon: "Bell" },
];

const tabComponents = {
  overview: Overview,
  nodes: Nodes,
  pods: Pods,
  controlplane: ControlPlane,
  netstorage: NetStorage,
  events: Events,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
