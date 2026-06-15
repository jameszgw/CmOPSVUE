<template>
  <div class="page-container terminal-page">
    <h2 class="title">终端</h2>
    <el-card shadow="never" class="terminal-card">
      <el-empty description="终端页面（原页面为空，占位页）" />
    </el-card>
  </div>
</template>

<script>
export default {
  name: "TerminalPage",
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(242, 158, 121);
}

.terminal-page {
  width: 100%;

  // 占位卡片填满布局可用宽度，并给出合理高度
  .terminal-card {
    width: 100%;

    ::v-deep .el-card__body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 420px;
    }
  }
}
</style>
