<template>
  <div class="service-panel">
    <el-button type="primary" style="margin-bottom: 16px" @click="handleAddNew">
      新增Service
    </el-button>

    <el-table :data="data" row-key="serviceName" border>
      <el-table-column label="服务名称" prop="serviceName" />
      <el-table-column label="服务端口" prop="servicePort" />
      <el-table-column label="容器端口" prop="containerPort" />
      <el-table-column label="服务协议" prop="serviceProtocol" />
      <el-table-column label="服务类型" prop="serviceType" />
      <el-table-column label="操作" width="140">
        <template slot-scope="{ row }">
          <el-button type="text" @click="handleEdit(row)">编辑</el-button>
          <el-button type="text" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      :title="editingItem ? '编辑服务' : '新增服务'"
      :visible.sync="modalOpen"
      width="480px"
      append-to-body
    >
      <el-form ref="form" :model="form" :rules="rules" label-position="top">
        <el-form-item label="服务名称" prop="serviceName">
          <el-input v-model="form.serviceName" />
        </el-form-item>
        <el-form-item label="服务端口" prop="servicePort">
          <el-input v-model.number="form.servicePort" type="number" />
        </el-form-item>
        <el-form-item label="容器端口" prop="containerPort">
          <el-input v-model.number="form.containerPort" type="number" />
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
      <div slot="footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { createService, deleteService } from "@/api/app";

const defaultForm = () => ({
  serviceName: "",
  servicePort: 80,
  containerPort: 8300,
  serviceProtocol: "TCP",
  serviceType: "ClusterIP",
});

export default {
  name: "ServicePanel",
  props: {
    initialServices: { type: Array, default: () => [] },
    selectedEnvironment: { type: [String, Number], default: null },
  },
  data() {
    return {
      data: [],
      editingItem: null,
      modalOpen: false,
      form: defaultForm(),
      rules: {
        serviceName: [{ required: true, message: "请输入服务名称!", trigger: "blur" }],
        servicePort: [{ required: true, message: "请输入服务端口!", trigger: "blur" }],
        containerPort: [{ required: true, message: "请输入容器端口!", trigger: "blur" }],
        serviceProtocol: [{ required: true, message: "请输入服务协议!", trigger: "change" }],
        serviceType: [{ required: true, message: "请输入服务类型!", trigger: "change" }],
      },
    };
  },
  watch: {
    initialServices: {
      immediate: true,
      handler(val) {
        this.data = (val || []).map((item) => ({ ...item }));
      },
    },
  },
  methods: {
    handleEdit(item) {
      this.editingItem = item;
      this.form = {
        serviceName: item.serviceName,
        servicePort: item.servicePort,
        containerPort: item.containerPort,
        serviceProtocol: item.serviceProtocol,
        serviceType: item.serviceType,
      };
      this.modalOpen = true;
    },
    handleAddNew() {
      this.editingItem = null;
      this.form = defaultForm();
      this.modalOpen = true;
    },
    handleCancel() {
      this.modalOpen = false;
      this.editingItem = null;
    },
    handleSave() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        // 与原版一致：新增/编辑均调用 createService 保存
        await createService({ ...this.form, envId: this.selectedEnvironment });
        this.editingItem = null;
        this.modalOpen = false;
        this.$message.success("保存成功");
        this.$emit("updated");
      });
    },
    handleDelete(record) {
      this.$confirm("确认删除吗?", "提示", { type: "warning" })
        .then(async () => {
          await deleteService({
            serviceName: record.serviceName,
            envId: this.selectedEnvironment,
          });
          this.data = this.data.filter((item) => item.serviceName !== record.serviceName);
          this.$message.success("删除成功");
          this.$emit("updated");
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="less" scoped>
.service-panel {
  width: 100%;
}
</style>
