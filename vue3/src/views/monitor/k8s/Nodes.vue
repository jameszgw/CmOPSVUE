<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Cpu" label="节点总数" :value="d.total ?? 0"
          sub="集群节点数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="CircleCheck" label="就绪" :value="d.ready ?? 0"
          sub="Ready 节点" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="CircleClose" label="未就绪" :value="d.notReady ?? 0"
          sub="NotReady 节点" color="#f56c6c" />
      </el-col>
    </el-row>

    <SectionCard title="节点列表" icon="List">
      <template #extra>共 {{ (d.nodes || []).length }} 个节点</template>
      <el-empty v-if="!(d.nodes || []).length" description="暂无数据" />
      <el-table v-else :data="d.nodes || []" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="160" fixed>
          <template #default="{ row }">
            <span class="node-name">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="row.role === 'control-plane' ? 'warning' : 'info'" effect="plain">
              {{ row.role || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CPU%" width="160">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="10"
              :color="pctColor(row.cpuPct)" />
          </template>
        </el-table-column>
        <el-table-column label="内存%" width="160">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.memPct)" :stroke-width="10"
              :color="pctColor(row.memPct)" />
          </template>
        </el-table-column>
        <el-table-column label="Pod" width="100" align="center">
          <template #default="{ row }">{{ row.podCount ?? 0 }}/{{ row.podCapacity ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="重启" width="80" align="center">
          <template #default="{ row }">{{ row.restarts ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="压力" width="200">
          <template #default="{ row }">
            <template v-if="row.memoryPressure || row.diskPressure || row.pidPressure">
              <el-tag v-if="row.memoryPressure" size="small" type="danger" effect="dark" class="press-tag">Memory</el-tag>
              <el-tag v-if="row.diskPressure" size="small" type="danger" effect="dark" class="press-tag">Disk</el-tag>
              <el-tag v-if="row.pidPressure" size="small" type="danger" effect="dark" class="press-tag">PID</el-tag>
            </template>
            <span v-else class="no-press">无</span>
          </template>
        </el-table-column>
        <el-table-column label="kubelet 版本" width="140">
          <template #default="{ row }">{{ row.kubeletVersion || "-" }}</template>
        </el-table-column>
        <el-table-column label="OS" min-width="160">
          <template #default="{ row }">{{ row.os || "-" }}</template>
        </el-table-column>
        <el-table-column label="Age" width="100">
          <template #default="{ row }">{{ row.age || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getK8sNodes } from "@/api/monitor-k8s";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

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

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getK8sNodes(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.node-name {
  font-family: monospace;
  color: #303133;
}
.plain-tag {
  border: none;
  color: #fff;
}
.press-tag {
  margin-right: 4px;
}
.no-press {
  color: #909399;
  font-size: 12px;
}
</style>
