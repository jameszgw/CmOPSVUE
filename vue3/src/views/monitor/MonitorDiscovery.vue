<template>
  <ScreenPage title="网络发现" gap="8px">
    <!-- 扫描表单：作为顶部工具栏 -->
    <template #header-extra>
      <div class="scan-form">
        <el-input
          v-model="cidr"
          size="small"
          placeholder="如 192.168.1.0/24"
          clearable
          class="scan-form__cidr"
        />
        <el-input
          v-model="name"
          size="small"
          placeholder="任务名称(可选)"
          clearable
          class="scan-form__name"
        />
        <el-button
          size="small"
          type="primary"
          :loading="scanning"
          :disabled="!cidr"
          @click="onScan"
        >
          开始扫描
        </el-button>
        <el-button
          size="small"
          type="success"
          :loading="autoLoading"
          @click="onAutoDiscovery"
        >
          一键自动发现本机网段
        </el-button>
      </div>
    </template>

    <!-- 本机网段 + 进度（紧凑，按需显示）-->
    <CardGrid
      v-if="localSubnets.length || autoJob.status || task"
      min="320px"
      gap="8px"
      class="row-meta"
    >
      <SectionCard v-if="localSubnets.length" dense title="本机网段" icon="Connection">
        <el-space wrap>
          <el-tag v-for="(sn, i) in localSubnets" :key="i" size="small" type="info">
            {{ sn.cidr || sn }}
          </el-tag>
        </el-space>
      </SectionCard>

      <SectionCard v-if="autoJob.status" dense title="自动发现进度" icon="MagicStick">
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
          :stroke-width="12"
        />
        <div
          v-if="autoJob.found != null || autoJob.currentTarget"
          class="auto-job__live"
        >
          <span v-if="autoJob.found != null">已发现 {{ autoJob.found }}</span>
          <span v-if="autoJob.currentTarget"> · 最近 IP {{ autoJob.currentTarget }}</span>
        </div>
      </SectionCard>

      <SectionCard v-if="task" dense title="扫描进度" icon="Loading">
        <template #extra>
          <el-tag :type="task.status === 'done' ? 'success' : 'warning'" size="small">
            {{ task.status === 'done' ? '完成' : '扫描中' }}
          </el-tag>
        </template>
        <el-progress
          :percentage="pct"
          :status="task.status === 'done' ? 'success' : ''"
          :stroke-width="12"
        />
        <div class="task-meta">
          <span>已探测 {{ task.progress || 0 }}/{{ task.total || 0 }}</span>
          <span>发现 {{ task.found || 0 }}</span>
          <span>网关 {{ task.gatewayIp || '-' }}</span>
          <span>子网 {{ subnets.length }}</span>
        </div>
        <div v-if="task.currentTarget" class="task-meta__cur">正在扫描: {{ task.currentTarget }}</div>
      </SectionCard>
    </CardGrid>

    <!-- 发现结果（当前任务，内部滚动）-->
    <SectionCard
      v-if="task"
      dense
      scrollable
      bodyClass="dense-table fill"
      class="row-result fill"
      title="发现结果"
      icon="List"
    >
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
            size="small"
            :active-text="`显示未确认IP (${unconfirmedCount})`"
            :disabled="unconfirmedCount === 0"
          />
          <el-switch v-model="buildTopology" size="small" active-text="构建拓扑" />
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
      <el-empty v-if="!visibleNodes.length" description="暂无节点" :image-size="60" />
      <el-table
        v-else
        ref="resultTable"
        class="dense-table"
        height="100%"
        :data="visibleNodes"
        size="small"
        stripe
        @selection-change="onSelectionChange"
      >
        <el-table-column
          type="selection"
          width="48"
          :selectable="(row) => !row.imported"
        />
        <el-table-column prop="ip" label="IP" min-width="130">
          <template #default="{ row }">{{ row.ip || '-' }}</template>
        </el-table-column>
        <el-table-column prop="mac" label="MAC" min-width="150">
          <template #default="{ row }">{{ row.mac || '-' }}</template>
        </el-table-column>
        <el-table-column label="确认" width="140">
          <template #default="{ row }">
            <el-space :size="4" wrap>
              <el-tag size="small" :type="row.exists ? 'success' : 'info'">
                {{ row.exists ? '设备' : '未确认' }}
              </el-tag>
              <el-tag v-if="row.imported" size="small" type="warning">
                已导入
              </el-tag>
            </el-space>
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

    <!-- 最近任务（内部滚动）-->
    <SectionCard
      dense
      scrollable
      bodyClass="dense-table fill"
      :class="['row-recent', { fill: !task }]"
      title="最近任务"
      icon="Clock"
    >
      <el-empty v-if="!recentTasks.length" description="暂无任务" :image-size="60" />
      <el-table v-else class="dense-table" height="100%" :data="recentTasks" size="small" stripe>
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
  </ScreenPage>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
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
    if (c.note) {
      // 后端已提供可读消息：有新增用成功提示，否则用普通提示
      (c.imported > 0 ? ElMessage.success : ElMessage.info)(c.note);
    } else {
      ElMessage.success(
        `导入成功：新增 ${c.imported || 0} 个，跳过 ${c.skipped || 0}，视图 ${c.viewId || "-"}`
      );
    }
    loadRecent();
    // 刷新当前任务，使已导入 IP 的标记同步（变为不可选 / 显示已导入）
    if (taskId) {
      try {
        const r = await getDiscoveryTask(taskId);
        task.value = r?.content || task.value;
      } catch (e) {
        /* 忽略刷新失败 */
      }
    }
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

.scan-form {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;

  &__cidr {
    width: 200px;
  }

  &__name {
    width: 160px;
  }
}

.row-meta {
  flex-shrink: 0;
}

// 有当前任务时：结果表占据剩余空间内部滚动；最近任务给一个有上限的紧凑高度
.row-result {
  flex: 1;
  min-height: 0;
}
.row-recent {
  flex-shrink: 0;
  max-height: 220px;
  display: flex;
  flex-direction: column;
}
// 无当前任务时，最近任务占满剩余空间（由模板 :class fill 控制）
.row-recent.fill {
  flex: 1;
  max-height: none;
}

.auto-job__phase {
  margin-bottom: @space-sm;
  color: var(--cm-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.auto-job__live {
  margin-top: @space-sm;
  color: var(--cm-text-secondary);
  font-size: 12px;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: @space-md;
  margin-top: @space-sm;
  font-size: 12px;
  color: var(--cm-text-regular);

  &__cur {
    margin-top: @space-xs;
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
}

.discovery-hint {
  color: var(--cm-text-secondary);
  font-size: 12px;
}
</style>
