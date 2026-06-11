<template>
  <el-drawer
    title="添加环境"
    size="500px"
    :model-value="open"
    destroy-on-close
    @close="emit('close')"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="环境名称" prop="envName">
        <el-input v-model="form.envName" placeholder="请输入环境名称" />
      </el-form-item>
      <el-form-item label="环境类型" prop="env">
        <el-select v-model="form.env" placeholder="请选择环境类型" style="width: 100%">
          <el-option label="测试" value="TEST" />
          <el-option label="预发" value="PRE" />
          <el-option label="线上" value="PROD" />
        </el-select>
      </el-form-item>
      <el-form-item label="自定义构建脚本" prop="customBuildScript">
        <el-input
          v-model="form.customBuildScript"
          type="textarea"
          placeholder="自定义构建脚本（mvn clean package -Ptest -U -DskipTest）"
        />
      </el-form-item>
      <el-form-item label="选择集群" prop="clusterId">
        <el-select v-model="form.clusterId" placeholder="请选择集群" style="width: 100%">
          <el-option
            v-for="cluster in clusterList"
            :key="cluster.clusterId"
            :label="`${cluster.clusterName}(${cluster.clusterType})`"
            :value="cluster.clusterId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="副本数" prop="replicas">
        <el-input v-model="form.replicas" type="number" placeholder="请输入副本数" />
      </el-form-item>
      <el-form-item label="cpu资源" prop="cpu">
        <el-input v-model="form.cpu" placeholder="请输入cpu资源" />
      </el-form-item>
      <el-form-item label="最大cpu资源" prop="maxCpu">
        <el-input v-model="form.maxCpu" placeholder="请输入最大cpu资源" />
      </el-form-item>
      <el-form-item label="内存资源" prop="memory">
        <el-input v-model="form.memory" placeholder="请输入内存资源(500M)" />
      </el-form-item>
      <el-form-item label="最大内存资源" prop="maxMemory">
        <el-input v-model="form.maxMemory" placeholder="请输入最大内存资源(500M)" />
      </el-form-item>
      <el-form-item label="是否需要发布审批" prop="needApproval">
        <el-radio-group v-model="form.needApproval">
          <el-radio :value="false">否</el-radio>
          <el-radio :value="true">是</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="是否自动扩容" prop="autoScaling">
        <el-radio-group v-model="form.autoScaling">
          <el-radio :value="false">否</el-radio>
          <el-radio :value="true">是</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script setup>
import { reactive, ref } from "vue";

defineProps({
  open: { type: Boolean, default: false },
  clusterList: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "finish"]);

const formRef = ref(null);

const form = reactive({
  envName: "",
  env: "",
  customBuildScript: "",
  clusterId: "",
  replicas: "",
  cpu: "",
  maxCpu: "",
  memory: "",
  maxMemory: "",
  needApproval: false,
  autoScaling: false,
});

const rules = {
  envName: [{ required: true, message: "请输入环境名称", trigger: "blur" }],
  env: [{ required: true, message: "请选择环境类型", trigger: "change" }],
  customBuildScript: [{ required: true, message: "自定义构建脚本", trigger: "blur" }],
  clusterId: [{ required: true, message: "请选择集群", trigger: "change" }],
  replicas: [{ required: true, message: "请输入副本数", trigger: "blur" }],
  needApproval: [{ required: true, message: "请选择是否需要发布审批", trigger: "change" }],
  autoScaling: [{ required: true, message: "请选择是否自动扩容", trigger: "change" }],
};

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) return;
    emit("finish", { ...form, replicas: Number(form.replicas) });
  });
};
</script>

<style lang="less" scoped></style>
