<template>
  <ScreenPage title="关于" gap="8px">
    <div class="about-body">
      <CardGrid min="320px" gap="8px" class="about-grid">
        <SectionCard dense title="版本信息" icon="InfoFilled">
          <el-descriptions v-if="about" :column="1" size="small">
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
        </SectionCard>

        <SectionCard dense title="链接" icon="Link">
          <el-descriptions v-if="about" :column="1" size="small">
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
        </SectionCard>
      </CardGrid>
    </div>
  </ScreenPage>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getSystemAbout } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";

const about = ref(null);

onMounted(async () => {
  const res = await getSystemAbout();
  about.value = res.content;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.about-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.about-grid {
  align-content: start;
}

.about-value {
  color: var(--cm-color-primary);
  text-decoration: none;
}
</style>
