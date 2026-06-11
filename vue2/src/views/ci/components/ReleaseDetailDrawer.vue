<template>
  <el-drawer title="发布单详情" :visible="visible" size="600px" @close="$emit('close')">
    <div v-if="release" class="drawer-body">
      <el-descriptions title="基础信息" :column="1" border :label-style="{ width: '160px' }">
        <el-descriptions-item label="发布单号">
          {{ release.releaseNo }}
          <i class="el-icon-document-copy copy-icon" @click="copyText(release.releaseNo)" />
        </el-descriptions-item>
        <el-descriptions-item label="预计发布时间">{{ formatTime(release.releaseDate) }}</el-descriptions-item>
        <el-descriptions-item label="发布分支">{{ release.releaseBranch }}</el-descriptions-item>
        <el-descriptions-item label="发布版本">{{ release.releaseVersion }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(release.gmtCreate) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(release.gmtModified) }}</el-descriptions-item>
        <el-descriptions-item label="发布状态">
          {{ getReleaseStatusText(release.releaseStatus) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 审批详情 -->
      <el-descriptions
        v-if="release.approvalDTO"
        class="approval-block"
        title="审批单详情"
        :column="1"
        border
        :label-style="{ width: '160px' }"
      >
        <el-descriptions-item label="发布单号">
          {{ release.approvalDTO.approvalId }}
          <i class="el-icon-document-copy copy-icon" @click="copyText(release.approvalDTO.approvalId)" />
        </el-descriptions-item>
        <el-descriptions-item label="发起时间">
          {{ formatTime(release.approvalDTO.changeDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="文档地址">{{ release.approvalDTO.docAddress }}</el-descriptions-item>
        <el-descriptions-item label="审批状态">
          {{ getApprovalStatusText(release.approvalDTO.approvalStatus) }}
        </el-descriptions-item>
      </el-descriptions>

      <el-button style="margin-top: 16px" @click="$emit('close')">关闭</el-button>
    </div>
  </el-drawer>
</template>

<script>
import dayjs from "dayjs";
import {
  getReleaseStatusText,
  getApprovalStatusText,
  copyToClipboard,
} from "@/utils/release-utils";

export default {
  name: "ReleaseDetailDrawer",
  props: {
    visible: { type: Boolean, default: false },
    release: { type: Object, default: null },
  },
  methods: {
    getReleaseStatusText,
    getApprovalStatusText,
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "--";
    },
    copyText(text) {
      copyToClipboard(String(text)).then(() => this.$message.success("复制成功"));
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px 20px;
}
.approval-block {
  margin-top: 16px;
}
.copy-icon {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
}
</style>
