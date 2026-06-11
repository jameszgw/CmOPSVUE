<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="脚本名称" prop="templateName">
      <el-input v-model="form.templateName" placeholder="请输入脚本名称" />
    </el-form-item>

    <el-form-item label="脚本内容" prop="templateValue">
      <el-input
        v-model="form.templateValue"
        type="textarea"
        :rows="20"
        placeholder="请输入脚本内容"
      />
    </el-form-item>

    <el-form-item label="脚本描述" prop="description">
      <el-input v-model="form.description" placeholder="请输入脚本描述" />
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
  name: "CreateScriptForm",
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
        templateName: "",
        templateValue: "",
        description: "",
      },
      rules: {
        templateName: [{ required: true, message: "请输入脚本名称", trigger: "blur" }],
        templateValue: [{ required: true, message: "请输入脚本内容", trigger: "blur" }],
        description: [{ required: true, message: "请输入脚本描述", trigger: "blur" }],
      },
    };
  },
  created() {
    if (this.initialValues) {
      this.form = {
        templateName: this.initialValues.templateName,
        templateValue: this.initialValues.templateValue,
        description: this.initialValues.description,
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
