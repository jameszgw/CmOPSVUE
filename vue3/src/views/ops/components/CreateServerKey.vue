<template>
  <el-drawer
    :model-value="visible"
    title="新增秘钥"
    size="600px"
    destroy-on-close
    @close="emit('close')"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="显示名称" prop="displayName">
        <el-input v-model="form.displayName" placeholder="请输入显示名称" />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-radio-group v-model="form.accountType">
          <el-radio value="0">普通账户</el-radio>
          <el-radio value="1">管理员</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="协议" prop="protocol">
        <el-input v-model="form.protocol" disabled />
      </el-form-item>
      <el-form-item label="活跃状态" prop="active">
        <el-select v-model="form.active" placeholder="请选择活跃状态" style="width: 100%">
          <el-option :value="true" label="活跃" />
          <el-option :value="false" label="不活跃" />
        </el-select>
      </el-form-item>
      <el-form-item label="上传文件">
        <el-upload
          drag
          :auto-upload="false"
          :limit="1"
          :file-list="fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          style="width: 100%"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">点击或拖拽文件到此处上传</div>
          <template #tip>
            <div class="el-upload__tip">仅支持单个文件上传，支持 .txt, .json, .jpg 文件格式</div>
          </template>
        </el-upload>
      </el-form-item>
      <el-form-item label="凭据内容" prop="credential">
        <el-input v-model="form.credential" type="textarea" :rows="4" placeholder="请输入凭据内容" />
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
  </el-drawer>
</template>

<script setup>
import { ref, reactive } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  servers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["save", "close"]);

const formRef = ref(null);
const fileList = ref([]);
const fileBase64 = ref("");

const form = reactive({
  displayName: "",
  accountType: undefined,
  protocol: "SSH",
  active: undefined,
  credential: "",
  passphrase: "",
});

const rules = {
  displayName: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  accountType: [{ required: true, message: "请选择账户类型", trigger: "change" }],
  protocol: [{ required: true, message: "请选择协议", trigger: "change" }],
  active: [{ required: true, message: "请选择活跃状态", trigger: "change" }],
  credential: [{ required: true, message: "请输入凭据内容", trigger: "blur" }],
  passphrase: [{ required: true, message: "请输入密码短语", trigger: "blur" }],
};

const getBase64FromFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      // 去除DataURL中的额外信息
      resolve(base64String.split(",")[1]);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const handleFileChange = async (file, files) => {
  fileList.value = files.slice(-1);
  if (file.raw) {
    try {
      fileBase64.value = await getBase64FromFile(file.raw);
    } catch (error) {
      console.error("Failed to convert file to Base64:", error);
    }
  }
};

const handleFileRemove = (file, files) => {
  fileList.value = files;
  fileBase64.value = "";
};

const handleSave = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return;
    }
    emit("save", { ...form }, fileBase64.value);
    emit("close");
  });
};
</script>
