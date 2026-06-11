<template>
  <div class="env-vars-panel">
    <el-table :data="data" row-key="id" border style="margin-bottom: 16px">
      <el-table-column label="Key">
        <template slot-scope="{ row }">
          <el-input v-if="isEditing(row)" v-model="editForm.label" placeholder="请输入Key" />
          <span v-else>{{ row.label }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Value">
        <template slot-scope="{ row }">
          <el-input v-if="isEditing(row)" v-model="editForm.value" placeholder="请输入Value" />
          <span v-else>{{ row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template slot-scope="{ row, $index }">
          <template v-if="isEditing(row)">
            <el-button type="text" @click="save(row)">保存</el-button>
            <el-button type="text" @click="cancel">取消</el-button>
          </template>
          <template v-else>
            <el-button type="text" :disabled="editingKey !== ''" @click="edit(row)">编辑</el-button>
            <el-button type="text" :disabled="editingKey !== ''" @click="deleteRow($index)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="actions">
      <el-button @click="addNewRow">添加环境变量</el-button>
      <el-button type="primary" @click="handleEnvVarSubmit">提交</el-button>
    </div>
  </div>
</template>

<script>
import { nanoid } from "nanoid";
import { modifyAppEnvVars } from "@/api/app";

const KEY_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_.-]*$/;

export default {
  name: "EnvVarsPanel",
  props: {
    initialEnvVars: { type: Array, default: () => [] },
    selectedEnvironment: { type: [String, Number], default: null },
  },
  data() {
    return {
      data: [],
      editingKey: "",
      editForm: { label: "", value: "" },
    };
  },
  watch: {
    initialEnvVars: {
      immediate: true,
      handler(val) {
        this.data = (val || []).map((item) => ({ ...item }));
        this.editingKey = "";
      },
    },
  },
  methods: {
    isEditing(row) {
      return row.id === this.editingKey;
    },
    edit(row) {
      this.editForm = { label: row.label, value: row.value };
      this.editingKey = row.id;
    },
    cancel() {
      // 取消未保存的新行
      this.data = this.data.filter((item) => item.id !== this.editingKey || item.label || item.value);
      this.editingKey = "";
    },
    addNewRow() {
      if (this.editingKey) {
        this.$message.warning("请先保存");
        return;
      }
      const newRow = { id: nanoid(), label: "", value: "", editable: true };
      this.editForm = { label: "", value: "" };
      this.data.push(newRow);
      this.editingKey = newRow.id;
    },
    save(row) {
      if (!this.editForm.label || !this.editForm.value) {
        this.$message.warning("请输入Key和Value");
        return;
      }
      if (!KEY_PATTERN.test(this.editForm.label)) {
        this.$message.warning(
          "环境变量名称必须以字母或下划线开头，并且只能包含字母、数字、下划线、短横线或点"
        );
        return;
      }
      row.label = this.editForm.label;
      row.value = this.editForm.value;
      this.editingKey = "";
    },
    deleteRow(index) {
      this.data.splice(index, 1);
    },
    async handleEnvVarSubmit() {
      if (this.data.some((item) => !item.label || !item.value)) {
        this.$message.warning("环境变量不能为空");
        return;
      }
      const envVars = this.data.reduce((acc, { label, value }) => {
        if (label) acc[label] = value;
        return acc;
      }, {});
      await modifyAppEnvVars({
        envId: this.selectedEnvironment,
        envVars,
      });
      this.$message.success("更新成功");
      this.$emit("updated");
    },
  },
};
</script>

<style lang="less" scoped>
.actions {
  margin-bottom: 16px;
}
</style>
