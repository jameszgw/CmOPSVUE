<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="240px" gap="8px" class="stat-grid">
      <StatCard dense icon="Grid" :label="`${d.guestLabel || '虚机'}总数`" :value="d.total ?? 0" sub="实例总数" color="#409eff" />
      <StatCard dense icon="VideoPlay" label="运行中" :value="d.running ?? 0" sub="running" color="#67c23a" />
      <StatCard dense icon="VideoPause" label="已停止" :value="d.stopped ?? 0" sub="stopped" :color="countColor(d.stopped)" />
    </CardGrid>

    <SectionCard dense :title="`${d.guestLabel || '虚机'}列表`" icon="List" class="span-all fill" scrollable bodyClass="dense-table fill">
      <template #extra>
        <el-tag size="small" :type="isReal ? 'success' : 'info'" style="margin-right: 6px">
          {{ isReal ? "真实采集" : "模拟数据" }}
        </el-tag>
        共 {{ (d.guests || []).length }} 项
      </template>
      <el-empty v-if="!(d.guests || []).length" description="暂无数据" :image-size="60" />
      <el-table v-else class="dense-table" height="100%" :data="d.guests || []" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="170" fixed>
          <template #default="{ row }"><span class="mono">{{ row.name || "-" }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :color="stateColor(row.state || row.powerState)" effect="dark" class="plain-tag">
              {{ stateLabel(row.state || row.powerState) }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- Docker 容器列 -->
        <template v-if="isDocker">
          <el-table-column prop="image" label="镜像" min-width="160" show-overflow-tooltip />
          <el-table-column label="CPU%" width="90" align="right">
            <template #default="{ row }">{{ row.cpuPct != null ? `${row.cpuPct}%` : "-" }}</template>
          </el-table-column>
          <el-table-column label="内存" width="100" align="right">
            <template #default="{ row }">{{ row.memMb != null ? `${row.memMb} MB` : "-" }}</template>
          </el-table-column>
          <el-table-column label="IP" min-width="120">
            <template #default="{ row }">{{ row.ip || "-" }}</template>
          </el-table-column>
          <el-table-column label="端口" min-width="120">
            <template #default="{ row }">{{ row.ports || "-" }}</template>
          </el-table-column>
          <el-table-column label="重启" width="80" align="center">
            <template #default="{ row }">
              <span :style="{ color: countColor(row.restarts) }">{{ row.restarts ?? 0 }}</span>
            </template>
          </el-table-column>
        </template>
        <!-- 虚拟机列 -->
        <template v-else>
          <el-table-column label="vCPU" width="80" align="center">
            <template #default="{ row }">{{ row.vcpu ?? row.vcpus ?? "-" }}</template>
          </el-table-column>
          <el-table-column label="内存" width="100" align="right">
            <template #default="{ row }">{{ memText(row) }}</template>
          </el-table-column>
          <el-table-column label="宿主" min-width="110">
            <template #default="{ row }"><span class="mono">{{ row.host || "-" }}</span></template>
          </el-table-column>
          <el-table-column label="IP" min-width="120">
            <template #default="{ row }">{{ row.ip || "-" }}</template>
          </el-table-column>
          <el-table-column label="操作系统" min-width="130" show-overflow-tooltip>
            <template #default="{ row }">{{ row.guestOs || "-" }}</template>
          </el-table-column>
          <el-table-column label="CPU%" width="90" align="right">
            <template #default="{ row }">{{ row.cpuPct != null ? `${row.cpuPct}%` : "-" }}</template>
          </el-table-column>
        </template>
        <el-table-column label="运行时长" width="120" align="center">
          <template #default="{ row }">{{ row.uptime || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getVirtGuests } from "@/api/monitor-virt";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const isDocker = computed(() => String(d.value.virtType || "").toUpperCase() === "DOCKER");
const isReal = computed(() => ["vsphere", "kvm", "docker"].includes(d.value.source));

const countColor = (v) => (Number(v) > 0 ? "#f56c6c" : "#67c23a");
const stateColor = (s) => {
  const v = String(s || "").toLowerCase();
  if (["running", "powered_on"].includes(v)) return "#67c23a";
  if (["paused", "suspended"].includes(v)) return "#e6a23c";
  return "#909399";
};
const stateLabel = (s) => {
  const map = { running: "运行", stopped: "停止", exited: "退出", paused: "暂停", POWERED_ON: "运行", POWERED_OFF: "关机", SUSPENDED: "挂起" };
  return map[s] || s || "-";
};
const memText = (row) => {
  if (row.memGb != null) return `${row.memGb} GB`;
  if (row.memMb != null) return `${(Number(row.memMb) / 1024).toFixed(1)} GB`;
  return "-";
};

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && Object.keys(data.value).length;
  if (!hasData) loading.value = true;
  try {
    const res = await getVirtGuests(props.deviceId);
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.stat-grid {
  flex-shrink: 0;
}
.span-all {
  grid-column: 1 / -1;
}
.mono {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
</style>
