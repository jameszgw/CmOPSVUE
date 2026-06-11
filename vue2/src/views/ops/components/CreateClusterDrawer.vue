<template>
  <el-drawer
    title="新增集群"
    :visible="createClusterVisible"
    size="400px"
    @close="$emit('close')"
  >
    <div class="drawer-body">
      <el-form ref="form" :model="form" :rules="rules" label-position="top">
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
            <el-option label="K8S" value="k8s" />
            <el-option label="阿里云" value="aliyun" />
            <el-option label="腾讯云" value="tencent" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-tag
            v-for="tag in tags"
            :key="tag"
            closable
            style="margin-right: 4px"
            @close="handleTagClose(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-model="newTag"
            style="width: 100px; margin-left: 8px"
            size="mini"
            @keyup.enter.native="handleTagAdd"
          />
          <el-button type="primary" size="mini" @click="handleTagAdd">添加标签</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleTestConnection">测试连接</el-button>
          <el-button type="primary" :disabled="!isConnectionTested" @click="handleSubmit">
            添加集群
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
export default {
  name: "CreateClusterDrawer",
  props: {
    createClusterVisible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        name: "",
        connectString: "",
        token: "",
        clusterType: "",
      },
      tags: [],
      newTag: "",
      isConnectionTested: false,
      rules: {
        name: [{ required: true, message: "请输入集群名称", trigger: "blur" }],
        connectString: [{ required: true, message: "请输入连接字符串", trigger: "blur" }],
        token: [{ required: true, message: "请输入令牌", trigger: "blur" }],
        clusterType: [{ required: true, message: "请选择集群类型", trigger: "change" }],
      },
    };
  },
  methods: {
    handleTestConnection() {
      this.$refs.form.validateField(
        ["connectString", "token", "clusterType"],
        (errMsg) => {
          if (errMsg) return;
        }
      );
      const { connectString, token, clusterType } = this.form;
      if (!connectString || !token || !clusterType) {
        this.$message.error("连接测试失败，请检查输入信息");
        return;
      }
      this.$emit("connect", { connectString, token, clusterType });
      this.isConnectionTested = true;
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.$emit("submit", { ...this.form, tags: this.tags });
        this.$refs.form.resetFields();
        this.tags = [];
        this.isConnectionTested = false;
      });
    },
    handleTagClose(removedTag) {
      this.tags = this.tags.filter((tag) => tag !== removedTag);
    },
    handleTagAdd() {
      const newTag = this.newTag;
      if (newTag && !this.tags.includes(newTag)) {
        this.tags.push(newTag);
        this.newTag = "";
      }
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px;
}
</style>
