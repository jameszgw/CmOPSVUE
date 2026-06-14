<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="VideoPlay" label="运行中" :value="d.running ?? 0"
          sub="Running Pod" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Clock" label="Pending" :value="d.pending ?? 0"
          sub="等待调度" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="CircleClose" label="失败" :value="d.failed ?? 0"
          sub="Failed Pod" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="CrashLoopBackOff" :value="d.crashLoop ?? 0"
          :sub="`OOMKilled ${d.oomKilledTotal ?? 0}`" color="#f56c6c" />
      </el-col>
    </el-row>

    <SectionCard title="工作负载类型计数" icon="Grid">
      <div class="count-grid">
        <div v-for="w in workloadItems" :key="w.label" class="count-card">
          <span class="count-card__icon" :style="{ color: w.color }">
            <el-icon :size="20"><component :is="w.icon" /></el-icon>
          </span>
          <span class="count-card__value">{{ w.value ?? 0 }}</span>
          <span class="count-card__label">{{ w.label }}</span>
        </div>
      </div>
    </SectionCard>

    <SectionCard title="Pod 列表" icon="List">
      <template #extra>
        <el-select v-model="statusFilter" size="small" placeholder="状态" style="width: 160px">
          <el-option label="全部" value="" />
          <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
        </el-select>
      </template>
      <el-empty v-if="!filteredPods.length" description="暂无数据" />
      <el-table v-else :data="filteredPods" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="200" fixed>
          <template #default="{ row }">
            <span class="pod-name">{{ row.name || "-" }}</span>
            <el-tag v-if="row.oomKilled" size="small" type="danger" effect="dark" class="oom-tag">
              OOMKilled
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="namespace" label="命名空间" width="150">
          <template #default="{ row }">{{ row.namespace || "-" }}</template>
        </el-table-column>
        <el-table-column prop="node" label="节点" min-width="160">
          <template #default="{ row }">{{ row.node || "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="就绪" width="90" align="center">
          <template #default="{ row }">{{ row.ready || "-" }}</template>
        </el-table-column>
        <el-table-column label="重启" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: (row.restarts || 0) > 0 ? '#e6a23c' : '#303133' }">
              {{ row.restarts ?? 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="CPU" width="100" align="right">
          <template #default="{ row }">{{ row.cpu || "-" }}</template>
        </el-table-column>
        <el-table-column label="内存" width="100" align="right">
          <template #default="{ row }">{{ row.mem || "-" }}</template>
        </el-table-column>
        <el-table-column label="Age" width="100">
          <template #default="{ row }">{{ row.age || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <SectionCard title="重启 Top" icon="Sort">
      <template #extra>重启次数最多的 Pod</template>
      <el-empty v-if="!(d.topRestart || []).length" description="暂无数据" />
      <el-table v-else :data="d.topRestart || []" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="220">
          <template #default="{ row }">
            <span class="pod-name">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="namespace" label="命名空间" width="160">
          <template #default="{ row }">{{ row.namespace || "-" }}</template>
        </el-table-column>
        <el-table-column label="重启次数" width="120" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600">{{ row.restarts ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="160">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getK8sPods } from "@/api/monitor-k8s";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const statusFilter = ref("");

const statusColor = (s) => {
  if (["Ready", "Healthy", "Bound", "Running"].includes(s)) return "#67c23a";
  if (["Warning", "Pending"].includes(s)) return "#e6a23c";
  if (["NotReady", "Failed", "CrashLoopBackOff", "Unhealthy"].includes(s)) return "#f56c6c";
  return "#909399";
};

const workloadItems = computed(() => {
  const w = d.value.workloads || {};
  return [
    { label: "Deployment", value: w.deployments, icon: "Files", color: "#409eff" },
    { label: "StatefulSet", value: w.statefulSets, icon: "Coin", color: "#67c23a" },
    { label: "DaemonSet", value: w.daemonSets, icon: "SetUp", color: "#e6a23c" },
    { label: "Job", value: w.jobs, icon: "Briefcase", color: "#9254de" },
    { label: "CronJob", value: w.cronJobs, icon: "Timer", color: "#f56c6c" },
  ];
});

const statusOptions = computed(() => {
  const set = new Set();
  (d.value.pods || []).forEach((p) => p.status && set.add(p.status));
  return [...set];
});

const filteredPods = computed(() => {
  const pods = d.value.pods || [];
  if (!statusFilter.value) return pods;
  return pods.filter((p) => p.status === statusFilter.value);
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getK8sPods(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.count-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.count-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  padding: 16px 12px;

  &__icon {
    margin-bottom: 8px;
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
  &__label {
    margin-top: 4px;
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
}
.pod-name {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.oom-tag {
  margin-left: 6px;
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
</style>
