<template>
  <div class="page-container">
    <div class="page-title-row">
      <div class="page-title">
        <el-icon class="title-icon"><Bell /></el-icon>
        <span>告警中心</span>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="refreshAll">刷新</el-button>
    </div>

    <!-- 顶部统计卡 -->
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Bell" label="活跃告警" :value="num(stats.activeTotal)"
          :sub="`规则 ${num(stats.ruleEnabled)}/${num(stats.ruleTotal)} 启用`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleCloseFilled" label="严重" :value="num(stats.critical)"
          :sub="`历史 ${num(stats.historyTotal)} 条`" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="WarningFilled" label="警告" :value="num(stats.warning)"
          :sub="`已确认 ${num(stats.acknowledged)} 条`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleCheckFilled" label="已恢复" :value="num(stats.resolved)"
          :sub="byTypeSub" color="#67c23a" />
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="alert-tabs">
      <!-- 告警概览 -->
      <el-tab-pane label="告警概览" name="overview">
        <SectionCard title="活跃告警" icon="AlarmClock">
          <template #extra>
            <div class="filter-row">
              <el-select v-model="filterLevel" placeholder="级别" size="small"
                style="width: 120px" @change="loadActive">
                <el-option label="全部级别" value="" />
                <el-option label="严重" value="critical" />
                <el-option label="警告" value="warning" />
              </el-select>
              <el-select v-model="filterType" placeholder="设备类型" size="small"
                style="width: 140px" @change="loadActive">
                <el-option label="全部类型" value="" />
                <el-option label="SERVER" value="SERVER" />
                <el-option label="REDIS" value="REDIS" />
                <el-option label="DATABASE" value="DATABASE" />
              </el-select>
            </div>
          </template>
          <el-table :data="activeAlerts" size="small" stripe>
            <el-table-column label="级别" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="levelTagType(row.level)" effect="dark">
                  {{ row.levelText || levelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceName" label="设备" min-width="120" show-overflow-tooltip />
            <el-table-column prop="metricLabel" label="指标" min-width="110" show-overflow-tooltip />
            <el-table-column label="当前值" width="110">
              <template #default="{ row }">
                <span class="val-strong">{{ fmtVal(row.value, row.unit) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="阈值" width="110">
              <template #default="{ row }">
                {{ cmpSymbol(row.comparator) }} {{ fmtVal(row.threshold, row.unit) }}
              </template>
            </el-table-column>
            <el-table-column prop="message" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column prop="firstTime" label="首次" width="170" />
            <el-table-column label="持续" width="100">
              <template #default="{ row }">{{ num(row.durationMin) }} 分钟</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!activeAlerts.length" description="暂无活跃告警" :image-size="80" />
        </SectionCard>

        <SectionCard title="历史告警" icon="Clock">
          <template #extra>最近 {{ history.length }} 条</template>
          <el-table :data="history" size="small" stripe>
            <el-table-column label="级别" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="levelTagType(row.level)" effect="dark">
                  {{ row.levelText || levelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceName" label="设备" min-width="120" show-overflow-tooltip />
            <el-table-column prop="metricLabel" label="指标" min-width="110" show-overflow-tooltip />
            <el-table-column label="当前值" width="110">
              <template #default="{ row }">{{ fmtVal(row.value, row.unit) }}</template>
            </el-table-column>
            <el-table-column label="阈值" width="110">
              <template #default="{ row }">
                {{ cmpSymbol(row.comparator) }} {{ fmtVal(row.threshold, row.unit) }}
              </template>
            </el-table-column>
            <el-table-column prop="firstTime" label="首次" width="170" />
            <el-table-column prop="recoverTime" label="恢复时间" width="170" />
            <el-table-column label="持续" width="100">
              <template #default="{ row }">{{ num(row.durationMin) }} 分钟</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTagType(row.status)" effect="plain">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!history.length" description="暂无历史告警" :image-size="80" />
        </SectionCard>
      </el-tab-pane>

      <!-- 阈值规则 -->
      <el-tab-pane label="阈值规则" name="rules">
        <SectionCard title="阈值规则" icon="SetUp">
          <template #extra>
            <el-button type="primary" size="small" :icon="Plus" @click="openAddDialog">
              新增规则
            </el-button>
          </template>
          <el-table :data="rules" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="设备类型" width="110">
              <template #default="{ row }">
                <el-tag size="small" type="info" effect="plain">{{ row.deviceType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="metricLabel" label="指标" min-width="120" show-overflow-tooltip />
            <el-table-column label="条件" min-width="180">
              <template #default="{ row }">
                <span class="cond-warn">
                  {{ cmpSymbol(row.comparator) }} {{ fmtVal(row.warnValue, row.unit) }} 警告
                </span>
                <span class="cond-crit">
                  {{ cmpSymbol(row.comparator) }} {{ fmtVal(row.criticalValue, row.unit) }} 严重
                </span>
              </template>
            </el-table-column>
            <el-table-column label="持续" width="90">
              <template #default="{ row }">{{ num(row.durationSec) }} 秒</template>
            </el-table-column>
            <el-table-column label="启用" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="(val) => onToggle(row, val)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEditDialog(row)">
                  编辑
                </el-button>
                <el-button link type="danger" size="small" @click="onDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!rules.length" description="暂无规则" :image-size="80" />
        </SectionCard>
      </el-tab-pane>
    </el-tabs>

    <!-- 规则表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '新增规则'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="规则名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="form.deviceType" placeholder="请选择" style="width: 100%">
            <el-option label="SERVER" value="SERVER" />
            <el-option label="REDIS" value="REDIS" />
            <el-option label="DATABASE" value="DATABASE" />
          </el-select>
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="指标键" prop="metricKey">
              <el-input v-model="form.metricKey" placeholder="如 cpuUsage" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指标名称" prop="metricLabel">
              <el-input v-model="form.metricLabel" placeholder="如 CPU使用率" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="如 %" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比较符" prop="comparator">
              <el-select v-model="form.comparator" style="width: 100%">
                <el-option label="&gt; 大于 (GT)" value="GT" />
                <el-option label="≥ 大于等于 (GTE)" value="GTE" />
                <el-option label="&lt; 小于 (LT)" value="LT" />
                <el-option label="≤ 小于等于 (LTE)" value="LTE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="警告阈值" prop="warnValue">
              <el-input-number v-model="form.warnValue" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重阈值" prop="criticalValue">
              <el-input-number v-model="form.criticalValue" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="持续(秒)" prop="durationSec">
              <el-input-number v-model="form.durationSec" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="采样最小">
              <el-input-number v-model="form.sampleMin" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采样最大">
              <el-input-number v-model="form.sampleMax" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Bell, Refresh, Plus } from "@element-plus/icons-vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getAlertStats,
  getActiveAlerts,
  getAlertHistory,
  listAlertRules,
  addAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from "@/api/monitor-alert";

const loading = ref(false);
const activeTab = ref("overview");

const stats = ref({});
const activeAlerts = ref([]);
const history = ref([]);
const rules = ref([]);

const filterLevel = ref("");
const filterType = ref("");

// ----- 工具方法 -----
const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);
const fmtVal = (v, unit) =>
  v === undefined || v === null || v === "" ? "-" : `${v}${unit || ""}`;

const CMP_MAP = { GT: ">", GTE: "≥", LT: "<", LTE: "≤" };
const cmpSymbol = (c) => CMP_MAP[c] || c || "";

const levelTagType = (level) => {
  if (level === "critical") return "danger";
  if (level === "warning") return "warning";
  return "success";
};
const levelText = (level) => {
  if (level === "critical") return "严重";
  if (level === "warning") return "警告";
  return "正常";
};

const statusTagType = (status) => (status === "acknowledged" ? "warning" : "success");
const statusText = (status) => {
  if (status === "resolved") return "已恢复";
  if (status === "acknowledged") return "已确认";
  return status || "-";
};

const byTypeSub = computed(() => {
  const b = stats.value.byType || {};
  return `S:${b.SERVER ?? 0} R:${b.REDIS ?? 0} D:${b.DATABASE ?? 0}`;
});

// ----- 数据加载 -----
const loadStats = async () => {
  try {
    const res = await getAlertStats();
    stats.value = res?.content || {};
  } catch (e) {
    /* ignore polling errors */
  }
};

const loadActive = async () => {
  try {
    const res = await getActiveAlerts(filterLevel.value, filterType.value);
    activeAlerts.value = res?.content || [];
  } catch (e) {
    /* ignore polling errors */
  }
};

const loadHistory = async () => {
  const res = await getAlertHistory(30);
  history.value = res?.content || [];
};

const loadRules = async () => {
  const res = await listAlertRules();
  rules.value = res?.content || [];
};

const refreshAll = async () => {
  loading.value = true;
  try {
    await Promise.all([loadStats(), loadActive(), loadHistory(), loadRules()]);
  } finally {
    loading.value = false;
  }
};

// ----- 启用/停用 -----
const onToggle = async (row, val) => {
  try {
    await toggleAlertRule(row.id, val);
    ElMessage.success(val ? "已启用" : "已停用");
  } catch (e) {
    row.enabled = !val; // 回滚
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
      await deleteAlertRule(row.id);
      ElMessage.success("删除成功");
      loadRules();
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
  deviceType: "SERVER",
  metricKey: "",
  metricLabel: "",
  unit: "",
  comparator: "GT",
  warnValue: undefined,
  criticalValue: undefined,
  durationSec: 60,
  sampleMin: undefined,
  sampleMax: undefined,
});

const form = reactive(defaultForm());

const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  deviceType: [{ required: true, message: "请选择设备类型", trigger: "change" }],
  metricKey: [{ required: true, message: "请输入指标键", trigger: "blur" }],
  metricLabel: [{ required: true, message: "请输入指标名称", trigger: "blur" }],
  comparator: [{ required: true, message: "请选择比较符", trigger: "change" }],
  warnValue: [{ required: true, message: "请输入警告阈值", trigger: "blur" }],
  criticalValue: [{ required: true, message: "请输入严重阈值", trigger: "blur" }],
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
      await updateAlertRule(payload);
      ElMessage.success("更新成功");
    } else {
      delete payload.id;
      await addAlertRule(payload);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    loadRules();
  } catch (e) {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// ----- 自动刷新 -----
let timer = null;
onMounted(() => {
  refreshAll();
  timer = setInterval(() => {
    loadStats();
    loadActive();
  }, 5000);
});
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.page-container {
  padding: 16px;
}
.page-title-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.page-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--cm-text-primary);
  margin-right: auto;

  .title-icon {
    color: var(--cm-color-primary);
    margin-right: 8px;
  }
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.alert-tabs {
  margin-top: 8px;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.val-strong {
  font-weight: 600;
  color: var(--cm-text-primary);
}
.cond-warn {
  color: var(--cm-color-warning);
  margin-right: 12px;
}
.cond-crit {
  color: var(--cm-color-danger);
}
</style>
