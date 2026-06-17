<template>
  <ScreenPage title="安全配置" gap="8px">
    <div class="sec-body">
      <CardGrid min="320px" gap="8px" class="sec-grid">
        <SectionCard dense title="登录策略" icon="User">
          <el-form :model="formData" label-width="160px" label-position="left">
            <el-form-item label="允许多端登陆">
              <el-switch
                v-model="formData.allowMultipleLogin"
                :loading="loading"
                @change="(val) => handleUpdate('allowMultipleLogin', val)"
              />
              <div class="help-text">
                开启后一个账号可以多个设备同时登陆, 其他设备强制登陆后不会强制下线
              </div>
            </el-form-item>

            <el-form-item label="登录失败锁定">
              <el-switch
                v-model="formData.loginFailureLock"
                :loading="loading"
                @change="(val) => handleUpdate('loginFailureLock', val)"
              />
              <div class="help-text">
                开启后同个账号多次登陆失败后将会锁定账号无法继续登陆
              </div>
            </el-form-item>

            <el-form-item label="登录IP绑定">
              <el-switch
                v-model="formData.loginIpBind"
                :loading="loading"
                @change="(val) => handleUpdate('loginIpBind', val)"
              />
              <div class="help-text">
                开启后登陆凭证和IP进行绑定, 其他IP使用此登陆凭证则无法访问
              </div>
            </el-form-item>

            <el-form-item label="登录凭证自动续签">
              <el-switch
                v-model="formData.loginTokenAutoRenew"
                :loading="loading"
                @change="(val) => handleUpdate('loginTokenAutoRenew', val)"
              />
              <div class="help-text">
                登录凭证自动续签，当登录凭证过期后，自动续签，避免频繁登录
              </div>
            </el-form-item>
          </el-form>
        </SectionCard>

        <SectionCard dense title="阈值配置" icon="SetUp">
          <el-form :model="formData" label-width="160px" label-position="left">
            <el-form-item label="凭证有效期(时)">
              <el-input
                v-model="formData.loginTokenExpire"
                type="number"
                @blur="handleNumberBlur('loginTokenExpire')"
              />
              <div class="help-text">
                设置登陆凭证有效期时长(时), 设置后下次登陆生效
              </div>
            </el-form-item>

            <el-form-item label="登录失败锁定阈值">
              <el-input
                v-model="formData.loginFailureLockThreshold"
                type="number"
                @blur="handleNumberBlur('loginFailureLockThreshold')"
              />
              <div class="help-text">
                设置登陆失败锁定阈值, 达到该值后账号会被锁定, 设置后下次登陆生效
              </div>
            </el-form-item>

            <el-form-item label="登录自动续签阈值">
              <el-input
                v-model="formData.loginTokenAutoRenewThreshold"
                type="number"
                @blur="handleNumberBlur('loginTokenAutoRenewThreshold')"
              />
              <div class="help-text">登陆凭证自动续签间隔(时)</div>
            </el-form-item>
          </el-form>
        </SectionCard>
      </CardGrid>
    </div>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getSystemOption, updateOption } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";

const loading = ref(false);

const formData = reactive({
  allowMultipleLogin: false,
  loginFailureLock: false,
  loginIpBind: false,
  loginTokenAutoRenew: false,
  loginTokenExpire: null,
  loginFailureLockThreshold: null,
  loginTokenAutoRenewThreshold: null,
});

const fetchSecurityConfig = async () => {
  const res = await getSystemOption();
  Object.assign(formData, res.content || {});
};

const handleUpdate = async (optionKey, value) => {
  loading.value = true;
  try {
    await updateOption({ option: optionKey, value });
    ElMessage.success("配置更新成功");
  } finally {
    loading.value = false;
  }
};

const handleNumberBlur = (optionKey) => {
  const value = parseInt(formData[optionKey], 10);
  if (!isNaN(value)) {
    handleUpdate(optionKey, value);
  }
};

onMounted(() => {
  fetchSecurityConfig();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.sec-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.sec-grid {
  align-content: start;
}

.help-text {
  width: 100%;
  color: var(--cm-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
