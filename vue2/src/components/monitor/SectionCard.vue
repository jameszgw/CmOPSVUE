<template>
  <div class="section-card">
    <div class="section-card__head">
      <i :class="['section-card__icon', icon || 'el-icon-document']"></i>
      <span class="section-card__title">{{ title }}</span>
      <div class="section-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="section-card__body">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: "SectionCard",
  props: {
    title: { type: String, default: "" },
    icon: { type: String, default: "el-icon-document" },
  },
};
</script>

<style lang="less" scoped>
.section-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 16px;

  &__head {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f2f5;
  }

  &__icon {
    color: #409eff;
    margin-right: 8px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  &__extra {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
  }

  &__body {
    padding: 16px;
  }
}
</style>
