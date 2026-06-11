<template>
  <div class="page-container">
    <h1>主机详情</h1>
    <p v-if="loading">加载中...</p>
    <SingleTerminalComponent
      :ws-url="wsUrl"
      :modal-host="null"
      :open="false"
      @close="() => {}"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import SingleTerminalComponent from "./components/SingleTerminalComponent.vue";

const route = useRoute();
const loading = ref(false);

// 获取主机的 WebSocket 地址
const wsUrl = `ws://${window.location.host}/api/ws/terminal`;

// 路由参数 :id（保留原逻辑，原代码未使用）
const id = route.params.id;
</script>

<style lang="less" scoped>
.title {
  background: rgb(121, 242, 196);
}
</style>
