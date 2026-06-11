<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="Key" prop="attrKey">
      <el-input v-model="form.attrKey" placeholder="请输入Key" />
    </el-form-item>
    <el-form-item label="Value" prop="attrValue">
      <el-input v-model="form.attrValue" placeholder="请输入Value" />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入描述" />
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

const props = defineProps({
  initialValues: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["save", "update", "cancel"]);

const formRef = ref(null);

const defaultForm = () => ({
  attrKey: "",
  attrValue: "",
  description: "",
});

const form = reactive(defaultForm());

const rules = {
  attrKey: [{ required: true, message: "请输入Key", trigger: "blur" }],
  attrValue: [{ required: true, message: "请输入Value", trigger: "blur" }],
  description: [{ max: 30, message: "请输入不超过30个字符的描述", trigger: "blur" }],
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

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return;
    }
    if (props.initialValues) {
      emit("update", { ...form });
    } else {
      emit("save", { ...form });
    }
  });
};
</script>
