<template>
  <div class="page-container discovery-page">
    <el-row :gutter="12">
      <!-- 左侧：扫描发起 + 最近任务 -->
      <el-col :xs="24" :lg="7">
        <SectionCard title="网络扫描" icon="el-icon-search">
          <el-form label-width="78px" @submit.native.prevent>
            <el-form-item label="网段 CIDR">
              <el-input v-model="cidr" placeholder="如 10.20.30.0/24" clearable />
            </el-form-item>
            <el-form-item label="名称">
              <el-input v-model="name" placeholder="可选，扫描任务名称" clearable />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                icon="el-icon-position"
                :loading="scanning"
                @click="startScan"
              >
                开始扫描
              </el-button>
              <el-button
                type="success"
                icon="el-icon-magic-stick"
                :loading="autoLoading"
                @click="autoDiscover"
              >
                一键自动发现本机网段
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="localSubnets.length" class="local-subnets">
            本机网段：
            <el-tag
              v-for="(s, i) in localSubnets"
              :key="i"
              size="mini"
              effect="plain"
              class="subnet-tag"
            >
              {{ subnetText(s) }}
            </el-tag>
          </div>

          <div v-if="autoJob.status" class="auto-job">
            <div class="auto-job__head">
              <span class="auto-job__title">自动发现进度</span>
              <el-tag
                size="mini"
                effect="light"
                :type="autoJob.status === 'done' ? 'success' : autoJob.status === 'failed' ? 'danger' : 'warning'"
              >
                {{ autoJob.status === 'done' ? '完成' : autoJob.status === 'failed' ? '失败' : '运行中' }}
              </el-tag>
            </div>
            <div v-if="autoJob.phase" class="auto-job__phase">{{ autoJob.phase }}</div>
            <el-progress
              :percentage="autoJob.progress || 0"
              :status="autoJob.status === 'done' ? 'success' : autoJob.status === 'failed' ? 'exception' : undefined"
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
              网段：
              <el-tag
                v-for="(s, i) in autoJob.subnets"
                :key="i"
                size="mini"
                effect="plain"
                class="subnet-tag"
              >
                {{ subnetText(s) }}
              </el-tag>
            </div>
          </div>

          <div v-if="task" class="scan-progress">
            <div class="scan-progress__head">
              <span class="mono">{{ task.cidr }}</span>
              <el-tag size="mini" :type="statusTagType(task.status)" effect="light">
                {{ statusLabel(task.status) }}
              </el-tag>
            </div>
            <el-progress
              :percentage="progressPct"
              :status="task.status === 'done' ? 'success' : undefined"
              :stroke-width="14"
            />
            <div class="scan-progress__meta">
              已探测 {{ num0(task.progress) }} / {{ num0(task.total) }}
              · 发现 {{ num0(task.found) }}
              <span v-if="task.gatewayIp"> · 网关 {{ task.gatewayIp }}</span>
            </div>
            <div class="scan-progress__current">
              正在扫描: {{ task.currentTarget || "—" }}
            </div>
            <div
              v-if="task.subnets && task.subnets.length"
              class="scan-progress__subnets"
            >
              子网：
              <el-tag
                v-for="s in task.subnets"
                :key="s"
                size="mini"
                effect="plain"
                class="subnet-tag"
              >
                {{ s }}
              </el-tag>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="最近任务" icon="el-icon-time">
          <template #extra>共 {{ tasks.length }} 个</template>
          <el-empty v-if="!tasks.length" description="暂无任务" :image-size="60" />
          <ul v-else class="task-list">
            <li
              v-for="t in tasks"
              :key="t.taskId"
              class="task-list__item"
              @click="loadTask(t.taskId)"
            >
              <div class="task-list__top">
                <span class="mono">{{ t.cidr }}</span>
                <el-tag size="mini" :type="statusTagType(t.status)" effect="light">
                  {{ statusLabel(t.status) }}
                </el-tag>
              </div>
              <div class="task-list__sub">
                {{ t.name || "未命名" }} · 发现 {{ num0(t.found) }} ·
                {{ fmtTime(t.gmtCreate) }}
              </div>
            </li>
          </ul>
        </SectionCard>
      </el-col>

      <!-- 右侧：扫描结果 -->
      <el-col :xs="24" :lg="17">
        <SectionCard title="扫描结果" icon="el-icon-data-board">
          <template #extra>
            <span v-if="unconfirmedCount > 0 && !showUnconfirmed" class="result-hint">
              共 {{ visibleNodes.length }} 台（另有 {{ unconfirmedCount }} 个未确认IP已隐藏）
            </span>
            <span v-else-if="visibleNodes.length">共 {{ visibleNodes.length }} 个节点</span>
          </template>

          <div class="result-bar">
            <div class="result-bar__left">
              <el-switch
                v-model="showUnconfirmed"
                :active-text="`显示未确认IP (${unconfirmedCount})`"
                :disabled="unconfirmedCount === 0"
              />
              <el-switch
                v-model="buildTopology"
                active-text="构建拓扑"
              />
            </div>
            <div class="result-bar__right">
              <el-button
                size="small"
                icon="el-icon-download"
                :disabled="!selected.length || importing"
                :loading="importing && importMode === 'selected'"
                @click="doImport(false)"
              >
                导入选中 ({{ selected.length }})
              </el-button>
              <el-button
                size="small"
                type="primary"
                icon="el-icon-folder-add"
                :disabled="!visibleNodes.length || importing"
                :loading="importing && importMode === 'all'"
                @click="doImport(true)"
              >
                导入全部
              </el-button>
            </div>
          </div>

          <el-empty v-if="!visibleNodes.length" description="暂无扫描结果" />
          <el-table
            v-else
            ref="resultTable"
            :data="visibleNodes"
            size="small"
            stripe
            height="100%"
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="44" />
            <el-table-column prop="ip" label="IP" min-width="130" fixed>
              <template slot-scope="{ row }">
                <span class="mono">{{ row.ip || "-" }}</span>
                <el-tag v-if="row.gateway" size="mini" effect="plain" class="gw-tag">网关</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="确认" width="84">
              <template slot-scope="{ row }">
                <el-tag size="mini" effect="light" :type="row.exists ? 'success' : 'info'">
                  {{ row.exists ? "设备" : "未确认" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hostname" label="主机名" min-width="150">
              <template slot-scope="{ row }">{{ row.hostname || row.snmpSysName || "-" }}</template>
            </el-table-column>
            <el-table-column label="设备类型" width="120">
              <template slot-scope="{ row }">
                <el-tag size="small" :type="classTagType(row.deviceClass)" effect="light">
                  {{ row.deviceClass || "未知" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="os" label="操作系统" min-width="130">
              <template slot-scope="{ row }">{{ row.os || "-" }}</template>
            </el-table-column>
            <el-table-column prop="vendor" label="厂商" min-width="110">
              <template slot-scope="{ row }">{{ row.vendor || "-" }}</template>
            </el-table-column>
            <el-table-column label="开放端口" min-width="150">
              <template slot-scope="{ row }">
                <span class="mono ports">{{ fmtPorts(row.openPorts) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="RTT" width="90" align="center">
              <template slot-scope="{ row }">{{ row.rttMs == null ? "-" : num1(row.rttMs) + " ms" }}</template>
            </el-table-column>
          </el-table>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
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

const STATUS_LABEL = {
  pending: "等待中",
  running: "扫描中",
  scanning: "扫描中",
  done: "已完成",
  failed: "失败",
  error: "失败",
};
const CLASS_TAG = {
  server: "primary",
  host: "primary",
  switch: "success",
  router: "success",
  network: "success",
  gateway: "warning",
  printer: "info",
  unknown: "info",
};

export default {
  name: "MonitorDiscovery",
  components: { SectionCard },
  data() {
    return {
      cidr: "",
      name: "",
      scanning: false,
      autoLoading: false,
      localSubnets: [],
      autoJob: {},
      task: null,
      tasks: [],
      selected: [],
      buildTopology: true,
      showUnconfirmed: false,
      importing: false,
      importMode: "",
      pollTimer: null,
      autoTimer: null,
    };
  },
  computed: {
    nodes() {
      return (this.task && this.task.nodes) || [];
    },
    visibleNodes() {
      if (this.showUnconfirmed) return this.nodes;
      return this.nodes.filter((n) => n.exists === true);
    },
    unconfirmedCount() {
      return this.nodes.filter((n) => n.exists === false).length;
    },
    progressPct() {
      if (!this.task) return 0;
      if (this.task.status === "done") return 100;
      const progress = Number(this.task.progress);
      const total = Number(this.task.total);
      if (!Number.isFinite(progress) || !Number.isFinite(total) || total <= 0) {
        return 0;
      }
      return Math.max(0, Math.min(100, Math.round((progress / total) * 100)));
    },
  },
  watch: {
    showUnconfirmed(val) {
      if (!val) {
        // 隐藏未确认IP后，清除不再可见的已选中行，避免脏选择
        const hadUnconfirmed = this.selected.some((r) => r.exists === false);
        this.selected = this.selected.filter((r) => r.exists === true);
        if (hadUnconfirmed && this.$refs.resultTable) {
          this.$refs.resultTable.clearSelection();
        }
      }
    },
  },
  mounted() {
    this.loadTasks();
    this.loadLocalSubnets();
  },
  beforeDestroy() {
    this.clearPoll();
    this.clearAutoPoll();
  },
  methods: {
    num0(v) {
      return v === undefined || v === null ? "0" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    fmtPorts(ports) {
      if (!ports || !ports.length) return "-";
      return ports.join(", ");
    },
    fmtTime(t) {
      if (!t) return "-";
      const s = String(t).replace("T", " ");
      return s.length > 19 ? s.slice(0, 19) : s;
    },
    statusLabel(s) {
      return STATUS_LABEL[s] || s || "-";
    },
    statusTagType(s) {
      if (s === "done") return "success";
      if (s === "failed" || s === "error") return "danger";
      if (s === "running" || s === "scanning") return "warning";
      return "info";
    },
    classTagType(c) {
      return CLASS_TAG[(c || "unknown").toLowerCase()] || "info";
    },
    subnetText(s) {
      if (s && typeof s === "object") return s.cidr || "";
      return s;
    },
    clearPoll() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    },
    clearAutoPoll() {
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
      }
    },
    async loadTasks() {
      try {
        const res = await listDiscoveryTasks();
        this.tasks = res.content || [];
      } catch (e) {
        /* 接口层已提示 */
      }
    },
    async loadLocalSubnets() {
      try {
        const res = await getLocalSubnets();
        this.localSubnets = res.content || [];
      } catch (e) {
        this.localSubnets = [];
      }
    },
    async autoDiscover() {
      this.autoLoading = true;
      this.autoJob = { status: "running", progress: 0, phase: "正在启动…" };
      try {
        const res = await autoDiscovery({ buildTopology: true });
        const jobId = res.content && res.content.jobId;
        if (!jobId) {
          this.clearAutoPoll();
          this.autoLoading = false;
          this.autoJob = {};
          this.$message.error("自动发现启动失败");
          return;
        }
        this.startAutoPoll(jobId);
      } catch (e) {
        this.clearAutoPoll();
        this.autoLoading = false;
        this.autoJob = {};
        this.$message.error("自动发现失败");
      }
    },
    startAutoPoll(jobId) {
      this.clearAutoPoll();
      this.autoPollOnce(jobId);
      this.autoTimer = setInterval(() => this.autoPollOnce(jobId), 1500);
    },
    async autoPollOnce(jobId) {
      try {
        const res = await getAutoStatus(jobId);
        const c = res.content || {};
        this.autoJob = c;
        if (c.subnets && c.subnets.length) {
          this.localSubnets = c.subnets;
        }
        if (c.status === "done") {
          this.clearAutoPoll();
          this.autoLoading = false;
          this.$message.success(
            `已自动发现 ${this.num0(c.imported)} 台设备（网段：${
              (c.subnets || []).length
            } 个）${c.viewId ? "，已生成拓扑" : ""}`
          );
          this.loadTasks();
          this.loadLocalSubnets();
          setTimeout(() => {
            this.autoJob = {};
          }, 4000);
        } else if (c.status === "failed") {
          this.clearAutoPoll();
          this.autoLoading = false;
          this.$message.error(c.message || "自动发现失败");
        }
      } catch (e) {
        this.clearAutoPoll();
        this.autoLoading = false;
        this.$message.error("自动发现失败");
      }
    },
    async startScan() {
      const cidr = (this.cidr || "").trim();
      if (!cidr) {
        this.$message.warning("请输入网段 CIDR");
        return;
      }
      this.scanning = true;
      try {
        const res = await startDiscoveryScan({
          cidr,
          name: (this.name || "").trim() || undefined,
        });
        const content = res.content || {};
        if (content.taskId) {
          this.startPoll(content.taskId);
        }
      } finally {
        this.scanning = false;
      }
    },
    startPoll(taskId) {
      this.clearPoll();
      this.fetchTask(taskId);
      this.pollTimer = setInterval(() => this.fetchTask(taskId), 1000);
    },
    async fetchTask(taskId) {
      try {
        const res = await getDiscoveryTask(taskId);
        this.task = res.content || null;
        if (
          this.task &&
          ["done", "failed", "error"].includes(this.task.status)
        ) {
          this.clearPoll();
          this.loadTasks();
        }
      } catch (e) {
        this.clearPoll();
      }
    },
    async loadTask(taskId) {
      this.clearPoll();
      try {
        const res = await getDiscoveryTask(taskId);
        this.task = res.content || null;
        if (
          this.task &&
          !["done", "failed", "error"].includes(this.task.status)
        ) {
          this.startPoll(taskId);
        }
      } catch (e) {
        /* 接口层已提示 */
      }
    },
    onSelectionChange(rows) {
      this.selected = rows || [];
    },
    async doImport(all) {
      if (!this.task || !this.task.taskId) {
        this.$message.warning("请先完成一次扫描");
        return;
      }
      const ips = all ? undefined : this.selected.map((r) => r.ip);
      if (!all && (!ips || !ips.length)) {
        this.$message.warning("请先选择要导入的节点");
        return;
      }
      this.importing = true;
      this.importMode = all ? "all" : "selected";
      try {
        const res = await importDiscovery({
          taskId: this.task.taskId,
          ips,
          buildTopology: this.buildTopology,
        });
        const c = res.content || {};
        this.$message.success(
          `导入完成：新增 ${this.num0(c.imported)} 个，跳过 ${this.num0(c.skipped)} 个`
        );
      } finally {
        this.importing = false;
        this.importMode = "";
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

/* 独立页：自然高度，由 layout-main 滚动，避免堆叠 SectionCard(height:100%) 被拉伸留白 */
.discovery-page {
  min-height: 0;
}
.mono {
  font-family: monospace;
  color: var(--cm-text-primary, @text-primary);
}
.scan-progress {
  margin-top: 8px;
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  &__meta {
    margin-top: 8px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__current {
    margin-top: 4px;
    font-size: 12px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__subnets {
    margin-top: 8px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.subnet-tag {
  margin: 2px 4px 2px 0;
}
.local-subnets {
  margin-top: 8px;
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.auto-job {
  margin-top: 12px;
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  &__title {
    font-size: 13px;
    color: var(--cm-text-primary, @text-primary);
  }
  &__phase {
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
  &__live {
    margin-top: 8px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__subnets {
    margin-top: 8px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  &__item {
    padding: 10px 12px;
    border: 1px solid var(--cm-border-light, @border-light);
    border-radius: @radius-base;
    margin-bottom: 8px;
    cursor: pointer;
    &:hover {
      background: var(--cm-bg-soft, @bg-soft);
    }
  }
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.result-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  &__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  &__right {
    display: flex;
    gap: 8px;
  }
}
.result-hint {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.gw-tag {
  margin-left: 6px;
}
.ports {
  font-size: 12px;
  color: var(--cm-text-regular, @text-regular);
}
</style>
