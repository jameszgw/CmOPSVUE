<template>
  <screen-page v-loading="loading" title="拨测监控" gap="8px" class="dialtest-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(分)</span>
        <el-input-number
          v-model="windowMin"
          :min="5"
          :max="1440"
          size="small"
          :controls="false"
          class="ctrl-num"
          @change="loadOverview"
        />
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog">新增任务</el-button>
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="loadOverview">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <card-grid min="200px" gap="8px" class="row-stats">
      <stat-card
        dense
        icon="el-icon-aim"
        label="任务数"
        :value="num(overview.taskTotal)"
        :sub="`窗口 ${num(overview.windowMin)} 分钟`"
        color="#409eff"
      />
      <stat-card
        dense
        icon="el-icon-circle-check"
        label="正常"
        :value="num(overview.up)"
        color="#67c23a"
      />
      <stat-card
        dense
        icon="el-icon-circle-close"
        label="异常"
        :value="num(overview.down)"
        color="#f56c6c"
      />
    </card-grid>

    <!-- 任务表 -->
    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="拨测任务"
      icon="el-icon-connection"
    >
      <template #extra>共 {{ tasks.length }} 个</template>
      <el-table class="dense-table" height="100%" :data="tasks" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="类型" width="90">
          <template slot-scope="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.probeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="目标" min-width="180" show-overflow-tooltip>
          <template slot-scope="{ row }">
            {{ row.target }}<span v-if="row.port">:{{ row.port }}</span>
          </template>
        </el-table-column>
        <el-table-column label="可用率" width="110">
          <template slot-scope="{ row }">
            <span class="val-strong" :style="{ color: availColor(row.availability) }">
              {{ pct(row.availability) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="平均时延(ms)" width="120">
          <template slot-scope="{ row }">{{ num1(row.avgLatencyMs) }}</template>
        </el-table-column>
        <el-table-column label="最近状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="statusType(row.lastStatus)" effect="dark">
              {{ statusText(row.lastStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template slot-scope="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="onRun(row)">立即拨测</el-button>
            <el-button type="text" size="small" @click="openResults(row)">记录</el-button>
            <el-button type="text" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="text" size="small" class="btn-danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty description="暂无拨测任务" :image-size="60" />
        </template>
      </el-table>
    </section-card>

    <!-- 新增/编辑任务弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑拨测任务' : '新增拨测任务'"
      :visible.sync="dialogVisible"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" size="small">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="任务名称" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="探测类型" prop="probeType">
              <el-select v-model="form.probeType" class="full-width">
                <el-option label="HTTP" value="HTTP" />
                <el-option label="TCP" value="TCP" />
                <el-option label="PING" value="PING" />
                <el-option label="DNS" value="DNS" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口">
              <el-input-number v-model="form.port" :min="0" :max="65535" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="目标" prop="target">
          <el-input v-model="form.target" placeholder="如 https://example.com 或 10.0.0.1" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="间隔(秒)">
              <el-input-number v-model="form.intervalSec" :min="5" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="超时(ms)">
              <el-input-number v-model="form.timeoutMs" :min="100" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="期望状态码">
              <el-input-number v-model="form.expectStatus" :min="0" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="期望包含">
          <el-input v-model="form.expectContains" placeholder="响应应包含的文本（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 拨测记录抽屉 -->
    <el-drawer
      :title="`拨测记录 · ${currentTask.name || ''}`"
      :visible.sync="drawerVisible"
      size="640px"
      @opened="onDrawerOpened"
      @closed="onDrawerClosed"
    >
      <div class="drawer-body">
        <el-empty v-if="!results.length" description="暂无拨测记录" :image-size="60" />
        <template v-else>
          <div ref="chartRef" class="latency-chart"></div>
          <el-table class="dense-table" :data="results" size="small" stripe height="320">
            <el-table-column prop="ts" label="时间" width="180" />
            <el-table-column label="结果" width="90">
              <template slot-scope="{ row }">
                <el-tag size="small" :type="row.success ? 'success' : 'danger'" effect="dark">
                  {{ row.success ? "成功" : "失败" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时延(ms)" width="100">
              <template slot-scope="{ row }">{{ num1(row.latencyMs) }}</template>
            </el-table-column>
            <el-table-column prop="code" label="状态码" width="90" />
            <el-table-column prop="message" label="消息" min-width="160" show-overflow-tooltip />
          </el-table>
        </template>
      </div>
    </el-drawer>
  </screen-page>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getDialtestOverview,
  addDialtestTask,
  updateDialtestTask,
  deleteDialtestTask,
  toggleDialtestTask,
  runDialtestTask,
  getDialtestResults,
} from "@/api/monitor-ops";

applyChartTheme(echarts);

function defaultForm() {
  return {
    id: null,
    name: "",
    probeType: "HTTP",
    target: "",
    port: undefined,
    intervalSec: 60,
    timeoutMs: 5000,
    expectStatus: 200,
    expectContains: "",
    enabled: true,
  };
}

export default {
  name: "MonitorDialtest",
  components: { ScreenPage, CardGrid, StatCard, SectionCard },
  mixins: [chartSkin],
  data() {
    return {
      loading: false,
      windowMin: 60,
      data: {},
      timer: null,
      // 表单
      dialogVisible: false,
      isEdit: false,
      saving: false,
      form: defaultForm(),
      formRules: {
        name: [{ required: true, message: "请输入名称", trigger: "blur" }],
        probeType: [{ required: true, message: "请选择探测类型", trigger: "change" }],
        target: [{ required: true, message: "请输入目标", trigger: "blur" }],
      },
      // 抽屉
      drawerVisible: false,
      currentTask: {},
      results: [],
      chart: null,
    };
  },
  computed: {
    overview() {
      return this.data || {};
    },
    tasks() {
      return this.overview.tasks || [];
    },
  },
  mounted() {
    this.loadOverview();
    this.timer = setInterval(this.loadOverview, 10000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.disposeChart();
  },
  methods: {
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    pct(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    availColor(v) {
      const n = Number(v);
      if (n >= 99) return "#67c23a";
      if (n >= 90) return "#e6a23c";
      return "#f56c6c";
    },
    statusType(s) {
      const k = String(s || "").toUpperCase();
      if (k === "UP" || k === "OK") return "success";
      if (k === "DOWN" || k === "FAIL") return "danger";
      return "info";
    },
    statusText(s) {
      const k = String(s || "").toUpperCase();
      if (k === "UP" || k === "OK") return "正常";
      if (k === "DOWN" || k === "FAIL") return "异常";
      return s || "-";
    },
    async loadOverview() {
      this.loading = true;
      try {
        const res = await getDialtestOverview(this.windowMin);
        this.data = res.content || {};
      } finally {
        this.loading = false;
      }
    },
    async onToggle(row, val) {
      try {
        await toggleDialtestTask(row.id, val);
        this.$message.success(val ? "已启用" : "已停用");
      } catch (e) {
        row.enabled = !val;
        this.$message.error("操作失败");
      }
    },
    async onRun(row) {
      try {
        const res = await runDialtestTask(row.id);
        const r = res.content || {};
        if (r.success) {
          this.$message.success(`拨测成功 · ${this.num1(r.latencyMs)}ms · ${r.code != null ? r.code : ""}`);
        } else {
          this.$message.warning(`拨测失败 · ${r.message || r.code || "未知错误"}`);
        }
        this.loadOverview();
      } catch (e) {
        this.$message.error("拨测失败");
      }
    },
    onDelete(row) {
      this.$confirm(`确认删除任务「${row.name}」？`, "提示", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      })
        .then(async () => {
          try {
            await deleteDialtestTask(row.id);
            this.$message.success("删除成功");
            this.loadOverview();
          } catch (e) {
            this.$message.error("删除失败");
          }
        })
        .catch(() => {});
    },
    assignForm(src) {
      const base = defaultForm();
      Object.keys(base).forEach((k) => {
        base[k] = src && src[k] !== undefined && src[k] !== null ? src[k] : base[k];
      });
      this.form = base;
    },
    openAddDialog() {
      this.isEdit = false;
      this.assignForm(null);
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate();
      });
    },
    openEditDialog(row) {
      this.isEdit = true;
      this.assignForm(row);
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate();
      });
    },
    submitForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          const payload = Object.assign({}, this.form);
          if (this.isEdit) {
            await updateDialtestTask(payload);
            this.$message.success("更新成功");
          } else {
            delete payload.id;
            await addDialtestTask(payload);
            this.$message.success("新增成功");
          }
          this.dialogVisible = false;
          this.loadOverview();
        } catch (e) {
          this.$message.error("保存失败");
        } finally {
          this.saving = false;
        }
      });
    },
    async openResults(row) {
      this.currentTask = row;
      this.drawerVisible = true;
      try {
        const res = await getDialtestResults(row.id, 50);
        this.results = res.content || [];
      } catch (e) {
        this.results = [];
      }
    },
    onDrawerOpened() {
      if (this.results.length) this.renderChart();
    },
    onDrawerClosed() {
      this.disposeChart();
      this.results = [];
    },
    disposeChart() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
    },
    renderChart() {
      const el = this.$refs.chartRef;
      if (!el) return;
      if (!this.chart) this.chart = echarts.init(el, currentChartTheme());
      const ordered = this.results.slice().reverse();
      this.chart.setOption(
        {
          tooltip: { trigger: "axis" },
          grid: { left: 50, right: 20, top: 30, bottom: 30 },
          xAxis: { type: "category", boundaryGap: false, data: ordered.map((r) => r.ts) },
          yAxis: { type: "value", name: "ms" },
          series: [
            {
              name: "时延",
              type: "line",
              smooth: true,
              showSymbol: false,
              areaStyle: { opacity: 0.12 },
              data: ordered.map((r) => r.latencyMs),
            },
          ],
        },
        true
      );
    },
    // chartSkin mixin 在皮肤切换时调用
    reinitChartsForSkin() {
      this.disposeChart();
      if (this.drawerVisible && this.results.length) {
        this.$nextTick(this.renderChart);
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats {
  flex-shrink: 0;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.ctrl-label {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.ctrl-num {
  width: 90px;
}
.val-strong {
  font-weight: 600;
}
.btn-danger {
  color: #f56c6c;
}
.full-width {
  width: 100%;
}
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: @space-md;
  padding: 0 16px;
}
.latency-chart {
  height: 240px;
  width: 100%;
}
</style>
