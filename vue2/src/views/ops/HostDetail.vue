<template>
  <screen-page title="主机详情" gap="8px">
    <section-card dense scrollable body-class="fill" class="fill" title="详情" icon="el-icon-monitor">
      <p v-if="loading">加载中...</p>
      <single-terminal-component
        :ws-url="wsUrl"
        :modal-host="null"
        :open="false"
        @close="() => {}"
      />
    </section-card>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import SingleTerminalComponent from "./components/SingleTerminalComponent.vue";

export default {
  name: "HostDetail",
  components: {
    ScreenPage,
    SectionCard,
    SingleTerminalComponent,
  },
  data() {
    return {
      loading: false,
      // 获取主机的 WebSocket 地址
      wsUrl: `ws://${window.location.host}/api/ws/terminal`,
    };
  },
  computed: {
    hostId() {
      return this.$route.params.id;
    },
  },
};
</script>

