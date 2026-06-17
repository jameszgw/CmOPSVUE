<template>
  <screen-page title="安全配置" gap="8px">
    <section-card dense scrollable class="fill" title="安全策略" icon="el-icon-lock">
      <el-form :model="form" label-width="160px" class="security-form">
        <card-grid min="380px" gap="8px">
          <el-form-item label="允许多端登陆">
            <el-switch
              v-model="form.allowMultipleLogin"
              :disabled="loading"
              @change="(checked) => handleUpdate('allowMultipleLogin', checked)"
            />
            <div class="help-text">
              开启后一个账号可以多个设备同时登陆, 其他设备强制登陆后不会强制下线
            </div>
          </el-form-item>

          <el-form-item label="登录失败锁定">
            <el-switch
              v-model="form.loginFailureLock"
              :disabled="loading"
              @change="(checked) => handleUpdate('loginFailureLock', checked)"
            />
            <div class="help-text">
              开启后同个账号多次登陆失败后将会锁定账号无法继续登陆
            </div>
          </el-form-item>

          <el-form-item label="登录IP绑定">
            <el-switch
              v-model="form.loginIpBind"
              :disabled="loading"
              @change="(checked) => handleUpdate('loginIpBind', checked)"
            />
            <div class="help-text">
              开启后登陆凭证和IP进行绑定, 其他IP使用此登陆凭证则无法访问
            </div>
          </el-form-item>

          <el-form-item label="登录凭证自动续签">
            <el-switch
              v-model="form.loginTokenAutoRenew"
              :disabled="loading"
              @change="(checked) => handleUpdate('loginTokenAutoRenew', checked)"
            />
            <div class="help-text">
              登录凭证自动续签，当登录凭证过期后，自动续签，避免频繁登录
            </div>
          </el-form-item>

          <el-form-item label="凭证有效期(时)">
            <el-input
              v-model="form.loginTokenExpire"
              type="number"
              class="number-input"
              @blur="handleNumberBlur('loginTokenExpire', $event)"
            />
            <div class="help-text">
              设置登陆凭证有效期时长(时), 设置后下次登陆生效
            </div>
          </el-form-item>

          <el-form-item label="登录失败锁定阈值">
            <el-input
              v-model="form.loginFailureLockThreshold"
              type="number"
              class="number-input"
              @blur="handleNumberBlur('loginFailureLockThreshold', $event)"
            />
            <div class="help-text">
              设置登陆失败锁定阈值, 达到该值后账号会被锁定, 设置后下次登陆生效
            </div>
          </el-form-item>

          <el-form-item label="登录自动续签阈值">
            <el-input
              v-model="form.loginTokenAutoRenewThreshold"
              type="number"
              class="number-input"
              @blur="handleNumberBlur('loginTokenAutoRenewThreshold', $event)"
            />
            <div class="help-text">登陆凭证自动续签间隔(时)</div>
          </el-form-item>
        </card-grid>
      </el-form>
    </section-card>
  </screen-page>
</template>

<script>
import { getSystemOption, updateOption } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";

export default {
  name: "SecurityConfig",
  components: { ScreenPage, SectionCard, CardGrid },
  data() {
    return {
      loading: false,
      form: {
        allowMultipleLogin: false,
        loginFailureLock: false,
        loginIpBind: false,
        loginTokenAutoRenew: false,
        loginTokenExpire: undefined,
        loginFailureLockThreshold: undefined,
        loginTokenAutoRenewThreshold: undefined,
      },
    };
  },
  created() {
    this.fetchSecurityConfig();
  },
  methods: {
    async fetchSecurityConfig() {
      const res = await getSystemOption();
      const data = res.content || {};
      Object.keys(this.form).forEach((key) => {
        if (data[key] !== undefined) {
          this.form[key] = data[key];
        }
      });
    },
    async handleUpdate(optionKey, value) {
      this.loading = true;
      try {
        await updateOption({ option: optionKey, value });
        this.$message.success("配置更新成功");
      } finally {
        this.loading = false;
      }
    },
    handleNumberBlur(optionKey, event) {
      const value = parseInt(event.target.value, 10);
      if (!isNaN(value)) {
        this.handleUpdate(optionKey, value);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.security-form /deep/ .el-form-item {
  margin-bottom: 8px;
}
.number-input {
  width: 200px;
}
.help-text {
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 1.4;
}
</style>
