<template>
  <el-drawer title="发布记录日志" :visible="visible" size="1200px" @close="$emit('close')">
    <div class="drawer-body">
      <div v-for="(log, index) in deployHistoryLogs" :key="index" class="log-line">
        {{ log.time }} {{ log.message }}
      </div>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "DeployHistoryLogsDrawer",
  props: {
    visible: { type: Boolean, default: false },
    deployHistoryLogs: { type: Array, default: () => [] },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px 20px;
  height: 100%;
  overflow: auto;
}
.log-line {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 20px;
  word-break: break-all;
}
</style>
