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

<script>
import MonitorLayout from "@/components/monitor/MonitorLayout.vue";
import Overview from "./mq/Overview.vue";
import Topics from "./mq/Topics.vue";
import Consumers from "./mq/Consumers.vue";
import Brokers from "./mq/Brokers.vue";

export default {
  name: "MonitorMq",
  components: {
    MonitorLayout,
    Overview,
    Topics,
    Consumers,
    Brokers,
  },
  data() {
    return {
      tabs: [
        { key: "overview", label: "概览", icon: "el-icon-data-analysis" },
        { key: "topics", label: "主题/分区", icon: "el-icon-files" },
        { key: "consumers", label: "消费组", icon: "el-icon-user" },
        { key: "brokers", label: "Broker", icon: "el-icon-box" },
      ],
      tabComponents: {
        overview: "Overview",
        topics: "Topics",
        consumers: "Consumers",
        brokers: "Brokers",
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
