<template>
  <div class="unsupported-wrap">
    <slot />
    <div v-if="unsupported" class="unsupported-mask">
      <div class="unsupported-mask__box">
        <el-icon class="unsupported-mask__icon"><Lock /></el-icon>
        <div class="unsupported-mask__title">{{ title }}</div>
        <div class="unsupported-mask__reason">{{ reason || "该指标在当前设备/采集方式下不可用" }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Lock } from "@element-plus/icons-vue";

defineProps({
  // 为 true 时覆盖遮罩层
  unsupported: { type: Boolean, default: false },
  // 不支持的真实原因（简述）
  reason: { type: String, default: "" },
  title: { type: String, default: "该指标暂不支持" },
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.unsupported-wrap {
  position: relative;
  min-height: 120px;
}

.unsupported-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 半透明毛玻璃遮罩：盖住下方占位内容，又能透出轮廓 */
  background: var(--cm-bg-card);
  background: color-mix(in srgb, var(--cm-bg-card) 78%, transparent);
  backdrop-filter: blur(2px);
  border-radius: @radius-lg;
  z-index: 5;

  &__box {
    text-align: center;
    max-width: 420px;
    padding: 16px 24px;
  }

  &__icon {
    font-size: 30px;
    color: var(--cm-text-placeholder);
  }

  &__title {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-regular);
  }

  &__reason {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--cm-text-secondary);
  }
}
</style>
