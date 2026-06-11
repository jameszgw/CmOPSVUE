<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="插件地址" prop="monitorUrl">
      <el-input v-model="form.monitorUrl" />
    </el-form-item>
    <el-form-item label="Token" prop="accessToken">
      <el-input v-model="form.accessToken" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: "HostMonitorConfigForm",
  props: {
    initialValues: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      form: this.buildForm(),
      rules: {
        monitorUrl: [{ required: true, message: "请输入插件地址", trigger: "blur" }],
        accessToken: [{ required: true, message: "请输入Token", trigger: "blur" }],
      },
    };
  },
  watch: {
    initialValues: {
      immediate: true,
      handler() {
        this.form = this.buildForm();
      },
    },
  },
  methods: {
    buildForm() {
      const init = this.initialValues;
      return {
        monitorUrl: init ? init.monitorUrl : "",
        accessToken: init ? init.accessToken : "",
      };
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.$emit("submit", { ...this.form });
      });
    },
  },
};
</script>
