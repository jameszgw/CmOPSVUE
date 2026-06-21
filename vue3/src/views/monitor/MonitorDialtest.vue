<template>
  <ScreenPage v-loading="loading" title="拨测监控" gap="8px" class="dialtest-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(分)</span>
        <el-input-number v-model="windowMin" :min="5" :max="1440" size="small"
          :controls="false" style="width: 90px" @change="loadOverview" />
        <el-button type="primary" size="small" :icon="Plus" @click="openAddDialog">新增任务</el-button>
        <el-button :icon="Refresh" size="small" :loading="loading" @click="loadOverview">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <CardGrid min="200px" gap="8px" class="row-stats">
      <StatCard dense icon="Aim" label="任务数" :value="num(overview.taskTotal)"
        :sub="`窗口 ${num(overview.windowMin)} 分钟`" color="#409eff" />
      <StatCard dense icon="CircleCheckFilled" label="正常" :value="num(overview.up)"
        color="#67c23a" />
      <StatCard dense icon="CircleCloseFilled" label="异常" :value="num(overview.down)"
        color="#f56c6c" />
    </CardGrid>

    <!-- 任务表 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="拨测任务" icon="Connection">
      <template #extra>共 {{ tasks.length }} 个</template>
      <el-table class="dense-table" height="100%" :data="tasks" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.probeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.target }}<span v-if="row.port">:{{ row.port }}</span>
          </template>
        </el-table-column>
        <el-table-column label="可用率" width="110">
          <template #default="{ row }">
            <span class="val-strong" :style="{ color: availColor(row.availability) }">
              {{ pct(row.availability) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="平均时延(ms)" width="120">
          <template #default="{ row }">{{ num1(row.avgLatencyMs) }}</template>
        </el-table-column>
        <el-table-column label="最近状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.lastStatus)" effect="dark">
              {{ statusText(row.lastStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="(v) => onToggle(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="onRun(row)">立即拨测</el-button>
            <el-button link type="primary" size="small" @click="openResults(row)">记录</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无拨测任务" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>

    <!-- 新增/编辑任务弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑拨测任务' : '新增拨测任务'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="任务名称" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="探测类型" prop="probeType">
              <el-select v-model="form.probeType" style="width: 100%">
                <el-option label="HTTP" value="HTTP" />
                <el-option label="TCP" value="TCP" />
                <el-option label="PING" value="PING" />
                <el-option label="DNS" value="DNS" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口">
              <el-input-number v-model="form.port" :min="0" :max="65535" :controls="false"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="目标" prop="target">
          <el-input v-model="form.target" placeholder="如 https://example.com 或 10.0.0.1" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="间隔(秒)">
              <el-input-number v-model="form.intervalSec" :min="5" :controls="false"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超时(ms)">
              <el-input-number v-model="form.timeoutMs" :min="100" :controls="false"
                style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="期望状态码">
              <el-input-number v-model="form.expectStatus" :min="0" :controls="false"
                style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="期望包含">
          <el-input v-model="form.expectContains" placeholder="响应应包含的文本（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 拨测记录抽屉 -->
    <el-drawer v-model="drawerVisible" :title="`拨测记录 · ${currentTask.name || ''}`" size="640px">
      <div class="drawer-body">
        <el-empty v-if="!results.length" description="暂无拨测记录" :image-size="60" />
        <template v-else>
          <div ref="chartRef" class="latency-chart"></div>
          <el-table class="dense-table" :data="results" size="small" stripe height="320">
            <el-table-column prop="ts" label="时间" width="180" />
            <el-table-column label="结果" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.success ? 'success' : 'danger'" effect="dark">
                  {{ row.success ? "成功" : "失败" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时延(ms)" width="100">
              <template #default="{ row }">{{ num1(row.latencyMs) }}</template>
            </el-table-column>
            <el-table-column prop="code" label="状态码" width="90" />
            <el-table-column prop="message" label="消息" min-width="160" show-overflow-tooltip />
          </el-table>
        </template>
      </div>
    </el-drawer>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Plus } from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getDialtestOverview,
  addDialtestTask,
  updateDialtestTask,
  deleteDialtestTask,
  toggleDialtestTask,
  runDialtestTask,
  getDialtestResults,
} from "@/api/monitor-ops";

applyChartTheme(echarts);

const loading = ref(false);
const windowMin = ref(60);
const data = ref({});

const overview = computed(() => data.value || {});
const tasks = computed(() => overview.value.tasks || []);

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);
const num1 = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const pct = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(2));

const availColor = (v) => {
  const n = Number(v);
  if (n >= 99) return "#67c23a";
  if (n >= 90) return "#e6a23c";
  return "#f56c6c";
};
const statusType = (s) => {
  const k = String(s || "").toUpperCase();
  if (k === "UP" || k === "OK") return "success";
  if (k === "DOWN" || k === "FAIL") return "danger";
  return "info";
};
const statusText = (s) => {
  const k = String(s || "").toUpperCase();
  if (k === "UP" || k === "OK") return "正常";
  if (k === "DOWN" || k === "FAIL") return "异常";
  return s || "-";
};

const loadOverview = async () => {
  loading.value = true;
  try {
    const res = await getDialtestOverview(windowMin.value);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

// ----- 启用/停用 -----
const onToggle = async (row, val) => {
  try {
    await toggleDialtestTask(row.id, val);
    ElMessage.success(val ? "已启用" : "已停用");
  } catch (e) {
    row.enabled = !val;
    ElMessage.error("操作失败");
  }
};

// ----- 立即拨测 -----
const onRun = async (row) => {
  try {
    const res = await runDialtestTask(row.id);
    const r = res.content || {};
    if (r.success) {
      ElMessage.success(`拨测成功 · ${num1(r.latencyMs)}ms · ${r.code ?? ""}`);
    } else {
      ElMessage.warning(`拨测失败 · ${r.message || r.code || "未知错误"}`);
    }
    loadOverview();
  } catch (e) {
    ElMessage.error("拨测失败");
  }
};

// ----- 删除 -----
const onDelete = (row) => {
  ElMessageBox.confirm(`确认删除任务「${row.name}」？`, "提示", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      await deleteDialtestTask(row.id);
      ElMessage.success("删除成功");
      loadOverview();
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
  probeType: "HTTP",
  target: "",
  port: undefined,
  intervalSec: 60,
  timeoutMs: 5000,
  expectStatus: 200,
  expectContains: "",
  enabled: true,
});

const form = reactive(defaultForm());

const formRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  probeType: [{ required: true, message: "请选择探测类型", trigger: "change" }],
  target: [{ required: true, message: "请输入目标", trigger: "blur" }],
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
      await updateDialtestTask(payload);
      ElMessage.success("更新成功");
    } else {
      delete payload.id;
      await addDialtestTask(payload);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    loadOverview();
  } catch (e) {
    ElMessage.error("保存失败");
  } finally {
    saving.value = false;
  }
};

// ----- 拨测记录抽屉 -----
const drawerVisible = ref(false);
const currentTask = ref({});
const results = ref([]);
const chartRef = ref(null);
let chart = null;

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const ordered = [...results.value].reverse();
  chart.setOption(
    {
      tooltip: { trigger: "axis" },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: { type: "category", boundaryGap: false, data: ordered.map((r) => r.ts) },
      yAxis: { type: "value", name: "ms" },
      series: [
        {
          name: "时延", type: "line", smooth: true, showSymbol: false,
          areaStyle: { opacity: 0.12 }, data: ordered.map((r) => r.latencyMs),
        },
      ],
    },
    true
  );
};

const rerenderChart = () => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  if (drawerVisible.value && results.value.length) renderChart();
};
useChartSkin(rerenderChart);

const openResults = async (row) => {
  currentTask.value = row;
  drawerVisible.value = true;
  try {
    const res = await getDialtestResults(row.id, 50);
    results.value = res.content || [];
    await nextTick();
    if (results.value.length) renderChart();
  } catch (e) {
    results.value = [];
  }
};

let timer = null;
onMounted(() => {
  loadOverview();
  timer = setInterval(loadOverview, 10000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
  chart && chart.dispose();
  chart = null;
});
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
.ctrl-label {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.val-strong {
  font-weight: 600;
}
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: @space-md;
}
.latency-chart {
  height: @chart-h-sm;
  width: 100%;
}
</style>
