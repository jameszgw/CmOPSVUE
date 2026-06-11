<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="Key" prop="attrKey">
      <el-input v-model="form.attrKey" placeholder="请输入Key" />
    </el-form-item>
    <el-form-item label="Value" prop="attrValue">
      <el-input v-model="form.attrValue" placeholder="请输入Value" />
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
  name: "CreateHostEnvForm",
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
        attrKey: [{ required: true, message: "请输入Key", trigger: "blur" }],
        attrValue: [{ required: true, message: "请输入Value", trigger: "blur" }],
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
        attrKey: init ? init.attrKey : "",
        attrValue: init ? init.attrValue : "",
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
