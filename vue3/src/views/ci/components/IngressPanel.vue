<template>
  <div class="ingress-panel">
    <el-button type="primary" class="edit-btn" @click="handleEdit">编辑 Ingress</el-button>

    <el-card class="ingress-card">
      <template #header>{{ ingress?.ingressName }}</template>
      <el-card
        v-for="(rule, index) in ingress?.rules || []"
        :key="index"
        shadow="never"
        class="rule-card"
      >
        <template #header>Rule {{ index + 1 }}</template>
        <div><strong>Host:</strong> {{ rule.host }}</div>
        <div><strong>Paths:</strong></div>
        <div v-for="(path, pathIndex) in rule.paths || []" :key="pathIndex" class="path-item">
          <div><strong>Path Type:</strong> {{ path.pathType }}</div>
          <div><strong>Path:</strong> {{ path.path }}</div>
          <div><strong>Service Name:</strong> {{ path.backend?.serviceName }}</div>
          <div><strong>Service Port:</strong> {{ path.backend?.servicePort }}</div>
        </div>
      </el-card>
    </el-card>

    <el-dialog v-model="modelOpen" width="800px" title="编辑 Ingress" append-to-body>
      <el-form :model="form" label-width="120px">
        <el-form-item
          label="Ingress 名称"
          prop="ingressName"
          :rules="[{ required: true, message: '请输入 Ingress 名称!' }]"
        >
          <el-input v-model="form.ingressName" disabled />
        </el-form-item>

        <el-card
          v-for="(rule, ruleIndex) in form.rules"
          :key="ruleIndex"
          shadow="never"
          class="rule-card"
        >
          <template #header>
            <div class="rule-header">
              <span>Rule {{ ruleIndex + 1 }}</span>
              <el-icon class="remove-icon" @click="removeRule(ruleIndex)"><Close /></el-icon>
            </div>
          </template>
          <el-form-item label="host">
            <el-input v-model="rule.host" />
          </el-form-item>
          <el-form-item label="http">
            <div class="paths-wrap">
              <div v-for="(path, pathIndex) in rule.paths" :key="pathIndex" class="path-row">
                <el-select v-model="path.pathType" placeholder="路径类型" style="width: 110px">
                  <el-option label="Exact" value="Exact" />
                  <el-option label="Prefix" value="Prefix" />
                </el-select>
                <el-input v-model="path.path" placeholder="path" style="width: 140px" />
                <el-input
                  v-model="path.backend.serviceName"
                  placeholder="serviceName"
                  style="width: 160px"
                />
                <el-input
                  v-model="path.backend.servicePort"
                  placeholder="servicePort"
                  style="width: 120px"
                />
                <el-icon class="remove-icon" @click="removePath(rule, pathIndex)">
                  <Close />
                </el-icon>
              </div>
              <el-button class="dashed-btn" @click="addPath(rule)">+ 添加Path</el-button>
            </div>
          </el-form-item>
        </el-card>

        <el-button class="dashed-btn add-rule-btn" @click="addRule">+ 添加规则</el-button>

        <pre class="preview">{{ JSON.stringify(form, null, 2) }}</pre>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { saveIngress } from "@/api/app";

const props = defineProps({
  ingress: { type: Object, default: () => ({}) },
  appName: { type: String, default: "" },
  selectedEnvironment: { type: String, default: null },
});

const modelOpen = ref(false);

const form = reactive({
  ingressName: "",
  rules: [],
});

const handleEdit = () => {
  form.ingressName = props.ingress?.ingressName ?? props.appName;
  form.rules = JSON.parse(JSON.stringify(props.ingress?.rules || []));
  modelOpen.value = true;
};

const handleCancel = () => {
  modelOpen.value = false;
};

const addRule = () => {
  form.rules.push({ host: "", paths: [] });
};

const removeRule = (index) => {
  form.rules.splice(index, 1);
};

const addPath = (rule) => {
  if (!rule.paths) rule.paths = [];
  rule.paths.push({
    pathType: "",
    path: "",
    backend: { serviceName: "", servicePort: "" },
  });
};

const removePath = (rule, index) => {
  rule.paths.splice(index, 1);
};

const handleSave = async () => {
  if (!form.ingressName) {
    ElMessage.warning("请输入 Ingress 名称!");
    return;
  }
  await saveIngress({
    envId: props.selectedEnvironment,
    ingressDTO: {
      ingressName: form.ingressName,
      rules: form.rules,
    },
  });
  modelOpen.value = false;
  ElMessage.success("保存成功");
};
</script>

<style lang="less" scoped>
.ingress-panel {
  .edit-btn {
    margin-bottom: 16px;
  }
  .ingress-card {
    width: 100%;
  }
  .rule-card {
    margin-bottom: 16px;
  }
  .rule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .remove-icon {
    cursor: pointer;
  }
  .paths-wrap {
    display: flex;
    flex-direction: column;
    row-gap: 16px;
    width: 100%;
  }
  .path-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .path-item {
    margin-bottom: 8px;
  }
  .dashed-btn {
    width: 100%;
    border-style: dashed;
  }
  .add-rule-btn {
    margin-bottom: 16px;
  }
  .preview {
    background: #f7f7f7;
    padding: 8px;
    max-height: 200px;
    overflow: auto;
  }
}
</style>
