<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="代理主机" prop="proxyHost">
      <el-input v-model="form.proxyHost" placeholder="请输入代理主机" />
    </el-form-item>
    <el-form-item label="代理端口" prop="proxyPort">
      <el-input v-model.number="form.proxyPort" type="number" placeholder="请输入代理端口" />
    </el-form-item>
    <el-form-item label="代理类型" prop="proxyType">
      <el-select v-model="form.proxyType" placeholder="请选择代理类型" style="width: 100%">
        <el-option label="HTTP" :value="1" />
        <el-option label="HTTPS" :value="2" />
      </el-select>
    </el-form-item>
    <el-form-item label="代理用户名" prop="proxyUsername">
      <el-input v-model="form.proxyUsername" placeholder="请输入代理用户名" />
    </el-form-item>
    <el-form-item label="代理密码" prop="proxyPassword">
      <el-input v-model="form.proxyPassword" type="password" show-password placeholder="请输入代理密码" />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        :maxlength="30"
        placeholder="请输入描述"
      />
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
  name: "CreateProxyForm",
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
        proxyHost: [{ required: true, message: "请输入代理主机", trigger: "blur" }],
        proxyPort: [{ required: true, message: "请输入代理端口", trigger: "blur" }],
        proxyType: [{ required: true, message: "请选择代理类型", trigger: "change" }],
        proxyUsername: [{ required: true, message: "请输入代理用户名", trigger: "blur" }],
        proxyPassword: [{ required: true, message: "请输入代理密码", trigger: "blur" }],
        description: [{ max: 30, message: "请输入不超过30个字符的描述", trigger: "blur" }],
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
        proxyHost: init ? init.proxyHost : "",
        proxyPort: init ? init.proxyPort : null,
        proxyType: init ? init.proxyType : null,
        proxyUsername: init ? init.proxyUsername : "",
        proxyPassword: init ? init.proxyPassword : "",
        description: init ? init.description : "",
      };
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        const values = { ...this.form };
        if (this.initialValues) {
          this.$emit("update", values);
        } else {
          this.$emit("save", values);
        }
      });
    },
  },
};
</script>
