<template>
  <screen-page title="IP配置" gap="8px">
    <card-grid min="360px" gap="8px" class="grid fill">
      <section-card dense title="当前IP信息" icon="el-icon-position">
        <el-descriptions :column="1" :colon="false" size="small">
          <el-descriptions-item label="当前访问IP">
            <span class="ip-value">{{ (ipConfig && ipConfig.currentIp) || "未知" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="IP位置">
            <span class="ip-value">{{ (ipConfig && ipConfig.ipLocation) || "未知" }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </section-card>

      <section-card dense scrollable title="访问控制" icon="el-icon-key">
        <el-form ref="form" :model="form" label-width="100px" class="ip-form">
          <el-form-item label="IP黑名单">
            <el-input
              v-model="form.blackIpList"
              type="textarea"
              :rows="3"
              placeholder="请输入IP黑名单"
            />
            <div class="extra">请输入IP黑名单规则，多个则使用换行 仅支持IPv4地址.</div>
          </el-form-item>

          <el-form-item label="IP白名单">
            <el-input
              v-model="form.whiteIpList"
              type="textarea"
              :rows="3"
              placeholder="请输入IP白名单"
            />
            <div class="extra">请输入IP白名单规则，多个则使用换行 仅支持IPv4地址.</div>
          </el-form-item>

          <el-form-item label="是否启用">
            <el-switch
              v-model="form.enableIpFilter"
              active-text="启用"
              inactive-text="停用"
            />
            <div class="extra">启用后将根据配置的IP白名单和黑名单进行访问控制</div>
          </el-form-item>

          <el-form-item label="规则类型">
            <el-switch
              v-model="form.enableWhiteIpList"
              active-text="白名单"
              inactive-text="黑名单"
            />
            <div class="extra">
              启用后只有白名单中的IP可以访问，否则只有黑名单中的IP不能访问
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleSubmit">保 存</el-button>
          </el-form-item>
        </el-form>
      </section-card>
    </card-grid>
  </screen-page>
</template>

<script>
import { getIpConfig, updateIpConfig } from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";

export default {
  name: "IpConfig",
  components: { ScreenPage, SectionCard, CardGrid },
  data() {
    return {
      loading: false,
      ipConfig: null,
      form: {
        blackIpList: "",
        whiteIpList: "",
        enableIpFilter: false,
        enableWhiteIpList: false,
      },
    };
  },
  created() {
    this.fetchIpConfig();
  },
  methods: {
    async fetchIpConfig() {
      const res = await getIpConfig();
      this.ipConfig = res.content || {};
      this.form = {
        blackIpList: this.ipConfig.blackIpList,
        whiteIpList: this.ipConfig.whiteIpList,
        enableIpFilter: !!this.ipConfig.enableIpFilter,
        enableWhiteIpList: !!this.ipConfig.enableWhiteIpList,
      };
    },
    async handleSubmit() {
      this.loading = true;
      try {
        await updateIpConfig({ ...this.form });
        this.$message.success("IP配置更新成功");
        this.fetchIpConfig();
      } catch (e) {
        this.$message.error("IP配置更新失败");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.grid {
  align-content: start;
}
.ip-form /deep/ .el-form-item {
  margin-bottom: 10px;
}
.ip-value {
  color: #1890ff;
  font-weight: 500;
}
.extra {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}
</style>
