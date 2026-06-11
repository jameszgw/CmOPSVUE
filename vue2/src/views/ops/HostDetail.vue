<template>
  <div class="page-container">
    <h1 class="title">主机详情</h1>
    <p v-if="loading">加载中...</p>
    <single-terminal-component
      :ws-url="wsUrl"
      :modal-host="null"
      :open="false"
      @close="() => {}"
    />
  </div>
</template>

<script>
import SingleTerminalComponent from "./components/SingleTerminalComponent.vue";

export default {
  name: "HostDetail",
  components: {
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

<style lang="less" scoped>
.title {
  background: rgb(121, 242, 196);
}
</style>
