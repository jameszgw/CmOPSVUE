<template>
  <div class="page-container terminal-page">
    <el-card shadow="never" class="terminal-card">
      <el-empty description="终端页面（建设中）" />
    </el-card>
  </div>
</template>

<script setup>
// 原 React 版 terminal-page.tsx 为空文件，此处为占位页
</script>

<style lang="less" scoped>
.terminal-page {
  width: 100%;

  // 占位卡片填满布局可用宽度，并给出合理高度
  .terminal-card {
    width: 100%;

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 420px;
    }
  }
}
</style>
