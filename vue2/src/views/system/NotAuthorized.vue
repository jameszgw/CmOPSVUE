<template>
  <div class="exception-page">
    <h1>403</h1>
    <p>抱歉，您没有权限访问该页面。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script>
export default {
  name: "NotAuthorized",
};
</script>

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
    color: #f56c6c;
  }
}
</style>
