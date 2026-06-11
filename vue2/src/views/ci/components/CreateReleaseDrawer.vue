<template>
  <el-drawer title="添加发布单" :visible="visible" size="600px" @close="$emit('close')">
    <div class="drawer-body">
      <el-form ref="form" :model="form" :rules="rules" label-position="top">
        <el-form-item label="预计发布日期" prop="releaseDate">
          <el-date-picker
            v-model="form.releaseDate"
            type="datetime"
            placeholder="选择日期时间"
            value-format="yyyy-MM-dd HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="发布分支" prop="releaseBranch">
          <el-select
            v-model="form.releaseBranch"
            placeholder="请选择分支"
            filterable
            remote
            :remote-method="(query) => $emit('search', query)"
            style="width: 100%"
          >
            <el-option
              v-for="branch in branches"
              :key="branch.name"
              :label="branch.name"
              :value="branch.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发布版本" prop="releaseVersion">
          <el-input v-model="form.releaseVersion" />
        </el-form-item>
        <el-form-item label="文档地址" prop="docAddress">
          <el-input v-model="form.docAddress" />
        </el-form-item>
        <el-form-item label="备注" prop="comment">
          <el-input v-model="form.comment" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script>
import dayjs from "dayjs";

const defaultForm = () => ({
  releaseDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  releaseBranch: "",
  releaseVersion: "",
  docAddress: "",
  comment: "",
});

export default {
  name: "CreateReleaseDrawer",
  props: {
    visible: { type: Boolean, default: false },
    branches: { type: Array, default: () => [] },
  },
  data() {
    return {
      form: defaultForm(),
      rules: {
        releaseBranch: [{ required: true, message: "请输入发布分支", trigger: "change" }],
        releaseVersion: [{ required: true, message: "请输入发布版本", trigger: "blur" }],
        docAddress: [{ required: true, message: "请输入文档地址", trigger: "blur" }],
        comment: [{ required: true, message: "请输入备注", trigger: "blur" }],
      },
    };
  },
  methods: {
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.$emit("submit", { ...this.form });
        this.form = defaultForm();
      });
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px 20px;
}
</style>
