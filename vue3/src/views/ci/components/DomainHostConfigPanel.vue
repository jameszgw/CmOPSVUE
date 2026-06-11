<template>
  <div class="domain-host-config-panel">
    <el-tabs v-if="appEnv">
      <el-tab-pane label="Service" name="service">
        <ServicePanel
          :initial-services="initialServices"
          :selected-environment="appEnv.envId"
        />
      </el-tab-pane>
      <el-tab-pane label="Ingress" name="ingress">
        <IngressPanel
          :ingress="initialIngress"
          :app-name="appName"
          :selected-environment="appEnv.envId"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { computed } from "vue";
import ServicePanel from "./ServicePanel.vue";
import IngressPanel from "./IngressPanel.vue";

const props = defineProps({
  appEnv: { type: Object, default: null },
  appName: { type: String, default: "" },
});

const initialServices = computed(() =>
  props.appEnv?.service ? JSON.parse(props.appEnv.service) : []
);
const initialIngress = computed(() =>
  props.appEnv?.ingress ? JSON.parse(props.appEnv.ingress) : {}
);
</script>

<style lang="less" scoped></style>
