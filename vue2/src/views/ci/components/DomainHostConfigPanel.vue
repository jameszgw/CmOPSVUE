<template>
  <div class="domain-host-config-panel">
    <el-tabs v-if="appEnv" v-model="activeTab">
      <el-tab-pane label="Service" name="service">
        <ServicePanel
          :initial-services="initialServices"
          :selected-environment="appEnv.envId"
          @updated="$emit('updated')"
        />
      </el-tab-pane>
      <el-tab-pane label="Ingress" name="ingress">
        <IngressPanel
          :ingress="initialIngress"
          :app-name="appName"
          :selected-environment="appEnv.envId"
          @updated="$emit('updated')"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import ServicePanel from "./ServicePanel.vue";
import IngressPanel from "./IngressPanel.vue";

export default {
  name: "DomainHostConfigPanel",
  components: { ServicePanel, IngressPanel },
  props: {
    appEnv: { type: Object, default: null },
    appName: { type: String, default: "" },
  },
  data() {
    return {
      activeTab: "service",
    };
  },
  computed: {
    initialServices() {
      try {
        return this.appEnv && this.appEnv.service ? JSON.parse(this.appEnv.service) : [];
      } catch (e) {
        return [];
      }
    },
    initialIngress() {
      try {
        return this.appEnv && this.appEnv.ingress ? JSON.parse(this.appEnv.ingress) : {};
      } catch (e) {
        return {};
      }
    },
  },
};
</script>

<style lang="less" scoped>
.domain-host-config-panel {
  width: 100%;
}
</style>
