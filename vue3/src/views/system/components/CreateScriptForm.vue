<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
    <el-form-item label="脚本名称" prop="templateName">
      <el-input v-model="formData.templateName" placeholder="请输入脚本名称" />
    </el-form-item>

    <el-form-item label="脚本内容" prop="templateValue">
      <el-input
        v-model="formData.templateValue"
        type="textarea"
        :rows="20"
        placeholder="请输入脚本内容"
      />
    </el-form-item>

    <el-form-item label="脚本描述" prop="description">
      <el-input v-model="formData.description" placeholder="请输入脚本描述" />
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
  templateName: props.initialValues?.templateName || "",
  templateValue: props.initialValues?.templateValue || "",
  description: props.initialValues?.description || "",
});

const rules = {
  templateName: [
    { required: true, message: "请输入脚本名称", trigger: "blur" },
  ],
  templateValue: [
    { required: true, message: "请输入脚本内容", trigger: "blur" },
  ],
  description: [{ required: true, message: "请输入脚本描述", trigger: "blur" }],
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
