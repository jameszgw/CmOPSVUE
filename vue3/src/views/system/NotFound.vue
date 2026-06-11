<template>
  <div class="exception-page">
    <h1>404</h1>
    <p>抱歉，您访问的页面不存在。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup></script>

<style lang="less" scoped>
.exception-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;

  h1 {
    font-size: 64px;
    margin: 0;
    color: #1677ff;
  }
}
</style>
