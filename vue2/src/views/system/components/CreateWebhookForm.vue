<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="Webhook名称" prop="webhookName">
      <el-input v-model="form.webhookName" placeholder="请输入Webhook名称" />
    </el-form-item>

    <el-form-item label="Webhook URL" prop="webhookUrl">
      <el-input v-model="form.webhookUrl" placeholder="请输入Webhook URL" />
    </el-form-item>

    <el-form-item label="Webhook类型" prop="webhookType">
      <el-select v-model="form.webhookType" placeholder="请选择Webhook类型" style="width: 100%">
        <el-option label="钉钉" value="10" />
      </el-select>
    </el-form-item>

    <el-form-item label="Webhook 签名" prop="webhookConfig">
      <el-input v-model="form.webhookConfig" placeholder="请输入Webhook 签名配置" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">
        {{ initialValues ? "更新" : "保存" }}
      </el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: "CreateWebhookForm",
  props: {
    // 编辑时的初始值
    initialValues: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      form: {
        webhookName: "",
        webhookUrl: "",
        webhookType: "",
        webhookConfig: "",
      },
      rules: {
        webhookName: [{ required: true, message: "请输入Webhook名称", trigger: "blur" }],
        webhookUrl: [{ required: true, message: "请输入Webhook URL", trigger: "blur" }],
        webhookType: [{ required: true, message: "请选择Webhook类型", trigger: "change" }],
      },
    };
  },
  created() {
    if (this.initialValues) {
      this.form = {
        webhookName: this.initialValues.webhookName,
        webhookUrl: this.initialValues.webhookUrl,
        webhookType: this.initialValues.webhookType,
        webhookConfig: this.initialValues.webhookConfig,
      };
    }
  },
  methods: {
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.$emit("save", { ...this.form });
      });
    },
  },
};
</script>
