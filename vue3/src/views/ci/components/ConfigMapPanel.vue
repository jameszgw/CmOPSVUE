<template>
  <div class="config-map-panel">
    <el-table :data="data" border row-key="id" class="edit-table">
      <el-table-column label="Key">
        <template #default="{ row }">
          <el-input v-if="isEditing(row)" v-model="editingRow.label" placeholder="请输入Key" />
          <span v-else>{{ row.label }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Value">
        <template #default="{ row }">
          <el-input v-if="isEditing(row)" v-model="editingRow.value" placeholder="请输入Value" />
          <span v-else>{{ row.value }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row, $index }">
          <template v-if="isEditing(row)">
            <el-link type="primary" class="op-link" @click="save(row)">保存</el-link>
            <el-popconfirm title="取消修改?" @confirm="cancel">
              <template #reference>
                <el-link type="primary" class="op-link">取消</el-link>
              </template>
            </el-popconfirm>
          </template>
          <template v-else>
            <el-link
              type="primary"
              class="op-link"
              :disabled="editingKey !== ''"
              @click="edit(row)"
            >
              编辑
            </el-link>
            <el-link
              type="primary"
              class="op-link"
              :disabled="editingKey !== ''"
              @click="deleteRow($index)"
            >
              删除
            </el-link>
          </template>
        </template>
      </el-table-column>
    </el-table>
    <div class="panel-actions">
      <el-button @click="addNewRow">添加配置项</el-button>
      <el-button type="primary" @click="handleConfigMapSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { nanoid } from "nanoid";
import { ElMessage } from "element-plus";
import { modifyAppEnvConfigMap } from "@/api/app";

const props = defineProps({
  initialConfigMap: { type: Array, default: () => [] },
  selectedEnvironment: { type: String, default: null },
});

const LABEL_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_.-]*$/;

const data = ref([]);
const editingKey = ref("");
const editingRow = reactive({ label: "", value: "" });

watch(
  () => props.initialConfigMap,
  (list) => {
    data.value = (list || []).map((item) => ({ ...item }));
    editingKey.value = "";
  },
  { immediate: true }
);

const isEditing = (row) => row.id === editingKey.value;

const edit = (row) => {
  editingRow.label = row.label;
  editingRow.value = row.value;
  editingKey.value = row.id;
};

const cancel = () => {
  const index = data.value.findIndex((item) => item.id === editingKey.value);
  if (index > -1 && !data.value[index].label && !data.value[index].value) {
    data.value.splice(index, 1);
  }
  editingKey.value = "";
};

const addNewRow = () => {
  if (editingKey.value) {
    ElMessage.warning("请先保存");
    return;
  }
  const newRow = { id: nanoid(), label: "", value: "", editable: true };
  editingRow.label = "";
  editingRow.value = "";
  editingKey.value = newRow.id;
  data.value.push(newRow);
};

const save = (row) => {
  if (!editingRow.label || !editingRow.value) {
    ElMessage.warning("请输入Key和Value");
    return;
  }
  if (!LABEL_PATTERN.test(editingRow.label)) {
    ElMessage.warning(
      "配置项名称必须以字母或下划线开头，并且只能包含字母、数字、下划线、短横线或点"
    );
    return;
  }
  const index = data.value.findIndex((item) => item.id === row.id);
  if (index > -1) {
    data.value.splice(index, 1, {
      ...data.value[index],
      label: editingRow.label,
      value: editingRow.value,
    });
  }
  editingKey.value = "";
};

const deleteRow = (index) => {
  data.value.splice(index, 1);
};

const handleConfigMapSubmit = async () => {
  if (data.value.some((item) => !item.label || !item.value)) {
    ElMessage.warning("配置项不能为空");
    return;
  }
  const configMap = data.value.reduce((acc, { label, value }) => {
    if (label) acc[label] = value;
    return acc;
  }, {});
  await modifyAppEnvConfigMap({
    envId: props.selectedEnvironment,
    configMap,
  });
  ElMessage.success("更新成功");
  window.location.reload();
};
</script>

<style lang="less" scoped>
.config-map-panel {
  .edit-table {
    margin-bottom: 16px;
    width: 100%;
  }
  .op-link {
    margin-right: 12px;
  }
  .panel-actions {
    margin-bottom: 16px;
  }
}
</style>
