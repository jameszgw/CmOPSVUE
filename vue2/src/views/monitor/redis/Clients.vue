<template>
  <el-empty description="正在加载..." />
</template>

<script>
export default {
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
};
</script>
