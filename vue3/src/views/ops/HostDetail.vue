<template>
  <ScreenPage title="主机详情" gap="8px">
    <SectionCard dense scrollable bodyClass="fill" class="fill" title="详情" icon="Monitor">
      <p v-if="loading">加载中...</p>
      <SingleTerminalComponent
        :ws-url="wsUrl"
        :modal-host="null"
        :open="false"
        @close="() => {}"
      />
    </SectionCard>
  </ScreenPage>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import SingleTerminalComponent from "./components/SingleTerminalComponent.vue";

const route = useRoute();
const loading = ref(false);

// 获取主机的 WebSocket 地址
const wsUrl = `ws://${window.location.host}/api/ws/terminal`;

// 路由参数 :id（保留原逻辑，原代码未使用）
const id = route.params.id;
</script>
