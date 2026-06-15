<template>
  <div class="page-container">
    <el-card>
      <div class="about-container">
        <div class="other-title">关于</div>
        <div class="about-descriptions">
          <el-descriptions v-if="about" :column="1">
            <el-descriptions-item label="CmOPS 平台版本">
              <span class="about-value">{{ about.version }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="CmOPS 工具集版本">
              <span class="about-value">{{ about.kitVersion }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="维护团队">
              <span class="about-value">CmOPS Team</span>
            </el-descriptions-item>
            <el-descriptions-item label="github 地址">
              <a
                class="about-value"
                :href="about.github || '#'"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ about.github || "—" }}
              </a>
            </el-descriptions-item>
            <el-descriptions-item label="问题反馈">
              <a
                class="about-value"
                :href="about.issues || '#'"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ about.issues || "—" }}
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
