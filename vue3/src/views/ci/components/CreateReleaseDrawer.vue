<template>
  <el-drawer
    title="添加发布单"
    size="600px"
    :model-value="visible"
    destroy-on-close
    @close="emit('close')"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="预计发布日期" prop="releaseDate">
        <el-date-picker
          v-model="form.releaseDate"
          type="datetime"
          placeholder="请选择发布时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="发布分支" prop="releaseBranch">
        <el-select
          v-model="form.releaseBranch"
          placeholder="请选择分支"
          filterable
          remote
          :remote-method="handleSearchBranch"
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
  </el-drawer>
</template>

<script setup>
import { reactive, ref } from "vue";
import dayjs from "dayjs";

defineProps({
  visible: { type: Boolean, default: false },
  branches: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "search-branch", "add-release"]);

const formRef = ref(null);

const form = reactive({
  releaseDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  releaseBranch: "",
  releaseVersion: "",
  docAddress: "",
  comment: "",
});

const rules = {
  releaseBranch: [{ required: true, message: "请输入发布分支", trigger: "change" }],
  releaseVersion: [{ required: true, message: "请输入发布版本", trigger: "blur" }],
  docAddress: [{ required: true, message: "请输入文档地址", trigger: "blur" }],
  comment: [{ required: true, message: "请输入备注", trigger: "blur" }],
};

const handleSearchBranch = (search) => {
  emit("search-branch", search || "");
};

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) return;
    emit("add-release", { ...form });
  });
};
</script>

<style lang="less" scoped></style>
