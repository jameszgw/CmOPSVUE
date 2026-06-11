<template>
  <div class="page-container">
    <el-card>
      <div class="ip-config-container">
        <div class="other-title">IP配置信息</div>

        <!-- 当前IP信息 -->
        <div class="ip-info-section">
          <el-descriptions :column="1">
            <el-descriptions-item label="当前访问IP">
              <span class="ip-value">{{ formData.currentIp || "未知" }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="IP位置">
              <span class="ip-value">{{ formData.ipLocation || "未知" }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- IP配置表单 -->
        <div class="ip-config-form">
          <el-form :model="formData" label-width="120px">
            <el-form-item label="IP黑名单">
              <el-input
                v-model="formData.blackIpList"
                type="textarea"
                :rows="4"
                placeholder="请输入IP黑名单"
              />
              <div class="extra">
                请输入IP黑名单规则，多个则使用换行 仅支持IPv4地址.
              </div>
            </el-form-item>

            <el-form-item label="IP白名单">
              <el-input
                v-model="formData.whiteIpList"
                type="textarea"
                :rows="4"
                placeholder="请输入IP白名单"
              />
              <div class="extra">
                请输入IP白名单规则，多个则使用换行 仅支持IPv4地址.
              </div>
            </el-form-item>

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

            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSubmit">
                保 存
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getIpConfig, updateIpConfig } from "@/api/system";

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
.ip-config-container {
  .other-title {
    margin: 16px 0;
    font-weight: 500;
    font-size: 16px;
  }

  .ip-info-section {
    margin: 18px 0 24px 0;
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 16px;
  }

  .ip-config-form {
    margin: 24px 0 0 0;
    max-width: 720px;
  }

  .ip-value {
    color: #1890ff;
    font-weight: 500;
  }

  .extra {
    width: 100%;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
    line-height: 1.5;
    margin-top: 4px;
  }
}
</style>
