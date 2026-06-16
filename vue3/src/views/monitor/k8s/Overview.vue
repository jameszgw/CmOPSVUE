<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Cpu" label="节点" :value="`${d.nodeReady ?? 0}/${d.nodeTotal ?? 0}`"
          :sub="`就绪 ${d.nodeReady ?? 0} / 未就绪 ${d.nodeNotReady ?? 0}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Box" label="Pod" :value="d.podRunning ?? 0"
          :sub="`Pending ${d.podPending ?? 0} / Failed ${d.podFailed ?? 0}`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Odometer" label="CPU 使用率" :value="`${num(d.cpu?.usedPct)}%`"
          :percent="d.cpu?.usedPct" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Coin" label="内存使用率" :value="`${num(d.memory?.usedPct)}%`"
          :percent="d.memory?.usedPct" color="#9254de" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="集群基础信息" icon="InfoFilled">
          <template #extra>
            <el-tag size="small" :type="['agent','ssh','snmp'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="控制平面健康" icon="SetUp">
          <div class="cp-grid">
            <div v-for="cp in controlPlaneItems" :key="cp.key" class="cp-item">
              <span class="cp-item__label">{{ cp.label }}</span>
              <el-tag size="small" :color="statusColor(cp.value)" effect="dark" class="cp-tag">
                {{ cp.value || "-" }}
              </el-tag>
            </div>
          </div>
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="工作负载汇总" icon="Grid">
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

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="CPU 请求 vs 使用" icon="Odometer">
          <div class="bar-line">
            <span class="bar-line__label">请求</span>
            <el-progress :percentage="clamp(d.cpu?.requestedPct)" :stroke-width="14" color="#409eff" />
          </div>
          <div class="bar-line">
            <span class="bar-line__label">使用</span>
            <el-progress :percentage="clamp(d.cpu?.usedPct)" :stroke-width="14" color="#e6a23c" />
          </div>
          <div class="bar-sub">
            容量 {{ d.cpu?.capacity ?? "-" }} / 可分配 {{ d.cpu?.allocatable ?? "-" }} / 使用 {{ d.cpu?.usedCores ?? "-" }}
          </div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="内存 请求 vs 使用" icon="Coin">
          <div class="bar-line">
            <span class="bar-line__label">请求</span>
            <el-progress :percentage="clamp(d.memory?.requestedPct)" :stroke-width="14" color="#409eff" />
          </div>
          <div class="bar-line">
            <span class="bar-line__label">使用</span>
            <el-progress :percentage="clamp(d.memory?.usedPct)" :stroke-width="14" color="#9254de" />
          </div>
          <div class="bar-sub">
            容量 {{ d.memory?.capacity ?? "-" }} / 可分配 {{ d.memory?.allocatable ?? "-" }} / 使用 {{ d.memory?.used ?? "-" }}
          </div>
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="Top 节点" icon="Sort">
      <template #extra>共 {{ (d.topNodes || []).length }} 个节点</template>
      <el-empty v-if="!(d.topNodes || []).length" description="暂无数据" />
      <el-table v-else :data="d.topNodes || []" size="small" stripe>
        <el-table-column prop="name" label="节点名称" min-width="180" />
        <el-table-column label="CPU%" min-width="220">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12"
              :color="pctColor(row.cpuPct)" />
          </template>
        </el-table-column>
        <el-table-column label="内存%" min-width="220">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.memPct)" :stroke-width="12"
              :color="pctColor(row.memPct)" />
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
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sOverview } from "@/api/monitor-k8s";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const pctColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#67c23a";
};
const statusColor = (s) => {
  if (["Ready", "Healthy", "Bound", "Running"].includes(s)) return "#67c23a";
  if (["Warning", "Pending"].includes(s)) return "#e6a23c";
  if (["NotReady", "Failed", "CrashLoopBackOff", "Unhealthy"].includes(s)) return "#f56c6c";
  return "#909399";
};

const basicRows = computed(() => {
  const v = d.value;
  return [
    { label: "集群名称", value: v.clusterName },
    { label: "版本", value: v.version },
    { label: "发行版", value: v.distro },
    { label: "运行时", value: v.runtime },
    { label: "CNI", value: v.cni },
    { label: "API Server", value: v.apiServer },
    { label: "命名空间数", value: v.namespaceCount },
  ];
});

const controlPlaneItems = computed(() => {
  const cp = d.value.controlPlane || {};
  return [
    { key: "apiserver", label: "API Server", value: cp.apiserver },
    { key: "etcd", label: "etcd", value: cp.etcd },
    { key: "scheduler", label: "Scheduler", value: cp.scheduler },
    { key: "controllerManager", label: "Controller Manager", value: cp.controllerManager },
  ];
});

const workloadItems = computed(() => {
  const v = d.value;
  return [
    { label: "Deployment", value: v.deploymentCount, icon: "Files", color: "#409eff" },
    { label: "StatefulSet", value: v.statefulSetCount, icon: "Coin", color: "#67c23a" },
    { label: "DaemonSet", value: v.daemonSetCount, icon: "SetUp", color: "#e6a23c" },
    { label: "Service", value: v.serviceCount, icon: "Connection", color: "#9254de" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getK8sOverview(props.deviceId);
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
.cp-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.cp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--cm-border-light);
  border-radius: 8px;
  padding: 12px 14px;

  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
  }
}
.cp-tag {
  border: none;
  color: var(--cm-bg-card);
}
.count-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
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
.bar-line {
  display: flex;
  align-items: center;
  margin-bottom: 14px;

  &__label {
    width: 48px;
    font-size: 13px;
    color: var(--cm-text-regular);
    flex-shrink: 0;
  }
  :deep(.el-progress) {
    flex: 1;
  }
}
.bar-sub {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
</style>
