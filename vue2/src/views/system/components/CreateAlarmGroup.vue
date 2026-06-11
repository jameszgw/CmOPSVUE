<template>
  <el-form ref="form" :model="form" :rules="rules" label-position="top">
    <el-form-item label="告警组名称" prop="groupName">
      <el-input v-model="form.groupName" placeholder="请输入告警组名称" />
    </el-form-item>

    <el-form-item label="告警组描述" prop="groupDescription">
      <el-input v-model="form.groupDescription" placeholder="请输入告警组描述" />
    </el-form-item>

    <el-form-item label="Webhooks" prop="notifyIdList">
      <el-select
        v-model="form.notifyIdList"
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
        v-model="form.accountIds"
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
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: "CreateAlarmGroup",
  props: {
    // 编辑时的初始值
    initialValues: {
      type: Object,
      default: null,
    },
    // webhook 列表
    webhooks: {
      type: Array,
      default: () => [],
    },
    // 人员列表
    members: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      form: {
        groupName: "",
        groupDescription: "",
        notifyIdList: [],
        accountIds: [],
      },
      rules: {
        groupName: [{ required: true, message: "请输入告警组名称", trigger: "blur" }],
        groupDescription: [{ required: true, message: "请输入告警组描述", trigger: "blur" }],
      },
    };
  },
  created() {
    if (this.initialValues) {
      this.form = {
        groupName: this.initialValues.groupName,
        groupDescription: this.initialValues.groupDescription,
        notifyIdList: (this.initialValues.notifies || []).map(
          (notify) => notify.notifyId
        ),
        accountIds: (this.initialValues.users || []).map(
          (user) => user.accountId
        ),
      };
    }
  },
  methods: {
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return;
        this.$emit("save", { ...this.form });
      });
    },
  },
};
</script>
