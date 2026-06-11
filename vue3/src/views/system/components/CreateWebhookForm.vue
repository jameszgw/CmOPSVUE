<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
    <el-form-item label="Webhook名称" prop="webhookName">
      <el-input v-model="formData.webhookName" placeholder="请输入Webhook名称" />
    </el-form-item>

    <el-form-item label="Webhook URL" prop="webhookUrl">
      <el-input v-model="formData.webhookUrl" placeholder="请输入Webhook URL" />
    </el-form-item>

    <el-form-item label="Webhook类型" prop="webhookType">
      <el-select
        v-model="formData.webhookType"
        placeholder="请选择Webhook类型"
        style="width: 100%"
      >
        <el-option label="钉钉" value="10" />
      </el-select>
    </el-form-item>

    <el-form-item label="Webhook 签名" prop="webhookConfig">
      <el-input
        v-model="formData.webhookConfig"
        placeholder="请输入Webhook 签名配置"
      />
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
import { ref, reactive } from "vue";

const props = defineProps({
  // 编辑时的初始值
  initialValues: { type: Object, default: null },
});

const emit = defineEmits(["save", "cancel"]);

const formRef = ref(null);

const formData = reactive({
  webhookName: props.initialValues?.webhookName || "",
  webhookUrl: props.initialValues?.webhookUrl || "",
  webhookType: props.initialValues?.webhookType || "",
  webhookConfig: props.initialValues?.webhookConfig || "",
});

const rules = {
  webhookName: [
    { required: true, message: "请输入Webhook名称", trigger: "blur" },
  ],
  webhookUrl: [
    { required: true, message: "请输入Webhook URL", trigger: "blur" },
  ],
  webhookType: [
    { required: true, message: "请选择Webhook类型", trigger: "change" },
  ],
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    emit("save", { ...formData });
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};
</script>
