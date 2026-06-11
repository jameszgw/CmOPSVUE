<template>
  <el-drawer
    title="项目成员"
    size="600px"
    :model-value="open"
    @close="emit('close')"
  >
    <template #header>
      <div class="drawer-header">
        <span>项目成员</span>
        <el-button type="primary" @click="showAddMemberModal">添加成员</el-button>
      </div>
    </template>

    <el-table :data="appMembers?.items || []" row-key="memberId">
      <el-table-column label="人员名称">
        <template #default="{ row }">{{ row.accountDTO?.accountName }}</template>
      </el-table-column>
      <el-table-column label="人员角色">
        <template #default="{ row }">
          <el-tag v-for="role in row.roles" :key="role" class="role-tag">
            {{ mapRoleToChinese(role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEditRole(row)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-popconfirm
            title="确定删除该人员吗？"
            confirm-button-text="是"
            cancel-button-text="否"
            @confirm="handleDeleteMember(row)"
          >
            <template #reference>
              <el-button type="primary" link>
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑角色 -->
    <el-dialog v-model="editRoleModalVisible" title="编辑角色" append-to-body>
      <el-form ref="editRoleFormRef" :model="editRoleForm" label-position="top">
        <el-form-item
          label="人员角色"
          prop="roles"
          :rules="[{ required: true, message: '请选择人员角色', trigger: 'change' }]"
        >
          <el-select v-model="editRoleForm.roles" multiple style="width: 100%">
            <el-option
              v-for="option in roleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editRoleModalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加人员 -->
    <el-dialog v-model="addMemberModalVisible" title="添加人员" append-to-body>
      <el-form ref="addMemberFormRef" :model="addMemberForm" label-position="top">
        <el-form-item
          label="项目成员"
          prop="accountId"
          :rules="[{ required: true, message: '请选择人员', trigger: 'change' }]"
        >
          <el-select v-model="addMemberForm.accountId" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.accountName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="人员角色"
          prop="roles"
          :rules="[{ required: true, message: '请选择人员角色', trigger: 'change' }]"
        >
          <el-select v-model="addMemberForm.roles" multiple style="width: 100%">
            <el-option
              v-for="option in roleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addMemberModalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddMember">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { updateMember, deleteMember, addMember } from "@/api/app";
import { queryMembers } from "@/api/user";
import { mapRoleToChinese } from "@/utils/release-utils";

defineProps({
  open: { type: Boolean, default: false },
  appMembers: { type: Object, default: null },
});
const emit = defineEmits(["close"]);

const route = useRoute();
const id = route.params.id;

const roleOptions = [
  { label: "拥有者", value: "OWNER" },
  { label: "开发", value: "DEVELOPER" },
  { label: "测试", value: "TESTER" },
  { label: "运维", value: "OPERATOR" },
  { label: "架构师", value: "ARCHITECT" },
  { label: "告警接收", value: "REPORTER" },
  { label: "部署审批", value: "CHECKER" },
];

const userList = ref([]);
const editRoleModalVisible = ref(false);
const addMemberModalVisible = ref(false);
const selectedMember = ref(null);

const editRoleFormRef = ref(null);
const addMemberFormRef = ref(null);
const editRoleForm = reactive({ roles: [] });
const addMemberForm = reactive({ accountId: "", roles: [] });

const fetchUserList = async () => {
  const res = await queryMembers({});
  userList.value = res.content?.items || [];
};

const showAddMemberModal = () => {
  addMemberForm.accountId = "";
  addMemberForm.roles = [];
  addMemberModalVisible.value = true;
};

const handleEditRole = (record) => {
  selectedMember.value = record;
  editRoleForm.roles = [...(record.roles || [])];
  editRoleModalVisible.value = true;
};

const handleDeleteMember = async (record) => {
  await deleteMember({ memberId: record?.memberId });
  ElMessage.success("人员删除成功");
  emit("close");
};

const handleUpdateRole = () => {
  editRoleFormRef.value.validate(async (valid) => {
    if (!valid) return;
    await updateMember({
      roles: editRoleForm.roles,
      memberId: selectedMember.value?.memberId,
    });
    ElMessage.success("更新成功");
    editRoleModalVisible.value = false;
    emit("close");
  });
};

const handleAddMember = () => {
  addMemberFormRef.value.validate(async (valid) => {
    if (!valid) return;
    await addMember({ ...addMemberForm, appId: id });
    ElMessage.success("添加成功");
    addMemberModalVisible.value = false;
    emit("close");
  });
};

onMounted(() => {
  fetchUserList();
});
</script>

<style lang="less" scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 16px;
}
.role-tag {
  margin-right: 4px;
}
</style>
