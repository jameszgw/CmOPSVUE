<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
    <el-form-item label="实例名称" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="主机名称" prop="hostName">
      <el-input v-model="form.hostName" />
    </el-form-item>
    <el-form-item label="机器组" prop="hostGroupIds">
      <el-tree-select
        v-model="form.hostGroupIds"
        :data="hostGroups"
        node-key="hostGroupId"
        :props="{ label: 'name', children: 'children' }"
        placeholder="请选择机器组"
        multiple
        filterable
        clearable
        check-strictly
        default-expand-all
        style="width: 100%"
      />
    </el-form-item>
    <el-form-item label="服务地址" prop="serverAddr">
      <el-input v-model="form.serverAddr" />
    </el-form-item>
    <el-form-item label="端口" prop="port">
      <el-input v-model.number="form.port" type="number" />
    </el-form-item>
    <el-form-item label="机器代理" prop="proxyId">
      <el-select v-model="form.proxyId" placeholder="请选择机器代理" clearable style="width: 100%">
        <el-option
          v-for="proxy in machineProxies"
          :key="proxy.id"
          :value="proxy.id"
          :label="proxy.proxyHost + '【' + proxy.proxyUsername + '】'"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item label="认证模式" prop="authType">
      <el-select v-model="form.authType" placeholder="请选择认证模式" style="width: 100%">
        <el-option :value="1" label="账号密码认证" />
        <el-option :value="2" label="私钥认证" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="form.authType === 1" label="密码" prop="pwd">
      <el-input v-model="form.pwd" type="password" show-password />
    </el-form-item>
    <el-form-item v-if="form.authType === 2" label="私钥" prop="keyId">
      <el-select v-model="form.keyId" placeholder="请选择私钥" clearable style="width: 100%">
        <el-option
          v-for="serverKey in serverKeys"
          :key="serverKey.id"
          :value="serverKey.id"
          :label="serverKey.displayName + '【' + serverKey.protocol + '】'"
        />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">
        {{ initialValues ? "保存" : "提交" }}
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
  hostGroups: {
    type: Array,
    default: () => [],
  },
  machineProxies: {
    type: Array,
    default: () => [],
  },
  serverKeys: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["submit", "update", "cancel"]);

const formRef = ref(null);

const defaultForm = () => ({
  name: "",
  hostName: "",
  hostGroupIds: [],
  serverAddr: "",
  port: 22,
  proxyId: undefined,
  username: "",
  authType: 1,
  pwd: "",
  keyId: undefined,
});

const form = reactive(defaultForm());

const rules = {
  name: [{ required: true, message: "请输入实例名称", trigger: "blur" }],
  hostName: [{ required: true, message: "请输入主机名称", trigger: "blur" }],
  hostGroupIds: [{ required: true, message: "请选择机器组", trigger: "change" }],
  serverAddr: [{ required: true, message: "请输入服务地址", trigger: "blur" }],
  port: [{ required: true, message: "请输入端口", trigger: "blur" }],
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  authType: [{ required: true, message: "请选择认证模式", trigger: "change" }],
};

watch(
  () => props.initialValues,
  (val) => {
    Object.assign(form, defaultForm());
    if (val) {
      Object.assign(form, {
        ...val,
        hostGroupIds: (val.groups || []).map((group) => group.hostGroupId),
      });
    }
  },
  { immediate: true }
);

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return;
    }
    const values = { ...form };
    if (props.initialValues) {
      emit("update", values);
    } else {
      emit("submit", values);
    }
  });
};
</script>
