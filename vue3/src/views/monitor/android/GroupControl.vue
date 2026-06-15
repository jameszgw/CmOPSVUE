<template>
  <div v-loading="loading" class="tab-pane">
    <el-alert
      title="群控批量为模拟结果"
      type="warning"
      :description="d.note || '群控批量任务数据为模拟展示，仅供参考'"
      show-icon
      :closable="false"
      class="note-banner"
    />

    <SectionCard title="下发批量任务" icon="Promotion" class="dispatch-card">
      <el-form inline class="dispatch-form" @submit.prevent>
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType" size="small" style="width: 150px">
            <el-option label="批量安装APK" value="install" />
            <el-option label="批量重启" value="reboot" />
            <el-option label="Shell命令" value="shell" />
            <el-option label="清理缓存" value="clearcache" />
          </el-select>
        </el-form-item>
        <el-form-item label="作用范围">
          <el-input v-model="form.scope" size="small" style="width: 220px"
            placeholder="作用范围，如 在线实例 / 全部 / 标签:电商" />
        </el-form-item>
        <el-form-item v-if="form.taskType === 'install'" label="APK 路径">
          <el-input v-model="form.payload" size="small" style="width: 240px"
            placeholder="APK 本地路径，如 /data/app.apk" />
        </el-form-item>
        <el-form-item v-else-if="form.taskType === 'shell'" label="命令">
          <el-input v-model="form.payload" size="small" style="width: 240px"
            placeholder="shell 命令，如 input keyevent 3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" :loading="submitting" @click="onDispatch">下发</el-button>
        </el-form-item>
      </el-form>
    </SectionCard>

    <SectionCard title="群控任务" icon="Operation">
      <template #extra>运行中 {{ d.runningTasks ?? 0 }}</template>
      <el-empty v-if="!items.length" description="暂无数据" />
      <el-table v-else :data="items" size="small" stripe>
        <el-table-column prop="name" label="任务名称" min-width="160">
          <template #default="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" min-width="140">
          <template #default="{ row }">{{ row.scope || "-" }}</template>
        </el-table-column>
        <el-table-column label="进度" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.progressPct)" :stroke-width="12"
              :color="pctColor(row.progressPct)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="影响实例" width="110" align="center">
          <template #default="{ row }">{{ row.affected ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="创建时间" min-width="170">
          <template #default="{ row }">{{ row.gmtCreate || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <SectionCard title="下发历史" icon="Tickets">
      <template #extra>共 {{ history.length }} 条</template>
      <el-empty v-if="!history.length" description="暂无下发记录" />
      <el-table v-else :data="history" size="small" stripe>
        <el-table-column prop="taskType" label="任务类型" min-width="120">
          <template #default="{ row }">{{ row.taskType || "-" }}</template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" min-width="140">
          <template #default="{ row }">{{ row.scope || "-" }}</template>
        </el-table-column>
        <el-table-column label="来源" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === 'agent' ? 'success' : 'info'">
              {{ row.source === "agent" ? "真实·agent" : "模拟·simulated" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="结果" min-width="120">
          <template #default="{ row }">{{ row.result || "-" }}</template>
        </el-table-column>
        <el-table-column label="影响" width="100" align="center">
          <template #default="{ row }">{{ row.affected ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="时间" min-width="170">
          <template #default="{ row }">{{ row.gmtCreate || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAndroidGroupControl, dispatchGroupControl } from "@/api/monitor-android";
import { getDispatchHistory } from "@/api/monitor-dispatch";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const submitting = ref(false);
const form = reactive({ taskType: "install", scope: "", payload: "" });
const data = ref({});
const d = computed(() => data.value || {});
const items = computed(() => d.value.items || []);
const history = ref([]);

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 100) return "#67c23a";
  if (n >= 50) return "#409eff";
  return "#e6a23c";
};
const statusTagType = (s) => {
  if (["done", "success", "completed", "已完成", "成功"].includes(s)) return "success";
  if (["running", "进行中", "运行中"].includes(s)) return "primary";
  if (["pending", "queued", "等待中", "排队"].includes(s)) return "warning";
  if (["failed", "error", "失败", "异常"].includes(s)) return "danger";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getAndroidGroupControl(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

const loadHistory = async () => {
  if (!props.deviceId) return;
  try {
    const res = await getDispatchHistory({ deviceId: props.deviceId, pageNo: 1, pageSize: 10 });
    history.value = res.content?.items || [];
  } catch (e) {
    history.value = [];
  }
};

const loadAll = () => {
  load();
  loadHistory();
};

const onDispatch = async () => {
  if (!props.deviceId) {
    ElMessage.warning("缺少设备ID，无法下发");
    return;
  }
  submitting.value = true;
  try {
    const res = await dispatchGroupControl({
      deviceId: props.deviceId,
      taskType: form.taskType,
      scope: form.scope,
      payload: form.payload,
    });
    const c = res.content || {};
    if (c.source === "agent") {
      ElMessage.success(
        `已真实下发：影响 ${c.affected ?? 0} 台，成功 ${c.okCount ?? 0}，失败 ${c.failCount ?? 0}`
      );
    } else {
      ElMessage.success(`已受理(模拟)：${c.note || c.taskId || "-"}`);
    }
    await load();
    await loadHistory();
  } finally {
    submitting.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], loadAll);
onMounted(loadAll);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.note-banner {
  margin-bottom: 12px;
}
.dispatch-card {
  margin-bottom: 12px;
}
.dispatch-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}
</style>
