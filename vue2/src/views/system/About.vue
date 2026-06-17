<template>
  <screen-page title="关于" gap="8px">
    <card-grid min="360px" gap="8px" class="grid">
      <section-card dense title="平台信息" icon="el-icon-info">
        <el-descriptions v-if="about" :column="1" :colon="false" size="small">
          <el-descriptions-item label="CmOPS 平台版本">
            <span class="about-value">{{ about.version }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="CmOPS 工具集版本">
            <span class="about-value">{{ about.kitVersion }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="维护团队">
            <span class="about-value">CmOPS Team</span>
          </el-descriptions-item>
        </el-descriptions>
      </section-card>

      <section-card dense title="链接" icon="el-icon-link">
        <el-descriptions v-if="about" :column="1" :colon="false" size="small">
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
      </section-card>
    </card-grid>
  </screen-page>
</template>

<script>
import { getSystemAbout } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";

export default {
  name: "About",
  components: { ScreenPage, SectionCard, CardGrid },
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
.grid {
  align-content: start;
}
.about-value {
  color: #1890ff;
  text-decoration: none;
}
</style>
