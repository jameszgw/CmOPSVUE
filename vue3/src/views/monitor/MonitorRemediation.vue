<template>
  <ScreenPage v-loading="loading" title="自动修复" gap="8px" class="remediation-page">
    <template #header-extra>
      <div class="ctrl-row">
        <el-button type="primary" size="small" :icon="Plus" @click="openAddDialog">新增规则</el-button>
        <el-button :icon="Refresh" size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <CardGrid min="200px" gap="8px" class="row-stats">
      <StatCard dense icon="SetUp" label="规则总数" :value="num(stats.total)" color="#409eff" />
      <StatCard dense icon="CircleCheckFilled" label="启用数" :value="num(stats.enabled)" color="#67c23a" />
      <StatCard dense icon="Lightning" label="累计触发次数" :value="num(stats.fireTotal)" color="#e6a23c" />
    </CardGrid>

    <!-- 规则表 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="修复规则" icon="SetUp">
      <template #extra>共 {{ rules.length }} 条</template>
      <el-table class="dense-table" height="100%" :data="rules" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="设备类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.deviceType || "ALL" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="metricKey" label="指标键" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.metricKey || "-" }}</template>
        </el-table-column>
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="levelType(row.alertLevel)" effect="dark">
              {{ levelText(row.alertLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="动作类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="warning" effect="plain">{{ row.actionType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actionTarget" label="动作目标" min-width="180" show-overflow-tooltip />
        <el-table-column label="冷却(秒)" width="100">
          <template #default="{ row }">{{ num(row.cooldownSec) }}</template>
        </el-table-column>
        <el-table-column label="触发次数" width="100">
          <template #default="{ row }">{{ num(row.fireCount) }}</template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="(v) => onToggle(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无修复规则" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>

    <!-- 执行历史 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="执行历史" icon="Tickets">
      <template #extra>共 {{ history.length }} 条</template>
      <el-table class="dense-table" height="100%" :data="history" size="small" stripe>
        <el-table-column prop="gmtCreate" label="时间" width="180" />
        <el-table-column prop="deviceName" label="设备" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.deviceName || "-" }}</template>
        </el-table-column>
        <el-table-column label="动作" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="warning" effect="plain">{{ row.taskType || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="resultType(row.result)" effect="dark">
              {{ resultText(row.result) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="说明" min-width="200" show-overflow-tooltip />
        <template #empty>
          <el-empty description="暂无执行记录" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>

    <!-- 新增/编辑规则弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑修复规则' : '新增修复规则'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="规则名称" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="设备类型" prop="deviceType">
              <el-select v-model="form.deviceType" style="width: 100%">
                <el-option v-for="t in deviceTypes" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="告警级别">
              <el-select v-model="form.alertLevel" style="width: 100%">
                <el-option label="任意" value="any" />
                <el-option label="警告" value="warning" />
                <el-option label="严重" value="critical" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="指标键">
          <el-input v-model="form.metricKey" placeholder="指标键（可选，留空表示不限）" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="动作类型" prop="actionType">
              <el-select v-model="form.actionType" style="width: 100%">
                <el-option label="WEBHOOK" value="WEBHOOK" />
                <el-option label="NOTIFY" value="NOTIFY" />
                <el-option label="DISPATCH" value="DISPATCH" />
                <el-option label="SCRIPT" value="SCRIPT" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="冷却(秒)">
              <el-input-number v-model="form.cooldownSec" :min="0" :controls="false"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="动作目标" prop="actionTarget">
          <el-input v-model="form.actionTarget" placeholder="WEBHOOK填URL，DISPATCH填 动作:目标，SCRIPT填命令" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
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
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Plus } from "@element-plus/icons-vue";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getRemediationRules,
  addRemediationRule,
  updateRemediationRule,
  deleteRemediationRule,
  toggleRemediationRule,
  getRemediationHistory,
} from "@/api/monitor-ops";

const deviceTypes = [
  "ALL", "SERVER", "REDIS", "DATABASE", "K8S", "MQ", "LB", "STORAGE", "NETDEV", "GPU",
];

const loading = ref(false);
const rules = ref([]);
const history = ref([]);

const stats = computed(() => {
  const list = rules.value || [];
  return {
    total: list.length,
    enabled: list.filter((r) => r.enabled).length,
    fireTotal: list.reduce((s, r) => s + (Number(r.fireCount) || 0), 0),
  };
});

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);

const levelType = (l) => {
  const k = String(l || "").toLowerCase();
  if (k === "critical") return "danger";
  if (k === "warning") return "warning";
  return "info";
};
const levelText = (l) => {
  const k = String(l || "").toLowerCase();
  if (k === "critical") return "严重";
  if (k === "warning") return "警告";
  return "任意";
};
const resultType = (r) => {
  const k = String(r || "").toUpperCase();
  if (k === "SUCCESS" || k === "OK") return "success";
  if (k === "FAIL" || k === "ERROR") return "danger";
  return "info";
};
const resultText = (r) => {
  const k = String(r || "").toUpperCase();
  if (k === "SUCCESS" || k === "OK") return "成功";
  if (k === "FAIL" || k === "ERROR") return "失败";
  return r || "-";
};

const load = async () => {
  loading.value = true;
  try {
    const [rulesRes, histRes] = await Promise.all([
      getRemediationRules(),
      getRemediationHistory(50),
    ]);
    rules.value = rulesRes.content || [];
    history.value = histRes.content || [];
  } finally {
    loading.value = false;
  }
};

// ----- 启用/停用 -----
const onToggle = async (row, val) => {
  try {
    await toggleRemediationRule(row.id, val);
    ElMessage.success(val ? "已启用" : "已停用");
  } catch (e) {
    row.enabled = !val;
    ElMessage.error("操作失败");
  }
};

// ----- 删除 -----
const onDelete = (row) => {
  ElMessageBox.confirm(`确认删除规则「${row.name}」？`, "提示", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      await deleteRemediationRule(row.id);
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
  deviceType: "ALL",
  metricKey: "",
  alertLevel: "any",
  actionType: "WEBHOOK",
  actionTarget: "",
  cooldownSec: 300,
  enabled: true,
});

const form = reactive(defaultForm());

const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  deviceType: [{ required: true, message: "请选择设备类型", trigger: "change" }],
  actionType: [{ required: true, message: "请选择动作类型", trigger: "change" }],
  actionTarget: [{ required: true, message: "请输入动作目标", trigger: "blur" }],
};

const assignForm = (src) => {
  const base = defaultForm();
  Object.keys(base).forEach((k) => {
    form[k] = src && src[k] !== undefined && src[k] !== null ? src[k] : base[k];
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
      await updateRemediationRule(payload);
      ElMessage.success("更新成功");
    } else {
      delete payload.id;
      await addRemediationRule(payload);
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

.row-stats {
  flex-shrink: 0;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
</style>
