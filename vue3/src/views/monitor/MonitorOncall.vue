<template>
  <ScreenPage v-loading="loading" title="值班排班" gap="8px" class="oncall-page">
    <template #header-extra>
      <div class="ctrl-row">
        <el-button type="primary" size="small" :icon="Plus" @click="openAddDialog">新增排班</el-button>
        <el-button :icon="Refresh" size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <!-- 当前值班 -->
    <SectionCard dense bodyClass="cur-body" title="当前值班" icon="UserFilled">
      <template #extra>共 {{ current.length }} 个班表</template>
      <el-empty v-if="!current.length" description="暂无值班信息" :image-size="60" />
      <CardGrid v-else min="220px" gap="8px">
        <StatCard
          v-for="c in current"
          :key="c.rosterId"
          dense
          icon="User"
          :label="c.rosterName"
          :value="c.onCall || '-'"
          :tag="`${(Number(c.memberIndex) || 0) + 1}/${num(c.memberCount)}`"
          :sub="`下次轮转 ${c.nextRotateTime || '-'}`"
          color="#409eff"
        />
      </CardGrid>
    </SectionCard>

    <!-- 排班表 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="排班列表" icon="Calendar">
      <template #extra>共 {{ rosters.length }} 个</template>
      <el-table class="dense-table" height="100%" :data="rosters" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="成员" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ memberText(row.members) }}</template>
        </el-table-column>
        <el-table-column label="轮转周期" width="140">
          <template #default="{ row }">
            {{ num(row.rotationHours) }} 小时
            <el-tag v-if="rotateHint(row.rotationHours)" size="small" type="info"
              effect="plain" class="hint-tag">{{ rotateHint(row.rotationHours) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="(v) => onToggle(row, v)" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || "-" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无排班" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>

    <!-- 新增/编辑排班弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排班' : '新增排班'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="排班名称" />
        </el-form-item>
        <el-form-item label="成员" prop="members">
          <el-input v-model="form.members" placeholder="成员姓名，逗号分隔，如 张三,李四,王五" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="轮转周期(小时)">
              <el-input-number v-model="form.rotationHours" :min="1" :controls="false"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Plus } from "@element-plus/icons-vue";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getOncallRosters,
  getOncallCurrent,
  addOncallRoster,
  updateOncallRoster,
  deleteOncallRoster,
  toggleOncallRoster,
} from "@/api/monitor-ops";

const loading = ref(false);
const rosters = ref([]);
const current = ref([]);

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);

const memberText = (m) => {
  if (Array.isArray(m)) return m.join(", ") || "-";
  return m ? String(m).split(",").map((s) => s.trim()).filter(Boolean).join(", ") || "-" : "-";
};

const rotateHint = (h) => {
  const n = Number(h);
  if (n === 24) return "每日";
  if (n === 168) return "每周";
  return "";
};

const load = async () => {
  loading.value = true;
  try {
    const [rosterRes, curRes] = await Promise.all([
      getOncallRosters(),
      getOncallCurrent(),
    ]);
    rosters.value = rosterRes.content || [];
    current.value = curRes.content || [];
  } finally {
    loading.value = false;
  }
};

// ----- 启用/停用 -----
const onToggle = async (row, val) => {
  try {
    await toggleOncallRoster(row.id, val);
    ElMessage.success(val ? "已启用" : "已停用");
    load();
  } catch (e) {
    row.enabled = !val;
    ElMessage.error("操作失败");
  }
};

// ----- 删除 -----
const onDelete = (row) => {
  ElMessageBox.confirm(`确认删除排班「${row.name}」？`, "提示", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      await deleteOncallRoster(row.id);
      ElMessage.success("删除成功");
      load();
    })
    .catch(() => {});
};

// ----- 表单弹窗 -----
const dialogVisible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const formRef = ref(null);

const defaultForm = () => ({
  id: null,
  name: "",
  members: "",
  rotationHours: 24,
  remark: "",
  enabled: true,
});

const form = reactive(defaultForm());

const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  members: [{ required: true, message: "请输入成员", trigger: "blur" }],
};

const assignForm = (src) => {
  const base = defaultForm();
  Object.keys(base).forEach((k) => {
    if (k === "members" && src && Array.isArray(src[k])) {
      form[k] = src[k].join(",");
    } else {
      form[k] = src && src[k] !== undefined && src[k] !== null ? src[k] : base[k];
    }
  });
};

const openAddDialog = () => {
  isEdit.value = false;
  assignForm(null);
  dialogVisible.value = true;
  formRef.value?.clearValidate?.();
};

const openEditDialog = (row) => {
  isEdit.value = true;
  assignForm(row);
  dialogVisible.value = true;
  formRef.value?.clearValidate?.();
};

const submitForm = async () => {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch (e) {
    return;
  }
  saving.value = true;
  try {
    const payload = { ...form };
    if (isEdit.value) {
      await updateOncallRoster(payload);
      ElMessage.success("更新成功");
    } else {
      delete payload.id;
      await addOncallRoster(payload);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    load();
  } catch (e) {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.hint-tag {
  margin-left: @space-xs;
}
</style>
