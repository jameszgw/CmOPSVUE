<template>
  <el-drawer
    :model-value="createClusterVisible"
    title="新增集群"
    size="400px"
    @close="emit('close')"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="集群名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="连接字符串" prop="connectString">
        <el-input v-model="form.connectString" />
      </el-form-item>
      <el-form-item label="令牌" prop="token">
        <el-input v-model="form.token" />
      </el-form-item>
      <el-form-item label="集群类型" prop="clusterType">
        <el-select v-model="form.clusterType" placeholder="请选择集群类型" style="width: 100%">
          <el-option value="k8s" label="K8S" />
          <el-option value="aliyun" label="阿里云" />
          <el-option value="tencent" label="腾讯云" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-space wrap>
          <el-tag
            v-for="tag in tags"
            :key="tag"
            closable
            @close="handleTagClose(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-model="newTag"
            style="width: 100px"
            @keyup.enter="handleTagAdd"
          />
          <el-button type="primary" @click="handleTagAdd">添加标签</el-button>
        </el-space>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleTestConnection">测试连接</el-button>
        <el-button type="primary" :disabled="!isConnectionTested" @click="handleSubmit">
          添加集群
        </el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script setup>
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  createClusterVisible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "connect", "close"]);

const formRef = ref(null);
const tags = ref([]);
const newTag = ref("");
const isConnectionTested = ref(false);

const form = reactive({
  name: "",
  connectString: "",
  token: "",
  clusterType: undefined,
});

const rules = {
  name: [{ required: true, message: "请输入集群名称", trigger: "blur" }],
  connectString: [{ required: true, message: "请输入连接字符串", trigger: "blur" }],
  token: [{ required: true, message: "请输入令牌", trigger: "blur" }],
  clusterType: [{ required: true, message: "请选择集群类型", trigger: "change" }],
};

const handleTestConnection = () => {
  formRef.value.validateField(["connectString", "token", "clusterType"], (valid) => {
    if (!valid) {
      ElMessage.error("连接测试失败，请检查输入信息");
      return;
    }
    emit("connect", {
      connectString: form.connectString,
      token: form.token,
      clusterType: form.clusterType,
    });
    isConnectionTested.value = true;
    ElMessage.success("连接测试成功");
  });
};

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) {
      return;
    }
    emit("submit", { ...form, tags: tags.value });
    formRef.value.resetFields();
    tags.value = [];
    isConnectionTested.value = false;
  });
};

const handleTagClose = (removedTag) => {
  tags.value = tags.value.filter((tag) => tag !== removedTag);
};

const handleTagAdd = () => {
  if (newTag.value && !tags.value.includes(newTag.value)) {
    tags.value.push(newTag.value);
    newTag.value = "";
  }
};
</script>
