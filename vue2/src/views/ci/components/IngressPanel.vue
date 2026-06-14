<template>
  <div class="ingress-panel">
    <el-button type="primary" style="margin-bottom: 16px" @click="handleEdit">
      编辑 Ingress
    </el-button>

    <el-card :header="ingress.ingressName" style="width: 100%">
      <el-card
        v-for="(rule, index) in ingress.rules || []"
        :key="index"
        class="rule-card"
        shadow="never"
      >
        <div slot="header">Rule {{ index + 1 }}</div>
        <p><strong>Host:</strong> {{ rule.host }}</p>
        <p><strong>Paths:</strong></p>
        <div v-for="(path, pathIndex) in rule.paths || []" :key="pathIndex" class="path-item">
          <strong>Path Type:</strong> {{ path.pathType }}<br />
          <strong>Path:</strong> {{ path.path }}<br />
          <strong>Service Name:</strong> {{ path.backend && path.backend.serviceName }}<br />
          <strong>Service Port:</strong> {{ path.backend && path.backend.servicePort }}<br />
        </div>
      </el-card>
    </el-card>

    <el-dialog
      title="编辑 Ingress"
      :visible.sync="modalOpen"
      width="800px"
      append-to-body
    >
      <el-form :model="form" label-width="110px">
        <el-form-item label="Ingress 名称" required>
          <el-input v-model="form.ingressName" disabled />
        </el-form-item>

        <el-card
          v-for="(rule, ruleIndex) in form.rules"
          :key="ruleIndex"
          class="rule-card"
          shadow="never"
        >
          <div slot="header" class="rule-header">
            <span>Rule {{ ruleIndex + 1 }}</span>
            <i class="el-icon-close" @click="removeRule(ruleIndex)" />
          </div>
          <el-form-item label="host">
            <el-input v-model="rule.host" />
          </el-form-item>
          <el-form-item label="http">
            <div
              v-for="(path, pathIndex) in rule.paths"
              :key="pathIndex"
              class="path-row"
            >
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
              <i class="el-icon-close" @click="removePath(rule, pathIndex)" />
            </div>
            <el-button type="text" @click="addPath(rule)">+ 添加Path</el-button>
          </el-form-item>
        </el-card>

        <el-button class="add-rule-btn" plain @click="addRule">+ 添加规则</el-button>

        <pre class="json-preview">{{ JSON.stringify(form, null, 2) }}</pre>
      </el-form>
      <div slot="footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { saveIngress } from "@/api/app";

export default {
  name: "IngressPanel",
  props: {
    ingress: { type: Object, default: () => ({}) },
    appName: { type: String, default: "" },
    selectedEnvironment: { type: [String, Number], default: null },
  },
  data() {
    return {
      modalOpen: false,
      form: { ingressName: "", rules: [] },
    };
  },
  methods: {
    handleEdit() {
      // 深拷贝，避免直接修改 props
      this.form = {
        ingressName: this.ingress.ingressName || this.appName,
        rules: JSON.parse(JSON.stringify(this.ingress.rules || [])),
      };
      // 兜底补全 backend 结构，便于 v-model 绑定
      this.form.rules.forEach((rule) => {
        if (!rule.paths) this.$set(rule, "paths", []);
        rule.paths.forEach((path) => {
          if (!path.backend) this.$set(path, "backend", { serviceName: "", servicePort: "" });
        });
      });
      this.modalOpen = true;
    },
    handleCancel() {
      this.modalOpen = false;
    },
    addRule() {
      this.form.rules.push({ host: "", paths: [] });
    },
    removeRule(index) {
      this.form.rules.splice(index, 1);
    },
    addPath(rule) {
      rule.paths.push({
        pathType: "",
        path: "",
        backend: { serviceName: "", servicePort: "" },
      });
    },
    removePath(rule, index) {
      rule.paths.splice(index, 1);
    },
    async handleSave() {
      await saveIngress({
        envId: this.selectedEnvironment,
        ingressDTO: JSON.parse(JSON.stringify(this.form)),
      });
      this.modalOpen = false;
      this.$message.success("保存成功");
      this.$emit("updated");
    },
  },
};
</script>

<style lang="less" scoped>
.rule-card {
  margin-bottom: 16px;
}
.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  i {
    cursor: pointer;
  }
}
.path-item {
  margin-bottom: 8px;
}
.path-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  i {
    cursor: pointer;
  }
}
.add-rule-btn {
  width: 100%;
  border-style: dashed;
  margin-bottom: 16px;
}
.json-preview {
  background: var(--cm-bg-soft);
  padding: 12px;
  font-size: 12px;
  max-height: 240px;
  overflow: auto;
}
</style>
