<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="插件地址" prop="monitorUrl">
      <el-input v-model="form.monitorUrl" />
    </el-form-item>
    <el-form-item label="Token" prop="accessToken">
      <el-input v-model="form.accessToken" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
      <el-button @click="emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch } from "vue";

const props = defineProps({
  initialValues: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["submit", "cancel"]);

const formRef = ref(null);

const form = reactive({
  monitorUrl: "",
  accessToken: "",
});

const rules = {
  monitorUrl: [{ required: true, message: "请输入插件地址", trigger: "blur" }],
  accessToken: [{ required: true, message: "请输入Token", trigger: "blur" }],
};

watch(
  () => props.initialValues,
  (val) => {
    form.monitorUrl = val?.monitorUrl || "";
    form.accessToken = val?.accessToken || "";
  },
  { immediate: true }
);

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return;
    }
    emit("submit", { ...form });
  });
};
</script>
