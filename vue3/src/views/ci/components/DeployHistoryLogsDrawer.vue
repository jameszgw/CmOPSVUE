<template>
  <el-drawer
    title="发布记录日志"
    size="1200px"
    :model-value="visible"
    @close="emit('close')"
  >
    <div v-for="(log, index) in deployHistoryLogs || []" :key="index" class="log-line">
      {{ log.time }} {{ log.message }}
    </div>
  </el-drawer>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  deployHistoryLogs: { type: Array, default: () => [] },
});
const emit = defineEmits(["close"]);
</script>

<style lang="less" scoped>
.log-line {
  font-family: monospace;
  line-height: 1.6;
  word-break: break-all;
}
</style>
