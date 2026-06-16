<template>
  <div class="page-container">
    <!-- A) 网络扫描 -->
    <SectionCard title="网络扫描" icon="Search">
      <div class="scan-form">
        <el-input
          v-model="cidr"
          placeholder="如 192.168.1.0/24"
          clearable
          class="scan-form__cidr"
        />
        <el-input
          v-model="name"
          placeholder="任务名称(可选)"
          clearable
          class="scan-form__name"
        />
        <el-button
          type="primary"
          :loading="scanning"
          :disabled="!cidr"
          @click="onScan"
        >
          开始扫描
        </el-button>
        <el-button
          type="success"
          :loading="autoLoading"
          @click="onAutoDiscovery"
        >
          一键自动发现本机网段
        </el-button>
      </div>
      <div v-if="localSubnets.length" class="local-subnets">
        <span class="local-subnets__label">本机网段：</span>
        <el-space wrap>
          <el-tag v-for="(sn, i) in localSubnets" :key="i" size="small" type="info">
            {{ sn.cidr || sn }}
          </el-tag>
        </el-space>
      </div>
    </SectionCard>

    <!-- 自动发现进度 -->
    <SectionCard v-if="autoJob.status" title="自动发现进度" icon="MagicStick">
      <template #extra>
        <el-tag
          :type="autoJob.status === 'done' ? 'success' : autoJob.status === 'failed' ? 'danger' : 'warning'"
          size="small"
        >
          {{ autoJob.status === 'done' ? '完成' : autoJob.status === 'failed' ? '失败' : '运行中' }}
        </el-tag>
      </template>
      <div v-if="autoJob.phase" class="auto-job__phase">{{ autoJob.phase }}</div>
      <el-progress
        :percentage="autoJob.progress || 0"
        :status="autoJob.status === 'done' ? 'success' : autoJob.status === 'failed' ? 'exception' : ''"
        :stroke-width="14"
      />
      <div
        v-if="autoJob.found != null || autoJob.currentTarget"
        class="auto-job__live"
      >
        <span v-if="autoJob.found != null">已发现 {{ autoJob.found }}</span>
        <span v-if="autoJob.currentTarget"> · 最近 IP {{ autoJob.currentTarget }}</span>
      </div>
      <div v-if="autoJob.subnets && autoJob.subnets.length" class="auto-job__subnets">
        <span class="local-subnets__label">网段：</span>
        <el-space wrap>
          <el-tag v-for="(sn, i) in autoJob.subnets" :key="i" size="small" type="info">
            {{ sn.cidr || sn }}
          </el-tag>
        </el-space>
      </div>
    </SectionCard>

    <!-- B) 当前任务 -->
    <template v-if="task">
      <SectionCard title="扫描进度" icon="Loading">
        <template #extra>
          <el-tag :type="task.status === 'done' ? 'success' : 'warning'" size="small">
            {{ task.status === 'done' ? '完成' : '扫描中' }}
          </el-tag>
        </template>
        <el-progress
          :percentage="pct"
          :status="task.status === 'done' ? 'success' : ''"
          :stroke-width="14"
        />
        <div v-if="subnets.length" class="task-subnets">
          <span class="task-subnets__label">子网：</span>
          <el-space wrap>
            <el-tag v-for="(sn, i) in subnets" :key="i" size="small" type="info">{{ sn }}</el-tag>
          </el-space>
        </div>
      </SectionCard>

      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            icon="Odometer"
            label="已探测"
            :value="`${task.progress || 0}/${task.total || 0}`"
            :sub="`正在扫描: ${task.currentTarget || '—'}`"
            color="#409eff"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            icon="Cpu"
            label="发现节点"
            :value="task.found || 0"
            color="#67c23a"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            icon="Connection"
            label="网关"
            :value="task.gatewayIp || '-'"
            color="#e6a23c"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            icon="Grid"
            label="子网数"
            :value="subnets.length"
            color="#909399"
          />
        </el-col>
      </el-row>

      <!-- 发现结果 -->
      <SectionCard title="发现结果" icon="List">
        <template #extra>
          <el-space>
            <span
              v-if="unconfirmedCount > 0 && !showUnconfirmed"
              class="discovery-hint"
            >
              共 {{ visibleNodes.length }} 台（另有 {{ unconfirmedCount }} 个未确认IP已隐藏）
            </span>
            <el-switch
              v-model="showUnconfirmed"
              :active-text="`显示未确认IP (${unconfirmedCount})`"
              :disabled="unconfirmedCount === 0"
            />
            <el-switch v-model="buildTopology" active-text="构建拓扑" />
            <el-button
              size="small"
              :disabled="!selectedRows.length"
              @click="doImport(false)"
            >
              导入选中
            </el-button>
            <el-button size="small" type="primary" @click="doImport(true)">
              导入全部
            </el-button>
          </el-space>
        </template>
        <el-empty v-if="!visibleNodes.length" description="暂无节点" />
        <el-table
          v-else
          ref="resultTable"
          :data="visibleNodes"
          size="small"
          stripe
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="ip" label="IP" min-width="130">
            <template #default="{ row }">{{ row.ip || '-' }}</template>
          </el-table-column>
          <el-table-column label="确认" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.exists ? 'success' : 'info'">
                {{ row.exists ? '设备' : '未确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="hostname" label="主机名" min-width="140">
            <template #default="{ row }">{{ row.hostname || '-' }}</template>
          </el-table-column>
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.deviceClass" :type="classTagType(row.deviceClass)" size="small">
                {{ row.deviceClass }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="os" label="操作系统" min-width="120">
            <template #default="{ row }">{{ row.os || '-' }}</template>
          </el-table-column>
          <el-table-column prop="vendor" label="厂商" min-width="110">
            <template #default="{ row }">{{ row.vendor || '-' }}</template>
          </el-table-column>
          <el-table-column label="开放端口" min-width="140">
            <template #default="{ row }">{{ (row.openPorts || []).join(', ') || '-' }}</template>
          </el-table-column>
          <el-table-column label="时延" width="90" align="right">
            <template #default="{ row }">{{ row.rttMs != null ? `${row.rttMs} ms` : '-' }}</template>
          </el-table-column>
        </el-table>
      </SectionCard>
    </template>

    <!-- C) 最近任务 -->
    <SectionCard title="最近任务" icon="Clock">
      <el-empty v-if="!recentTasks.length" description="暂无任务" />
      <el-table v-else :data="recentTasks" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140">
          <template #default="{ row }">{{ row.name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="cidr" label="CIDR" min-width="150">
          <template #default="{ row }">{{ row.cidr || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'done' ? 'success' : 'warning'" size="small">
              {{ row.status === 'done' ? '完成' : '扫描中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="110" align="center">
          <template #default="{ row }">{{ `${row.progress || 0}/${row.total || 0}` }}</template>
        </el-table-column>
        <el-table-column prop="found" label="发现" width="80" align="center">
          <template #default="{ row }">{{ row.found || 0 }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="创建时间" min-width="170">
          <template #default="{ row }">{{ row.gmtCreate || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewTask(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  startDiscoveryScan,
  getDiscoveryTask,
  listDiscoveryTasks,
  importDiscovery,
  autoDiscovery,
  getAutoStatus,
  getLocalSubnets,
} from "@/api/monitor-discovery";

const cidr = ref("");
const name = ref("");
const scanning = ref(false);
const buildTopology = ref(false);
const showUnconfirmed = ref(false);
const resultTable = ref(null);
const autoLoading = ref(false);
const localSubnets = ref([]);
const autoJob = ref({});

const task = ref(null);
const recentTasks = ref([]);
const selectedRows = ref([]);

let pollTimer = null;
let autoTimer = null;

const nodes = computed(() => task.value?.nodes || []);
const visibleNodes = computed(() =>
  showUnconfirmed.value
    ? nodes.value
    : nodes.value.filter((n) => n.exists === true)
);
const unconfirmedCount = computed(
  () => nodes.value.filter((n) => n.exists === false).length
);
const subnets = computed(() => task.value?.subnets || []);

watch(showUnconfirmed, (val) => {
  if (!val) {
    // 隐藏未确认IP后，清除不再可见的已选中行，避免脏选择
    const stale = (selectedRows.value || []).some((r) => r.exists === false);
    if (stale) resultTable.value?.clearSelection();
    selectedRows.value = (selectedRows.value || []).filter(
      (r) => r.exists === true
    );
  }
});
const pct = computed(() => {
  const t = task.value || {};
  return t.total ? Math.round((t.progress / t.total) * 100) : 0;
});

const classTagType = (cls) => {
  switch (cls) {
    case "router":
    case "gateway":
      return "warning";
    case "server":
      return "success";
    case "switch":
      return "";
    case "printer":
    case "iot":
      return "info";
    default:
      return "";
  }
};

const clearPoll = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const pollOnce = async (taskId) => {
  try {
    const res = await getDiscoveryTask(taskId);
    task.value = res?.content || {};
    if (task.value?.status === "done") {
      clearPoll();
      scanning.value = false;
      loadRecent();
    }
  } catch (e) {
    clearPoll();
    scanning.value = false;
  }
};

const startPoll = (taskId) => {
  clearPoll();
  if (!taskId) return;
  pollOnce(taskId);
  pollTimer = setInterval(() => pollOnce(taskId), 1000);
};

const onScan = async () => {
  if (!cidr.value) return;
  scanning.value = true;
  try {
    const res = await startDiscoveryScan({ cidr: cidr.value, name: name.value });
    const taskId = res?.content?.taskId;
    if (!taskId) {
      scanning.value = false;
      ElMessage.error("发起扫描失败");
      return;
    }
    selectedRows.value = [];
    startPoll(taskId);
  } catch (e) {
    scanning.value = false;
    ElMessage.error("发起扫描失败");
  }
};

const loadLocalSubnets = async () => {
  try {
    const res = await getLocalSubnets();
    localSubnets.value = res?.content || [];
  } catch (e) {
    localSubnets.value = [];
  }
};

const clearAutoPoll = () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
};

const autoPollOnce = async (jobId) => {
  try {
    const res = await getAutoStatus(jobId);
    const c = res?.content || {};
    autoJob.value = c;
    if (c.subnets?.length) {
      localSubnets.value = c.subnets;
    }
    if (c.status === "done") {
      clearAutoPoll();
      autoLoading.value = false;
      ElMessage.success(
        `已自动发现 ${c.imported || 0} 台设备（网段：${(c.subnets || []).length} 个）${
          c.viewId ? "，已生成拓扑" : ""
        }`
      );
      loadRecent();
      loadLocalSubnets();
      setTimeout(() => {
        autoJob.value = {};
      }, 4000);
    } else if (c.status === "failed") {
      clearAutoPoll();
      autoLoading.value = false;
      ElMessage.error(c.message || "自动发现失败");
    }
  } catch (e) {
    clearAutoPoll();
    autoLoading.value = false;
    ElMessage.error("自动发现失败");
  }
};

const onAutoDiscovery = async () => {
  autoLoading.value = true;
  autoJob.value = { status: "running", progress: 0, phase: "正在启动…" };
  try {
    const res = await autoDiscovery({ buildTopology: true });
    const jobId = res?.content?.jobId;
    if (!jobId) {
      clearAutoPoll();
      autoLoading.value = false;
      autoJob.value = {};
      ElMessage.error("自动发现启动失败");
      return;
    }
    clearAutoPoll();
    autoPollOnce(jobId);
    autoTimer = setInterval(() => autoPollOnce(jobId), 1500);
  } catch (e) {
    clearAutoPoll();
    autoLoading.value = false;
    autoJob.value = {};
    ElMessage.error("自动发现失败");
  }
};

const onSelectionChange = (rows) => {
  selectedRows.value = rows || [];
};

const doImport = async (all) => {
  const taskId = task.value?.taskId;
  if (!taskId) return;
  const payload = { taskId, buildTopology: buildTopology.value };
  if (!all) payload.ips = (selectedRows.value || []).map((r) => r.ip);
  try {
    const res = await importDiscovery(payload);
    const c = res?.content || {};
    ElMessage.success(
      `导入成功：新增 ${c.imported || 0} 个，跳过 ${c.skipped || 0}，视图 ${c.viewId || "-"}`
    );
    loadRecent();
  } catch (e) {
    ElMessage.error("导入失败");
  }
};

const loadRecent = async () => {
  try {
    const res = await listDiscoveryTasks();
    recentTasks.value = res?.content || [];
  } catch (e) {
    recentTasks.value = [];
  }
};

const viewTask = async (row) => {
  const taskId = row?.taskId;
  if (!taskId) return;
  try {
    const res = await getDiscoveryTask(taskId);
    task.value = res?.content || {};
    selectedRows.value = [];
    if (task.value?.status === "running") {
      scanning.value = true;
      startPoll(taskId);
    } else {
      clearPoll();
      scanning.value = false;
    }
  } catch (e) {
    ElMessage.error("加载任务失败");
  }
};

onMounted(() => {
  loadRecent();
  loadLocalSubnets();
});
onBeforeUnmount(() => {
  clearPoll();
  clearAutoPoll();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

/* 独立页（无 MonitorLayout）：用 page-container 自然高度，由 layout-main 滚动，
   避免堆叠的 SectionCard(height:100%) 在固定高容器内被拉伸留白 */

.scan-form {
  display: flex;
  align-items: center;
  gap: @space-md;
  flex-wrap: wrap;

  &__cidr {
    width: 220px;
  }

  &__name {
    width: 180px;
  }
}

.stat-row {
  margin-bottom: 4px;

  .el-col {
    margin-bottom: @space-lg;
  }
}

.local-subnets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: @space-sm;
  margin-top: @space-md;

  &__label {
    color: var(--cm-text-secondary);
    font-size: 13px;
  }
}

.empty-text {
  color: var(--cm-text-secondary);
  font-size: 13px;
}

.task-subnets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: @space-sm;
  margin-top: @space-md;

  &__label {
    color: var(--cm-text-secondary);
    font-size: 13px;
  }
}

.auto-job__phase {
  margin-bottom: @space-sm;
  color: var(--cm-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.auto-job__live {
  margin-top: @space-sm;
  color: var(--cm-text-secondary);
  font-size: 13px;
}

.auto-job__subnets {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: @space-sm;
  margin-top: @space-md;
}

.discovery-hint {
  color: var(--cm-text-secondary);
  font-size: 12px;
}
</style>
