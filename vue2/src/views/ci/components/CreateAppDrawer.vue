<template>
  <el-drawer
    title="添加应用"
    :visible="visible"
    size="400px"
    :wrapper-closable="true"
    @close="handleClose"
  >
    <div class="drawer-body">
      <el-form ref="form" :model="form" :rules="rules" label-position="top">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select v-model="form.department" placeholder="请选择部门" clearable style="width: 100%">
            <el-option
              v-for="dep in departments"
              :key="dep.value"
              :label="dep.label"
              :value="dep.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="应用描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="仓库地址" prop="repo">
          <el-input v-model="form.repo" placeholder="请输入仓库地址" />
        </el-form-item>
        <el-form-item label="默认分支" prop="defaultBranch">
          <el-input v-model="form.defaultBranch" placeholder="请输入默认分支" />
        </el-form-item>
        <el-form-item label="开发模式" prop="developMode">
          <el-select v-model="form.developMode" placeholder="请选择开发模式" style="width: 100%">
            <el-option label="自由模式" value="FREEDOM" />
            <el-option label="标准模式" value="FLOW" />
            <el-option label="分支模式" value="BRANCH" />
          </el-select>
        </el-form-item>
        <el-form-item label="代码托管平台" prop="codePlatform">
          <el-select v-model="form.codePlatform" placeholder="代码托管平台" style="width: 100%">
            <el-option label="GITHUB" value="GITHUB" />
            <el-option label="GITLAB" value="GITLAB" />
            <el-option label="CODEUP" value="CODEUP" />
          </el-select>
        </el-form-item>
        <el-form-item label="开发语言" prop="language">
          <el-select v-model="form.language" placeholder="请选择开发语言" style="width: 100%">
            <el-option label="Java" value="JAVA" />
            <el-option label="Python" value="PYTHON" />
            <el-option label="GO" value="GO" />
            <el-option label="NodeJs" value="NodeJs" />
          </el-select>
        </el-form-item>
        <el-form-item label="健康检查地址" prop="healthCheck">
          <el-input v-model="form.healthCheck" placeholder="请输入健康检查地址 /ok" />
        </el-form-item>
        <el-form-item label="扩展配置JSON" prop="appExtend">
          <el-input v-model="form.appExtend" type="textarea" placeholder="扩展配置参数" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleCreateApp">提交</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
import { createApp } from "@/api/app";

const defaultForm = () => ({
  appName: "",
  department: "",
  description: "",
  repo: "",
  defaultBranch: "",
  developMode: "",
  codePlatform: "",
  language: "",
  healthCheck: "",
  appExtend: "",
});

export default {
  name: "CreateAppDrawer",
  props: {
    visible: { type: Boolean, default: false },
    departments: { type: Array, default: () => [] },
  },
  data() {
    return {
      form: defaultForm(),
      rules: {
        appName: [{ required: true, message: "请输入应用名称", trigger: "blur" }],
        description: [{ required: true, message: "请输入应用描述", trigger: "blur" }],
        repo: [{ required: true, message: "请输入仓库地址", trigger: "blur" }],
        defaultBranch: [{ required: true, message: "请输入默认分支", trigger: "blur" }],
        developMode: [{ required: true, message: "请选择开发模式", trigger: "change" }],
        codePlatform: [{ required: true, message: "请选择代码托管平台", trigger: "change" }],
        language: [{ required: true, message: "请选择开发语言", trigger: "change" }],
        healthCheck: [{ required: true, message: "请输入健康检查地址", trigger: "blur" }],
        appExtend: [{ required: true, message: "请输入扩展配置参数", trigger: "blur" }],
      },
    };
  },
  methods: {
    handleClose() {
      this.$refs.form && this.$refs.form.clearValidate();
      this.$emit("close");
    },
    handleCreateApp() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        const values = { ...this.form };
        // 当前登录用户作为应用 owner
        const userData = await this.$store.dispatch("user/getUserInfo");
        values.owner = userData && userData.userId;
        // 选中部门的缩写
        const selectedDepartment = this.departments.find(
          (dep) => dep.value === values.department
        );
        if (selectedDepartment) {
          values.departmentAbbr = selectedDepartment.abbr;
        }
        await createApp(values);
        this.$message.success("应用创建成功");
        this.form = defaultForm();
        this.$emit("created");
        this.$emit("close");
      });
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px 20px;
  overflow-y: auto;
  height: 100%;
}
</style>
