<template>
  <ScreenPage title="IP配置信息" gap="8px">
    <template #header-extra>
      <el-button size="small" type="primary" :loading="loading" @click="handleSubmit">
        保存
      </el-button>
    </template>

    <div class="ip-body">
      <CardGrid min="320px" gap="8px" class="ip-grid">
        <SectionCard dense title="当前IP信息" icon="Location">
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="当前访问IP">
              <span class="ip-value">{{ formData.currentIp || "未知" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="IP位置">
              <span class="ip-value">{{ formData.ipLocation || "未知" }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </SectionCard>

        <SectionCard dense title="访问控制" icon="Lock">
          <el-form :model="formData" label-width="80px" label-position="left">
            <el-form-item label="是否启用">
              <el-switch
                v-model="formData.enableIpFilter"
                active-text="启用"
                inactive-text="停用"
              />
              <div class="extra">
                启用后将根据配置的IP白名单和黑名单进行访问控制
              </div>
            </el-form-item>
            <el-form-item label="规则类型">
              <el-switch
                v-model="formData.enableWhiteIpList"
                active-text="白名单"
                inactive-text="黑名单"
              />
              <div class="extra">
                启用后只有白名单中的IP可以访问，否则只有黑名单中的IP不能访问
              </div>
            </el-form-item>
          </el-form>
        </SectionCard>

        <SectionCard dense title="IP黑名单" icon="CircleClose">
          <el-input
            v-model="formData.blackIpList"
            type="textarea"
            :rows="4"
            placeholder="请输入IP黑名单"
          />
          <div class="extra">
            请输入IP黑名单规则，多个则使用换行 仅支持IPv4地址.
          </div>
        </SectionCard>

        <SectionCard dense title="IP白名单" icon="CircleCheck">
          <el-input
            v-model="formData.whiteIpList"
            type="textarea"
            :rows="4"
            placeholder="请输入IP白名单"
          />
          <div class="extra">
            请输入IP白名单规则，多个则使用换行 仅支持IPv4地址.
          </div>
        </SectionCard>
      </CardGrid>
    </div>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getIpConfig, updateIpConfig } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";

const loading = ref(false);

const formData = reactive({
  currentIp: "",
  ipLocation: "",
  blackIpList: "",
  whiteIpList: "",
  enableIpFilter: false,
  enableWhiteIpList: false,
});

const fetchIpConfig = async () => {
  const res = await getIpConfig();
  Object.assign(formData, res.content || {});
};

const handleSubmit = async () => {
  loading.value = true;
  try {
    const res = await updateIpConfig({
      blackIpList: formData.blackIpList,
      whiteIpList: formData.whiteIpList,
      enableIpFilter: formData.enableIpFilter,
      enableWhiteIpList: formData.enableWhiteIpList,
    });
    if (res.content !== false) {
      ElMessage.success("IP配置更新成功");
    } else {
      ElMessage.error("IP配置更新失败");
    }
    await fetchIpConfig();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchIpConfig();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.ip-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.ip-grid {
  align-content: start;
}

.ip-value {
  color: var(--cm-color-primary);
  font-weight: 500;
}

.extra {
  width: 100%;
  color: var(--cm-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
