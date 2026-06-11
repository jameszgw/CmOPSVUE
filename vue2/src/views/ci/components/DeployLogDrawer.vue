<template>
  <el-drawer title="查看发布日志" :visible="visible" size="1200px" @close="$emit('close')">
    <div class="drawer-body">
      <pre class="log-content">{{ logContent }}</pre>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "DeployLogDrawer",
  props: {
    visible: { type: Boolean, default: false },
    pipeKey: { type: String, default: "" },
  },
  data() {
    return {
      logContent: "",
      socket: null,
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.logContent = "";
        this.connectWebSocket();
      } else {
        this.closeSocket();
      }
    },
  },
  beforeDestroy() {
    this.closeSocket();
  },
  methods: {
    connectWebSocket() {
      const connectionAddr = `ws://${window.location.host}/api/ws/devops/${this.pipeKey}`;
      this.socket = new WebSocket(connectionAddr);
      this.socket.onopen = () => {
        console.log("WebSocket connected");
      };
      this.socket.onmessage = (event) => {
        this.logContent += event.data;
      };
      this.socket.onclose = () => {
        console.log("WebSocket closed");
      };
    },
    closeSocket() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px 20px;
  height: 100%;
  overflow: auto;
}
.log-content {
  white-space: pre-wrap;
  word-break: break-all;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
}
</style>
