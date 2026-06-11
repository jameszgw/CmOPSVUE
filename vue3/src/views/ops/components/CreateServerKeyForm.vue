<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="显示名称" prop="displayName">
      <el-input v-model="form.displayName" placeholder="请输入显示名称" />
    </el-form-item>
    <el-form-item label="账户类型" prop="accountType">
      <el-select v-model="form.accountType" placeholder="请选择账户类型" style="width: 100%">
        <el-option :value="1" label="管理员" />
        <el-option :value="2" label="普通账户" />
      </el-select>
    </el-form-item>
    <el-form-item label="协议" prop="protocol">
      <el-select v-model="form.protocol" placeholder="请选择协议" disabled style="width: 100%">
        <el-option value="SSH" label="SSH" />
      </el-select>
    </el-form-item>
    <el-form-item label="活跃状态" prop="active">
      <el-select v-model="form.active" placeholder="请选择活跃状态" style="width: 100%">
        <el-option value="1" label="活跃" />
        <el-option value="0" label="不活跃" />
      </el-select>
    </el-form-item>
    <el-form-item label="凭据内容" prop="credentialContent">
      <el-input v-model="form.credentialContent" type="textarea" :rows="4" placeholder="请输入凭据内容" />
    </el-form-item>
    <el-form-item label="密码短语" prop="passphrase">
      <el-input v-model="form.passphrase" type="password" show-password placeholder="请输入密码短语" />
    </el-form-item>
    <el-form-item label="上传文件" required>
      <el-upload
        :auto-upload="false"
        :limit="1"
        :file-list="fileList"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
      >
        <el-button :icon="Upload">选择文件</el-button>
      </el-upload>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">
        {{ initialValues ? "更新" : "保存" }}
      </el-button>
      <el-button @click="emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";

const props = defineProps({
  initialValues: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["save", "cancel"]);

const formRef = ref(null);
const fileList = ref([]);

const defaultForm = () => ({
  displayName: "",
  accountType: undefined,
  protocol: "SSH",
  active: undefined,
  credentialContent: "",
  passphrase: "",
});

const form = reactive(defaultForm());

const rules = {
  displayName: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  accountType: [{ required: true, message: "请选择账户类型", trigger: "change" }],
  protocol: [{ required: true, message: "请选择协议", trigger: "change" }],
  active: [{ required: true, message: "请选择活跃状态", trigger: "change" }],
  credentialContent: [{ required: true, message: "请输入凭据内容", trigger: "blur" }],
  passphrase: [{ required: true, message: "请输入密码短语", trigger: "blur" }],
};

watch(
  () => props.initialValues,
  (val) => {
    Object.assign(form, defaultForm());
    if (val) {
      Object.assign(form, val);
    }
  },
  { immediate: true }
);

const handleFileChange = (file, files) => {
  // 限制只能上传一个文件
  fileList.value = files.slice(-1);
};

const handleFileRemove = (file, files) => {
  fileList.value = files;
};

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return;
    }
    if (fileList.value.length === 0) {
      ElMessage.error("请选择要上传的文件");
      return;
    }
    const file = fileList.value[0];
    const reader = new FileReader();
    reader.readAsDataURL(file.raw);
    reader.onloadend = () => {
      const fileBase64 = reader.result;
      const pureBase64 = fileBase64.split(",")[1];
      emit("save", { ...form }, pureBase64);
    };
  });
};
</script>
