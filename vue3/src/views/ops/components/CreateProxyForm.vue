<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="代理主机" prop="proxyHost">
      <el-input v-model="form.proxyHost" placeholder="请输入代理主机" />
    </el-form-item>
    <el-form-item label="代理端口" prop="proxyPort">
      <el-input v-model.number="form.proxyPort" type="number" placeholder="请输入代理端口" />
    </el-form-item>
    <el-form-item label="代理类型" prop="proxyType">
      <el-select v-model="form.proxyType" placeholder="请选择代理类型" style="width: 100%">
        <el-option :value="1" label="HTTP" />
        <el-option :value="2" label="HTTPS" />
      </el-select>
    </el-form-item>
    <el-form-item label="代理用户名" prop="proxyUsername">
      <el-input v-model="form.proxyUsername" placeholder="请输入代理用户名" />
    </el-form-item>
    <el-form-item label="代理密码" prop="proxyPassword">
      <el-input
        v-model="form.proxyPassword"
        type="password"
        show-password
        placeholder="请输入代理密码"
      />
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
  proxyHost: "",
  proxyPort: undefined,
  proxyType: undefined,
  proxyUsername: "",
  proxyPassword: "",
  description: "",
});

const form = reactive(defaultForm());

const rules = {
  proxyHost: [{ required: true, message: "请输入代理主机", trigger: "blur" }],
  proxyPort: [{ required: true, message: "请输入代理端口", trigger: "blur" }],
  proxyType: [{ required: true, message: "请选择代理类型", trigger: "change" }],
  proxyUsername: [{ required: true, message: "请输入代理用户名", trigger: "blur" }],
  proxyPassword: [{ required: true, message: "请输入代理密码", trigger: "blur" }],
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
