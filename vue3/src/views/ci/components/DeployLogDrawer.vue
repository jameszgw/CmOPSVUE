<template>
  <el-drawer
    title="查看发布日志"
    size="1200px"
    :model-value="open"
    @close="emit('close')"
  >
    <!-- 显示发布日志内容 -->
    <pre class="log-content">{{ logContent }}</pre>
  </el-drawer>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  pipeKey: { type: String, default: "" },
});
const emit = defineEmits(["close"]);

const logContent = ref("");
let socket = null;

const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

const connectWebSocket = () => {
  const connectionAddr = `ws://${window.location.host}/api/ws/devops/${props.pipeKey}`;
  socket = new WebSocket(connectionAddr);
  socket.onopen = () => {
    console.log("WebSocket connected");
  };
  socket.onmessage = (event) => {
    // 追加接收到的日志内容
    logContent.value += event.data;
  };
  socket.onclose = () => {
    console.log("WebSocket closed");
  };
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      logContent.value = "";
      connectWebSocket();
    } else {
      closeSocket();
    }
  }
);

onBeforeUnmount(() => {
  closeSocket();
});
</script>

<style lang="less" scoped>
.log-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
