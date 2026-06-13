<template>
  <div class="page-container monitor-page">
    <MonitorLayout device-type="MQ" title="消息中间件" :tabs="tabs">
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
import Overview from "./mq/Overview.vue";
import Topics from "./mq/Topics.vue";
import Consumers from "./mq/Consumers.vue";
import Brokers from "./mq/Brokers.vue";

const tabs = [
  { key: "overview", label: "概览", icon: "Histogram" },
  { key: "topics", label: "主题/分区", icon: "Files" },
  { key: "consumers", label: "消费组", icon: "User" },
  { key: "brokers", label: "Broker", icon: "Box" },
];

const tabComponents = {
  overview: Overview,
  topics: Topics,
  consumers: Consumers,
  brokers: Brokers,
};
</script>

<style lang="less" scoped>
.monitor-page {
  height: calc(100vh - 152px);
}
</style>
