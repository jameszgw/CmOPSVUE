<template>
  <el-drawer title="新增秘钥" :visible="visible" size="600px" @close="$emit('close')">
    <div class="drawer-body">
      <el-form ref="form" :model="form" :rules="rules" label-position="top">
        <el-form-item label="显示名称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="请输入显示名称" />
        </el-form-item>
        <el-form-item label="账户类型" prop="accountType">
          <el-radio-group v-model="form.accountType">
            <el-radio label="0">普通账户</el-radio>
            <el-radio label="1">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="协议" prop="protocol">
          <el-input v-model="form.protocol" disabled />
        </el-form-item>
        <el-form-item label="活跃状态" prop="active">
          <el-select v-model="form.active" placeholder="请选择活跃状态" style="width: 100%">
            <el-option label="活跃" :value="true" />
            <el-option label="不活跃" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :file-list="fileList"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <i class="el-icon-upload" />
            <div class="el-upload__text">点击或拖拽文件到此处上传</div>
            <div slot="tip" class="el-upload__tip">
              仅支持单个文件上传，支持 .txt, .json, .jpg 文件格式
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="凭据内容" prop="credential">
          <el-input v-model="form.credential" type="textarea" placeholder="请输入凭据内容" />
        </el-form-item>
        <el-form-item label="密码短语" prop="passphrase">
          <el-input
            v-model="form.passphrase"
            type="password"
            show-password
            placeholder="请输入密码短语"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "CreateServerKey",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    servers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      fileList: [],
      fileBase64: "",
      form: {
        displayName: "",
        accountType: "0",
        protocol: "SSH",
        active: null,
        credential: "",
        passphrase: "",
      },
      rules: {
        displayName: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
        accountType: [{ required: true, message: "请选择账户类型", trigger: "change" }],
        protocol: [{ required: true, message: "请选择协议", trigger: "change" }],
        active: [{ required: true, message: "请选择活跃状态", trigger: "change" }],
        credential: [{ required: true, message: "请输入凭据内容", trigger: "blur" }],
        passphrase: [{ required: true, message: "请输入密码短语", trigger: "blur" }],
      },
    };
  },
  methods: {
    getBase64FromFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          // 去除DataURL中的额外信息
          resolve(base64String.split(",")[1]);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    },
    async handleFileChange(file, fileList) {
      this.fileList = fileList.slice(-1);
      if (!file || !file.raw) return;
      try {
        this.fileBase64 = await this.getBase64FromFile(file.raw);
      } catch (error) {
        console.error("Failed to convert file to Base64:", error);
      }
    },
    handleFileRemove(file, fileList) {
      this.fileList = fileList;
      this.fileBase64 = "";
    },
    handleSave() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        if (this.fileList.length === 0) {
          this.$message.error("请至少选择一个文件上传");
          return;
        }
        this.$emit("save", { ...this.form }, this.fileBase64);
        this.$emit("close");
      });
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px;
}
</style>
