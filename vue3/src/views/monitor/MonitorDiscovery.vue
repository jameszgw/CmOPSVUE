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
      </SectionCard>

      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            icon="Odometer"
            label="进度"
            :value="`${task.progress || 0}/${task.total || 0}`"
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

      <!-- 子网 -->
      <SectionCard title="子网" icon="Grid">
        <template v-if="subnets.length">
          <el-space wrap>
            <el-tag v-for="(sn, i) in subnets" :key="i" type="info">{{ sn }}</el-tag>
          </el-space>
        </template>
        <span v-else class="empty-text">-</span>
      </SectionCard>

      <!-- 发现结果 -->
      <SectionCard title="发现结果" icon="List">
        <template #extra>
          <el-space>
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
        <el-empty v-if="!nodes.length" description="暂无节点" />
        <el-table
          v-else
          :data="nodes"
          size="small"
          stripe
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="ip" label="IP" min-width="130">
            <template #default="{ row }">{{ row.ip || '-' }}</template>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  startDiscoveryScan,
  getDiscoveryTask,
  listDiscoveryTasks,
  importDiscovery,
} from "@/api/monitor-discovery";

const cidr = ref("");
const name = ref("");
const scanning = ref(false);
const buildTopology = ref(false);

const task = ref(null);
const recentTasks = ref([]);
const selectedRows = ref([]);

let pollTimer = null;

const nodes = computed(() => task.value?.nodes || []);
const subnets = computed(() => task.value?.subnets || []);
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

onMounted(loadRecent);
onBeforeUnmount(clearPoll);
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

.empty-text {
  color: var(--cm-text-secondary);
  font-size: 13px;
}
</style>
