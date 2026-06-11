<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="显示名称" prop="displayName">
      <el-input v-model="form.displayName" placeholder="请输入显示名称" />
    </el-form-item>
    <el-form-item label="账户类型" prop="accountType">
      <el-select v-model="form.accountType" placeholder="请选择账户类型" style="width: 100%">
        <el-option label="管理员" :value="1" />
        <el-option label="普通账户" :value="2" />
      </el-select>
    </el-form-item>
    <el-form-item label="协议" prop="protocol">
      <el-select v-model="form.protocol" placeholder="请选择协议" disabled style="width: 100%">
        <el-option label="SSH" value="SSH" />
      </el-select>
    </el-form-item>
    <el-form-item label="活跃状态" prop="active">
      <el-select v-model="form.active" placeholder="请选择活跃状态" style="width: 100%">
        <el-option label="活跃" value="1" />
        <el-option label="不活跃" value="0" />
      </el-select>
    </el-form-item>
    <el-form-item label="凭据内容" prop="credentialContent">
      <el-input v-model="form.credentialContent" type="textarea" placeholder="请输入凭据内容" />
    </el-form-item>
    <el-form-item label="密码短语" prop="passphrase">
      <el-input v-model="form.passphrase" type="password" show-password placeholder="请输入密码短语" />
    </el-form-item>
    <el-form-item label="上传文件" prop="file">
      <el-upload
        action="#"
        :auto-upload="false"
        :limit="1"
        :file-list="fileList"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
      >
        <el-button size="small" icon="el-icon-upload2">选择文件</el-button>
      </el-upload>
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
  name: "CreateServerKeyForm",
  props: {
    initialValues: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      fileList: [],
      form: this.buildForm(),
      rules: {
        displayName: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
        accountType: [{ required: true, message: "请选择账户类型", trigger: "change" }],
        protocol: [{ required: true, message: "请选择协议", trigger: "change" }],
        active: [{ required: true, message: "请选择活跃状态", trigger: "change" }],
        credentialContent: [{ required: true, message: "请输入凭据内容", trigger: "blur" }],
        passphrase: [{ required: true, message: "请输入密码短语", trigger: "blur" }],
      },
    };
  },
  watch: {
    initialValues: {
      immediate: true,
      handler() {
        this.form = this.buildForm();
        this.fileList = [];
      },
    },
  },
  methods: {
    buildForm() {
      const init = this.initialValues;
      return {
        displayName: init ? init.displayName : "",
        accountType: init ? init.accountType : null,
        protocol: init && init.protocol ? init.protocol : "SSH",
        active: init ? init.active : "",
        credentialContent: init ? init.credentialContent : "",
        passphrase: init ? init.passphrase : "",
      };
    },
    handleFileChange(file, fileList) {
      // 限制只能上传一个文件
      this.fileList = fileList.slice(-1);
    },
    handleFileRemove(file, fileList) {
      this.fileList = fileList;
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        if (this.fileList.length === 0) {
          this.$message.error("请选择要上传的文件");
          return;
        }
        const file = this.fileList[0];
        const reader = new FileReader();
        reader.readAsDataURL(file.raw);
        reader.onloadend = () => {
          const fileBase64 = reader.result;
          const pureBase64 = fileBase64.split(",")[1];
          this.$emit("save", { ...this.form }, pureBase64);
        };
      });
    },
  },
};
</script>
