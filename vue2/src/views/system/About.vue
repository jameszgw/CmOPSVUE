<template>
  <div class="page-container">
    <el-card>
      <div class="about-container">
        <div class="other-title">关于</div>
        <div class="about-descriptions">
          <el-descriptions v-if="about" :column="1">
            <el-descriptions-item label="cake-devops-base 版本">
              <a
                class="about-value"
                :href="`https://github.com/zhongshengwang/cake-devops-ops-base/releases/tag/v${about.version}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ about.version }}
              </a>
            </el-descriptions-item>
            <el-descriptions-item label="cake-tools 版本">
              <a
                class="about-value"
                :href="`https://github.com/zhongshengwang/cake-toolkit/releases/tag/v${about.kitVersion}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ about.kitVersion }}
              </a>
            </el-descriptions-item>
            <el-descriptions-item label="cake-devops-base 作者">
              <span class="about-value">{{ about.author }} ({{ about.authorCn }})</span>
            </el-descriptions-item>
            <el-descriptions-item label="github 地址">
              <a
                class="about-value"
                href="https://github.com/zhongshengwang/cake-devops-base"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/zhongshengwang/cake-devops-base
              </a>
            </el-descriptions-item>
            <el-descriptions-item label="问题反馈">
              <a
                class="about-value"
                href="https://github.com/zhongshengwang/cake-devops-base/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/zhongshengwang/cake-devops-base/issues
              </a>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { getSystemAbout } from "@/api/system";

export default {
  name: "About",
  data() {
    return {
      about: null,
    };
  },
  async created() {
    const res = await getSystemAbout();
    this.about = res.content || null;
  },
};
</script>

<style lang="less" scoped>
.about-container {
  .other-title {
    margin: 16px 0 16px 16px;
    font-weight: 500;
    font-size: 16px;
  }

  .about-descriptions {
    margin: 18px 0 0 0;

    ::v-deep .el-descriptions-item__label {
      margin-left: 16px;
      width: 124px;
      text-align: end;
      font-size: 16px;
      color: rgba(0, 0, 0, 0.85);
    }
  }

  .about-value {
    color: #1890ff;
    text-decoration: none;
  }
}
</style>
