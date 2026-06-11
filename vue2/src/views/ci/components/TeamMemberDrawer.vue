<template>
  <el-drawer title="项目成员" :visible="visible" size="600px" @close="$emit('close')">
    <div class="drawer-body">
      <div class="toolbar">
        <el-button type="primary" @click="showAddMemberModal">添加成员</el-button>
      </div>

      <el-table :data="appMembers ? appMembers.items : []" row-key="memberId" border>
        <el-table-column label="人员名称">
          <template slot-scope="{ row }">
            {{ row.accountDTO && row.accountDTO.accountName }}
          </template>
        </el-table-column>
        <el-table-column label="人员角色">
          <template slot-scope="{ row }">
            <el-tag v-for="role in row.roles" :key="role" class="role-tag">
              {{ mapRoleToChinese(role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template slot-scope="{ row }">
            <el-button type="text" icon="el-icon-edit" @click="handleEditRole(row)" />
            <el-button type="text" icon="el-icon-delete" @click="handleDeleteMember(row)" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 编辑角色 -->
      <el-dialog
        title="编辑角色"
        :visible.sync="editRoleModalVisible"
        width="480px"
        append-to-body
      >
        <el-form ref="editRoleForm" :model="editRoleForm" label-position="top">
          <el-form-item
            label="人员角色"
            prop="roles"
            :rules="[{ required: true, message: '请选择人员角色', trigger: 'change' }]"
          >
            <el-select v-model="editRoleForm.roles" multiple style="width: 100%">
              <el-option
                v-for="role in roleOptions"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="editRoleModalVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateRole">确定</el-button>
        </div>
      </el-dialog>

      <!-- 添加人员 -->
      <el-dialog
        title="添加人员"
        :visible.sync="addMemberModalVisible"
        width="480px"
        append-to-body
      >
        <el-form ref="addMemberForm" :model="addMemberForm" label-position="top">
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
                v-for="role in roleOptions"
                :key="role.value"
                :label="role.label"
                :value="role.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="addMemberModalVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddMember">确定</el-button>
        </div>
      </el-dialog>
    </div>
  </el-drawer>
</template>

<script>
import { updateMember, addMember, deleteMember } from "@/api/app";
import { queryMembers } from "@/api/user";
import { mapRoleToChinese } from "@/utils/release-utils";

export default {
  name: "TeamMemberDrawer",
  props: {
    visible: { type: Boolean, default: false },
    appMembers: { type: Object, default: null },
    appId: { type: [String, Number], default: "" },
  },
  data() {
    return {
      editRoleModalVisible: false,
      addMemberModalVisible: false,
      userList: [],
      selectedMember: null,
      editRoleForm: { roles: [] },
      addMemberForm: { accountId: "", roles: [] },
      roleOptions: [
        { value: "OWNER", label: "拥有者" },
        { value: "DEVELOPER", label: "开发" },
        { value: "TESTER", label: "测试" },
        { value: "OPERATOR", label: "运维" },
        { value: "ARCHITECT", label: "架构师" },
        { value: "REPORTER", label: "告警接收" },
        { value: "CHECKER", label: "部署审批" },
      ],
    };
  },
  created() {
    this.fetchUserList();
  },
  methods: {
    mapRoleToChinese,
    async fetchUserList() {
      const res = await queryMembers({});
      this.userList = (res.content && res.content.items) || [];
    },
    showAddMemberModal() {
      this.addMemberForm = { accountId: "", roles: [] };
      this.addMemberModalVisible = true;
    },
    handleEditRole(record) {
      this.selectedMember = record;
      this.editRoleForm = { roles: [...(record.roles || [])] };
      this.editRoleModalVisible = true;
    },
    handleDeleteMember(record) {
      this.$confirm("确定删除该人员吗？", "提示", {
        confirmButtonText: "是",
        cancelButtonText: "否",
        type: "warning",
      })
        .then(async () => {
          await deleteMember({ memberId: record.memberId });
          this.$message.success("人员删除成功");
          this.$emit("changed");
        })
        .catch(() => {});
    },
    handleUpdateRole() {
      this.$refs.editRoleForm.validate(async (valid) => {
        if (!valid) return;
        await updateMember({
          ...this.editRoleForm,
          memberId: this.selectedMember && this.selectedMember.memberId,
        });
        this.$message.success("更新成功");
        this.editRoleModalVisible = false;
        this.$emit("changed");
      });
    },
    handleAddMember() {
      this.$refs.addMemberForm.validate(async (valid) => {
        if (!valid) return;
        await addMember({ ...this.addMemberForm, appId: this.appId });
        this.$message.success("添加成功");
        this.addMemberModalVisible = false;
        this.$emit("changed");
      });
    },
  },
};
</script>

<style lang="less" scoped>
.drawer-body {
  padding: 0 20px 80px;
}
.toolbar {
  margin-bottom: 16px;
  text-align: right;
}
.role-tag {
  margin-right: 4px;
}
</style>
