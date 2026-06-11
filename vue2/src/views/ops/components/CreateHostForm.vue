<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="实例名称" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="主机名称" prop="hostName">
      <el-input v-model="form.hostName" />
    </el-form-item>
    <el-form-item label="机器组" prop="hostGroupIds">
      <el-select
        v-model="form.hostGroupIds"
        multiple
        filterable
        clearable
        placeholder="请选择机器组"
        style="width: 100%"
      >
        <el-option
          v-for="item in flattenGroups"
          :key="item.hostGroupId"
          :label="item.label"
          :value="item.hostGroupId"
        />
      </el-select>
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
          :label="proxy.proxyHost + '【' + proxy.proxyUsername + '】'"
          :value="proxy.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item label="认证模式" prop="authType">
      <el-select v-model="form.authType" placeholder="请选择认证模式" style="width: 100%">
        <el-option label="账号密码认证" :value="1" />
        <el-option label="私钥认证" :value="2" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="form.authType === 1" label="密码" prop="pwd">
      <el-input v-model="form.pwd" type="password" show-password />
    </el-form-item>
    <el-form-item v-if="form.authType === 2" label="私钥" prop="keyId">
      <el-select v-model="form.keyId" placeholder="请选择私钥" style="width: 100%">
        <el-option
          v-for="serverKey in serverKeys"
          :key="serverKey.id"
          :label="serverKey.displayName + '【' + serverKey.protocol + '】'"
          :value="serverKey.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSubmit">
        {{ initialValues ? "保存" : "提交" }}
      </el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: "CreateHostForm",
  props: {
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
  },
  data() {
    return {
      form: this.buildForm(),
      rules: {
        name: [{ required: true, message: "请输入实例名称", trigger: "blur" }],
        hostName: [{ required: true, message: "请输入主机名称", trigger: "blur" }],
        hostGroupIds: [{ required: true, message: "请选择机器组", trigger: "change" }],
        serverAddr: [{ required: true, message: "请输入服务地址", trigger: "blur" }],
        port: [{ required: true, message: "请输入端口", trigger: "blur" }],
        username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
        authType: [{ required: true, message: "请选择认证模式", trigger: "change" }],
      },
    };
  },
  computed: {
    // 把树形机器组拍平为带缩进的列表，替代 antd TreeSelect
    flattenGroups() {
      const result = [];
      const walk = (nodes, level) => {
        (nodes || []).forEach((node) => {
          result.push({
            hostGroupId: node.hostGroupId,
            label: `${"　".repeat(level)}${node.name}`,
          });
          if (node.children && node.children.length > 0) {
            walk(node.children, level + 1);
          }
        });
      };
      walk(this.hostGroups, 0);
      return result;
    },
  },
  watch: {
    initialValues: {
      immediate: true,
      handler() {
        this.form = this.buildForm();
      },
    },
  },
  methods: {
    buildForm() {
      const init = this.initialValues;
      return {
        name: init ? init.name : "",
        hostName: init ? init.hostName : "",
        hostGroupIds: init && init.groups ? init.groups.map((g) => g.hostGroupId) : [],
        serverAddr: init ? init.serverAddr : "",
        port: init ? init.port : null,
        proxyId: init ? init.proxyId : null,
        username: init ? init.username : "",
        authType: init ? init.authType : 1,
        pwd: init ? init.pwd : "",
        keyId: init ? init.keyId : null,
      };
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        const values = { ...this.form };
        if (this.initialValues) {
          this.$emit("update", values);
        } else {
          this.$emit("submit", values);
        }
        this.$refs.form.resetFields();
      });
    },
  },
};
</script>
