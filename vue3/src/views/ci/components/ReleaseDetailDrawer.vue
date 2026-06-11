<template>
  <el-drawer
    title="发布单详情"
    size="600px"
    :model-value="visible"
    @close="emit('close')"
  >
    <template v-if="release">
      <el-descriptions title="基础信息" :column="1" border class="detail-block">
        <el-descriptions-item label="发布单号" label-class-name="detail-label">
          {{ release.releaseNo }}
          <el-icon class="copy-icon" @click="copyText(release.releaseNo)"><CopyDocument /></el-icon>
        </el-descriptions-item>
        <el-descriptions-item label="预计发布时间" label-class-name="detail-label">
          {{ formatTime(release.releaseDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="发布分支" label-class-name="detail-label">
          {{ release.releaseBranch }}
        </el-descriptions-item>
        <el-descriptions-item label="发布版本" label-class-name="detail-label">
          {{ release.releaseVersion }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" label-class-name="detail-label">
          {{ formatTime(release.gmtCreate) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间" label-class-name="detail-label">
          {{ formatTime(release.gmtModified) }}
        </el-descriptions-item>
        <el-descriptions-item label="发布状态" label-class-name="detail-label">
          {{ getReleaseStatusText(release.releaseStatus) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 审批详情 -->
      <el-descriptions
        v-if="release.approvalDTO"
        title="审批单详情"
        :column="1"
        border
        class="detail-block"
      >
        <el-descriptions-item label="发布单号" label-class-name="detail-label">
          {{ release.approvalDTO.approvalId }}
          <el-icon class="copy-icon" @click="copyText(release.approvalDTO.approvalId)">
            <CopyDocument />
          </el-icon>
        </el-descriptions-item>
        <el-descriptions-item label="发起时间" label-class-name="detail-label">
          {{ formatTime(release.approvalDTO.changeDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="文档地址" label-class-name="detail-label">
          {{ release.approvalDTO.docAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="审批状态" label-class-name="detail-label">
          {{ getApprovalStatusText(release.approvalDTO.approvalStatus) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-button class="close-btn" @click="emit('close')">关闭</el-button>
    </template>
  </el-drawer>
</template>

<script setup>
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import {
  getReleaseStatusText,
  getApprovalStatusText,
  copyToClipboard,
} from "@/utils/release-utils";

defineProps({
  visible: { type: Boolean, default: false },
  release: { type: Object, default: null },
});
const emit = defineEmits(["close"]);

const formatTime = (t) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "--");

const copyText = async (text) => {
  try {
    await copyToClipboard(text);
    ElMessage.success("复制成功");
  } catch (e) {
    ElMessage.error("复制失败");
  }
};
</script>

<style lang="less" scoped>
.detail-block {
  margin-bottom: 16px;
  :deep(.detail-label) {
    width: 160px;
  }
}
.copy-icon {
  margin-left: 4px;
  cursor: pointer;
  color: var(--el-color-primary);
  vertical-align: middle;
}
.close-btn {
  margin-top: 16px;
}
</style>
