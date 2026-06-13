<template>
  <div class="page-container">
    <!-- 顶部统计卡 -->
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          icon="el-icon-bell"
          label="活跃告警"
          :value="statValue(stats.activeTotal)"
          color="#409eff"
        />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          icon="el-icon-warning"
          label="严重"
          :value="statValue(stats.critical)"
          color="#f56c6c"
        />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          icon="el-icon-warning-outline"
          label="警告"
          :value="statValue(stats.warning)"
          color="#e6a23c"
        />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard
          icon="el-icon-circle-check"
          label="已恢复"
          :value="statValue(stats.resolved)"
          color="#67c23a"
        />
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <!-- 告警概览 -->
      <el-tab-pane label="告警概览" name="overview">
        <SectionCard title="活跃告警" icon="el-icon-bell">
          <template #extra>
            <span class="extra-text">每 5 秒自动刷新</span>
          </template>
          <div class="toolbar">
            <div class="toolbar__filters">
              <span class="filter-label">级别</span>
              <el-select
                v-model="filterLevel"
                size="small"
                placeholder="全部"
                class="filter-select"
                @change="loadActive"
              >
                <el-option label="全部" value="" />
                <el-option label="严重" value="critical" />
                <el-option label="警告" value="warning" />
              </el-select>
              <span class="filter-label">设备类型</span>
              <el-select
                v-model="filterDeviceType"
                size="small"
                placeholder="全部"
                class="filter-select"
                @change="loadActive"
              >
                <el-option label="全部" value="" />
                <el-option label="服务器" value="SERVER" />
                <el-option label="Redis" value="REDIS" />
                <el-option label="数据库" value="DATABASE" />
              </el-select>
            </div>
            <el-button
              size="small"
              icon="el-icon-refresh"
              :loading="activeLoading"
              @click="manualRefresh"
            >刷新</el-button>
          </div>

          <el-table :data="activeAlerts" size="small" stripe>
            <el-table-column label="级别" width="90">
              <template slot-scope="{ row }">
                <el-tag
                  v-if="row.level === 'critical'"
                  type="danger"
                  size="small"
                >{{ levelText(row) }}</el-tag>
                <el-tag
                  v-else-if="row.level === 'warning'"
                  type="warning"
                  size="small"
                >{{ levelText(row) }}</el-tag>
                <el-tag v-else size="small" type="info">{{ levelText(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceName" label="设备" min-width="120" show-overflow-tooltip />
            <el-table-column prop="metricLabel" label="指标" min-width="110" show-overflow-tooltip />
            <el-table-column label="当前值" width="110">
              <template slot-scope="{ row }">{{ valueWithUnit(row) }}</template>
            </el-table-column>
            <el-table-column label="阈值" width="100">
              <template slot-scope="{ row }">{{ thresholdText(row) }}</template>
            </el-table-column>
            <el-table-column prop="message" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column prop="firstTime" label="首次" width="160" />
            <el-table-column label="持续" width="90">
              <template slot-scope="{ row }">{{ durationText(row.durationMin) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!activeAlerts.length" description="暂无活跃告警" />
        </SectionCard>

        <SectionCard title="历史告警" icon="el-icon-time">
          <el-table :data="historyAlerts" size="small" stripe>
            <el-table-column label="级别" width="90">
              <template slot-scope="{ row }">
                <el-tag
                  v-if="row.level === 'critical'"
                  type="danger"
                  size="small"
                >{{ levelText(row) }}</el-tag>
                <el-tag
                  v-else-if="row.level === 'warning'"
                  type="warning"
                  size="small"
                >{{ levelText(row) }}</el-tag>
                <el-tag v-else size="small" type="info">{{ levelText(row) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceName" label="设备" min-width="120" show-overflow-tooltip />
            <el-table-column prop="metricLabel" label="指标" min-width="110" show-overflow-tooltip />
            <el-table-column label="当前值" width="110">
              <template slot-scope="{ row }">{{ valueWithUnit(row) }}</template>
            </el-table-column>
            <el-table-column label="阈值" width="100">
              <template slot-scope="{ row }">{{ thresholdText(row) }}</template>
            </el-table-column>
            <el-table-column prop="message" label="描述" min-width="180" show-overflow-tooltip />
            <el-table-column prop="firstTime" label="首次" width="160" />
            <el-table-column prop="recoverTime" label="恢复时间" width="160" />
            <el-table-column label="状态" width="90">
              <template slot-scope="{ row }">
                <el-tag
                  v-if="row.status === 'resolved'"
                  type="success"
                  size="small"
                >已恢复</el-tag>
                <el-tag v-else size="small" type="info">已确认</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!historyAlerts.length" description="暂无历史告警" />
        </SectionCard>
      </el-tab-pane>

      <!-- 阈值规则 -->
      <el-tab-pane label="阈值规则" name="rules">
        <SectionCard title="阈值规则" icon="el-icon-set-up">
          <template #extra>
            <el-button
              size="small"
              type="primary"
              icon="el-icon-plus"
              @click="openAddDialog"
            >新增规则</el-button>
          </template>
          <el-table :data="rules" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="设备类型" width="110">
              <template slot-scope="{ row }">{{ deviceTypeText(row.deviceType) }}</template>
            </el-table-column>
            <el-table-column prop="metricLabel" label="指标" min-width="120" show-overflow-tooltip />
            <el-table-column label="条件" min-width="170">
              <template slot-scope="{ row }">
                <span class="cond-warn">{{ comparatorSymbol(row.comparator) }} {{ row.warnValue }}{{ row.unit }} 警告</span>
                <span class="cond-sep"> / </span>
                <span class="cond-critical">{{ comparatorSymbol(row.comparator) }} {{ row.criticalValue }}{{ row.unit }} 严重</span>
              </template>
            </el-table-column>
            <el-table-column label="持续" width="90">
              <template slot-scope="{ row }">{{ durationSecText(row.durationSec) }}</template>
            </el-table-column>
            <el-table-column label="启用" width="80">
              <template slot-scope="{ row }">
                <el-switch
                  v-model="row.enabled"
                  @change="onToggle(row, $event)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130">
              <template slot-scope="{ row }">
                <el-button
                  type="text"
                  size="small"
                  @click="openEditDialog(row)"
                >编辑</el-button>
                <el-button
                  type="text"
                  size="small"
                  class="btn-danger"
                  @click="onDelete(row)"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!rules.length" description="暂无阈值规则" />
        </SectionCard>
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑规则对话框 -->
    <el-dialog
      :title="dialogMode === 'add' ? '新增规则' : '编辑规则'"
      :visible.sync="dialogVisible"
      width="640px"
    >
      <el-form :model="form" label-width="100px" size="small">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="名称">
              <el-input v-model="form.name" placeholder="规则名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型">
              <el-select v-model="form.deviceType" placeholder="请选择" class="full-width">
                <el-option label="服务器" value="SERVER" />
                <el-option label="Redis" value="REDIS" />
                <el-option label="数据库" value="DATABASE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="指标键">
              <el-input v-model="form.metricKey" placeholder="如 cpuUsage" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指标名称">
              <el-input v-model="form.metricLabel" placeholder="如 CPU使用率" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="如 %" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="比较符">
              <el-select v-model="form.comparator" placeholder="请选择" class="full-width">
                <el-option label="大于 (&gt;)" value="GT" />
                <el-option label="大于等于 (≥)" value="GTE" />
                <el-option label="小于 (&lt;)" value="LT" />
                <el-option label="小于等于 (≤)" value="LTE" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="警告阈值">
              <el-input-number v-model="form.warnValue" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重阈值">
              <el-input-number v-model="form.criticalValue" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="持续(秒)">
              <el-input-number v-model="form.durationSec" :min="0" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="采样最小">
              <el-input-number v-model="form.sampleMin" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="采样最大">
              <el-input-number v-model="form.sampleMax" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button
          size="small"
          type="primary"
          :loading="saving"
          @click="submitForm"
        >确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getAlertStats,
  getActiveAlerts,
  getAlertHistory,
  listAlertRules,
  addAlertRule,
  updateAlertRule,
  deleteAlertRule,
  toggleAlertRule,
} from "@/api/monitor-alert";

const COMPARATOR_SYMBOL = { GT: ">", GTE: "≥", LT: "<", LTE: "≤" };
const DEVICE_TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
};

function emptyForm() {
  return {
    id: null,
    name: "",
    deviceType: "SERVER",
    metricKey: "",
    metricLabel: "",
    unit: "",
    comparator: "GT",
    warnValue: 0,
    criticalValue: 0,
    durationSec: 60,
    sampleMin: 0,
    sampleMax: 0,
  };
}

export default {
  name: "AlertCenter",
  components: { StatCard, SectionCard },
  data() {
    return {
      activeTab: "overview",
      stats: {},
      activeAlerts: [],
      historyAlerts: [],
      rules: [],
      filterLevel: "",
      filterDeviceType: "",
      activeLoading: false,
      timer: null,
      dialogVisible: false,
      dialogMode: "add",
      saving: false,
      form: emptyForm(),
    };
  },
  mounted() {
    this.loadStats();
    this.loadActive();
    this.loadHistory();
    this.loadRules();
    this.timer = setInterval(() => {
      this.loadStats();
      this.loadActive();
    }, 5000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  methods: {
    statValue(v) {
      return v === undefined || v === null ? 0 : v;
    },
    comparatorSymbol(c) {
      return COMPARATOR_SYMBOL[c] || c || "";
    },
    deviceTypeText(t) {
      return DEVICE_TYPE_LABEL[t] || t || "-";
    },
    levelText(row) {
      if (!row) return "-";
      if (row.levelText) return row.levelText;
      if (row.level === "critical") return "严重";
      if (row.level === "warning") return "警告";
      return row.level || "-";
    },
    valueWithUnit(row) {
      if (!row) return "-";
      const v = row.value === undefined || row.value === null ? "-" : row.value;
      return `${v}${row.unit || ""}`;
    },
    thresholdText(row) {
      if (!row) return "-";
      const t = row.threshold === undefined || row.threshold === null ? "-" : row.threshold;
      return `${this.comparatorSymbol(row.comparator)} ${t}${row.unit || ""}`;
    },
    durationText(min) {
      if (min === undefined || min === null) return "-";
      return `${min} 分钟`;
    },
    durationSecText(sec) {
      if (sec === undefined || sec === null) return "-";
      return `${sec} 秒`;
    },
    async loadStats() {
      try {
        const res = await getAlertStats();
        this.stats = res.content || {};
      } catch (e) {
        // 静默：轮询失败不打扰用户
      }
    },
    async loadActive() {
      this.activeLoading = true;
      try {
        const res = await getActiveAlerts(this.filterLevel, this.filterDeviceType);
        this.activeAlerts = res.content || [];
      } catch (e) {
        // 静默
      } finally {
        this.activeLoading = false;
      }
    },
    async loadHistory() {
      try {
        const res = await getAlertHistory(30);
        this.historyAlerts = res.content || [];
      } catch (e) {
        // 静默
      }
    },
    async loadRules() {
      try {
        const res = await listAlertRules();
        this.rules = res.content || [];
      } catch (e) {
        // 静默
      }
    },
    manualRefresh() {
      this.loadStats();
      this.loadActive();
      this.loadHistory();
      this.$message.success("已刷新");
    },
    async onToggle(row, val) {
      try {
        await toggleAlertRule(row.id, val);
        this.$message.success(val ? "已启用" : "已停用");
      } catch (e) {
        row.enabled = !val;
        this.$message.error("操作失败");
      }
    },
    openAddDialog() {
      this.dialogMode = "add";
      this.form = emptyForm();
      this.dialogVisible = true;
    },
    openEditDialog(row) {
      this.dialogMode = "edit";
      this.form = Object.assign(emptyForm(), row);
      this.dialogVisible = true;
    },
    async submitForm() {
      if (!this.form.name) {
        this.$message.warning("请输入规则名称");
        return;
      }
      this.saving = true;
      try {
        if (this.dialogMode === "add") {
          await addAlertRule(this.form);
          this.$message.success("新增成功");
        } else {
          await updateAlertRule(this.form);
          this.$message.success("更新成功");
        }
        this.dialogVisible = false;
        this.loadRules();
      } catch (e) {
        this.$message.error("保存失败");
      } finally {
        this.saving = false;
      }
    },
    onDelete(row) {
      this.$confirm(`确定删除规则「${row.name}」吗？`, "提示", {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      })
        .then(async () => {
          try {
            await deleteAlertRule(row.id);
            this.$message.success("删除成功");
            this.loadRules();
          } catch (e) {
            this.$message.error("删除失败");
          }
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="less" scoped>
.page-container {
  padding: 16px;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.extra-text {
  color: #909399;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  &__filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
}
.filter-label {
  font-size: 13px;
  color: #606266;
  margin: 0 8px 0 0;
}
.filter-select {
  width: 130px;
  margin-right: 16px;
}
.cond-warn {
  color: #e6a23c;
}
.cond-critical {
  color: #f56c6c;
}
.cond-sep {
  color: #c0c4cc;
}
.btn-danger {
  color: #f56c6c;
}
.full-width {
  width: 100%;
}
.full-width /deep/ .el-input__inner {
  text-align: left;
}
</style>
