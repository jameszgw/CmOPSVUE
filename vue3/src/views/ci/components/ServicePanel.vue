<template>
  <div class="service-panel">
    <el-button type="primary" class="add-btn" @click="handleAddNew">新增Service</el-button>

    <el-table :data="data" border row-key="serviceName">
      <el-table-column label="服务名称" prop="serviceName" />
      <el-table-column label="服务端口" prop="servicePort" />
      <el-table-column label="容器端口" prop="containerPort" />
      <el-table-column label="服务协议" prop="serviceProtocol" />
      <el-table-column label="服务类型" prop="serviceType" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-link type="primary" class="op-link" @click="handleEdit(row)">编辑</el-link>
          <el-popconfirm title="确认删除吗?" @confirm="handleDelete(row)">
            <template #reference>
              <el-link type="primary" class="op-link">删除</el-link>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="modelOpen"
      :title="editingItem ? '编辑服务' : '新增服务'"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="服务名称" prop="serviceName">
          <el-input v-model="form.serviceName" />
        </el-form-item>
        <el-form-item label="服务端口" prop="servicePort">
          <el-input v-model="form.servicePort" type="number" />
        </el-form-item>
        <el-form-item label="容器端口" prop="containerPort">
          <el-input v-model="form.containerPort" type="number" />
        </el-form-item>
        <el-form-item label="服务协议" prop="serviceProtocol">
          <el-select v-model="form.serviceProtocol" style="width: 100%">
            <el-option label="TCP" value="TCP" />
            <el-option label="UDP" value="UDP" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceType">
          <el-select v-model="form.serviceType" style="width: 100%">
            <el-option label="ClusterIP" value="ClusterIP" />
            <el-option label="NodePort" value="NodePort" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { nanoid } from "nanoid";
import { ElMessage } from "element-plus";
import { createService, deleteService } from "@/api/app";

const props = defineProps({
  initialServices: { type: Array, default: () => [] },
  selectedEnvironment: { type: String, default: null },
});

const data = ref([]);
const editingItem = ref(null);
const modelOpen = ref(false);
const formRef = ref(null);

const form = reactive({
  id: "",
  serviceName: "",
  servicePort: 80,
  containerPort: 8300,
  serviceProtocol: "TCP",
  serviceType: "ClusterIP",
});

const rules = {
  serviceName: [{ required: true, message: "请输入服务名称!", trigger: "blur" }],
  servicePort: [{ required: true, message: "请输入服务端口!", trigger: "blur" }],
  containerPort: [{ required: true, message: "请输入容器端口!", trigger: "blur" }],
  serviceProtocol: [{ required: true, message: "请输入服务协议!", trigger: "change" }],
  serviceType: [{ required: true, message: "请输入服务类型!", trigger: "change" }],
};

watch(
  () => props.initialServices,
  (list) => {
    data.value = (list || []).map((item) => ({ id: nanoid(), ...item }));
  },
  { immediate: true }
);

const setForm = (values) => {
  Object.assign(form, values);
};

const handleEdit = (item) => {
  editingItem.value = item;
  setForm(item);
  modelOpen.value = true;
};

const handleCancel = () => {
  modelOpen.value = false;
  editingItem.value = null;
};

const handleAddNew = () => {
  editingItem.value = null;
  setForm({
    id: nanoid(),
    serviceName: "",
    servicePort: 80,
    containerPort: 8300,
    serviceProtocol: "TCP",
    serviceType: "ClusterIP",
  });
  modelOpen.value = true;
};

const handleSave = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    const row = {
      serviceName: form.serviceName,
      servicePort: Number(form.servicePort),
      containerPort: Number(form.containerPort),
      serviceProtocol: form.serviceProtocol,
      serviceType: form.serviceType,
    };
    await createService({ ...row, envId: props.selectedEnvironment });
    // 同步本地数据
    const index = data.value.findIndex((item) => item.id === form.id);
    if (index > -1) {
      data.value.splice(index, 1, { ...data.value[index], ...row });
    } else {
      data.value.push({ id: form.id, ...row });
    }
    editingItem.value = null;
    modelOpen.value = false;
    ElMessage.success("保存成功");
  });
};

const handleDelete = async (record) => {
  await deleteService({
    serviceName: record.serviceName,
    envId: props.selectedEnvironment,
  });
  data.value = data.value.filter((item) => item.id !== record.id);
  ElMessage.success("删除成功");
};
</script>

<style lang="less" scoped>
.service-panel {
  .add-btn {
    margin-bottom: 16px;
  }
  .op-link {
    margin-right: 12px;
  }
}
</style>
