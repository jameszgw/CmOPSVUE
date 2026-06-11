<template>
  <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
    <el-form-item label="告警组名称" prop="groupName">
      <el-input v-model="formData.groupName" placeholder="请输入告警组名称" />
    </el-form-item>

    <el-form-item label="告警组描述" prop="groupDescription">
      <el-input
        v-model="formData.groupDescription"
        placeholder="请输入告警组描述"
      />
    </el-form-item>

    <el-form-item label="Webhooks" prop="notifyIdList">
      <el-select
        v-model="formData.notifyIdList"
        multiple
        clearable
        placeholder="请选择 Webhooks"
        style="width: 100%"
      >
        <el-option
          v-for="webhook in webhooks"
          :key="webhook.id"
          :label="webhook.webhookName"
          :value="webhook.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="人员列表" prop="accountIds">
      <el-select
        v-model="formData.accountIds"
        multiple
        clearable
        placeholder="请选择人员"
        style="width: 100%"
      >
        <el-option
          v-for="user in members"
          :key="user.id"
          :label="user.accountName"
          :value="user.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">
        {{ initialValues ? "更新" : "保存" }}
      </el-button>
      <el-button @click="emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive } from "vue";

const props = defineProps({
  // 编辑时的初始值
  initialValues: { type: Object, default: null },
  // webhook 列表
  webhooks: { type: Array, default: () => [] },
  // 人员列表
  members: { type: Array, default: () => [] },
});

const emit = defineEmits(["save", "cancel"]);

const formRef = ref(null);

const formData = reactive({
  groupName: props.initialValues?.groupName || "",
  groupDescription: props.initialValues?.groupDescription || "",
  notifyIdList: props.initialValues
    ? (props.initialValues.notifies || []).map((notify) => notify.notifyId)
    : [],
  accountIds: props.initialValues
    ? (props.initialValues.users || []).map((user) => user.accountId)
    : [],
});

const rules = {
  groupName: [{ required: true, message: "请输入告警组名称", trigger: "blur" }],
  groupDescription: [
    { required: true, message: "请输入告警组描述", trigger: "blur" },
  ],
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    emit("save", { ...formData });
  } catch (error) {
    console.error("表单验证失败:", error);
  }
};
</script>
