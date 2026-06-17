<template>
  <screen-page title="智能运维" gap="8px" class="aiops">
    <el-tabs v-model="activeTab" class="aiops-tabs fill">
      <!-- 异常检测 -->
      <el-tab-pane label="异常检测" name="anomaly">
        <div class="tab-pane">
          <card-grid min="200px" gap="8px" class="row-stats">
            <stat-card dense icon="el-icon-warning-outline" label="异常总数"
              :value="num(anomalies.total)" color="#409eff" />
            <stat-card dense icon="el-icon-circle-close" label="严重"
              :value="num(anomalies.critical)" color="#f56c6c" />
            <stat-card dense icon="el-icon-warning" label="警告"
              :value="num(anomalies.warning)" color="#e6a23c" />
          </card-grid>

          <section-card dense scrollable body-class="dense-table fill" class="fill"
            title="异常检测明细" icon="el-icon-data-analysis">
            <template #extra>共 {{ anomalyList.length }} 条</template>
            <el-table class="dense-table" height="100%" :data="anomalyList" size="small" stripe>
              <el-table-column label="设备" min-width="140">
                <template slot-scope="{ row }">{{ row.deviceName || "-" }}</template>
              </el-table-column>
              <el-table-column label="类型" width="110">
                <template slot-scope="{ row }">{{ typeLabel(row.deviceType) }}</template>
              </el-table-column>
              <el-table-column label="指标" min-width="130">
                <template slot-scope="{ row }">{{ row.metricLabel || "-" }}</template>
              </el-table-column>
              <el-table-column label="当前值" width="120">
                <template slot-scope="{ row }">{{ withUnit(row.currentValue, row.unit) }}</template>
              </el-table-column>
              <el-table-column label="基线" width="120">
                <template slot-scope="{ row }">{{ withUnit(row.baseline, row.unit) }}</template>
              </el-table-column>
              <el-table-column label="偏离" width="110">
                <template slot-scope="{ row }">
                  <span :style="{ color: deviationColor(row.deviation) }">{{ deviationText(row.deviation) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="级别" width="100">
                <template slot-scope="{ row }">
                  <el-tag size="small" :type="severityTag(row.severity)" effect="dark">
                    {{ row.severityText || row.severity }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="检测时间" width="180">
                <template slot-scope="{ row }">{{ row.detectedTime || "-" }}</template>
              </el-table-column>
              <el-table-column label="方法" min-width="140">
                <template slot-scope="{ row }">{{ row.method || "-" }}</template>
              </el-table-column>
              <template slot="empty">
                <el-empty description="暂无异常" :image-size="60" />
              </template>
            </el-table>
          </section-card>
        </div>
      </el-tab-pane>

      <!-- 成本优化 -->
      <el-tab-pane label="成本优化" name="cost">
        <div class="tab-pane">
          <card-grid min="180px" gap="8px" class="row-stats">
            <stat-card dense icon="el-icon-wallet" label="月度成本"
              :value="cost.totalMonthlyCost || '-'" color="#409eff" />
            <stat-card dense icon="el-icon-coin" label="可节省"
              :value="cost.potentialSavings || '-'" color="#67c23a" />
            <stat-card dense icon="el-icon-pie-chart" label="节省占比"
              :value="`${num(cost.savingsPct)}%`" :percent="cost.savingsPct" color="#e6a23c" />
            <stat-card dense icon="el-icon-remove-outline" label="闲置项"
              :value="num(cost.idleCount)" color="#909399" />
          </card-grid>

          <card-grid min="320px" gap="8px" class="row-cost">
            <section-card dense title="资源利用率" icon="el-icon-odometer">
              <el-empty v-if="!utilizationList.length" description="暂无数据" :image-size="60" />
              <div v-else class="util-grid">
                <div v-for="(u, i) in utilizationList" :key="i" class="util-item">
                  <div class="util-item__head">
                    <span class="util-item__type">{{ typeLabel(u.type) }}</span>
                    <span class="util-item__waste">浪费 {{ u.wasteCost || "-" }}</span>
                  </div>
                  <el-progress :percentage="clamp(u.avgUtil)" :color="utilColor(u.avgUtil)"
                    :stroke-width="8" />
                </div>
              </div>
            </section-card>

            <section-card dense title="容量预测" icon="el-icon-data-line">
              <template #extra>{{ forecastNote }}</template>
              <div ref="forecastRef" class="forecast-chart"></div>
            </section-card>
          </card-grid>

          <section-card dense scrollable body-class="dense-table fill" class="fill"
            title="闲置资源" icon="el-icon-box">
            <template #extra>共 {{ idleList.length }} 项</template>
            <el-table class="dense-table" height="100%" :data="idleList" size="small" stripe>
              <el-table-column label="设备" min-width="140">
                <template slot-scope="{ row }">{{ row.deviceName || "-" }}</template>
              </el-table-column>
              <el-table-column label="类型" width="110">
                <template slot-scope="{ row }">{{ typeLabel(row.type) }}</template>
              </el-table-column>
              <el-table-column label="原因" min-width="160">
                <template slot-scope="{ row }">{{ row.reason || "-" }}</template>
              </el-table-column>
              <el-table-column label="闲置" min-width="130">
                <template slot-scope="{ row }">{{ row.idleMetric || "-" }}</template>
              </el-table-column>
              <el-table-column label="月成本" width="110">
                <template slot-scope="{ row }">{{ row.monthlyCost || "-" }}</template>
              </el-table-column>
              <el-table-column label="可节省" width="110">
                <template slot-scope="{ row }">
                  <span style="color: #67c23a">{{ row.potentialSaving || "-" }}</span>
                </template>
              </el-table-column>
              <el-table-column label="建议" min-width="200">
                <template slot-scope="{ row }">{{ row.recommendation || "-" }}</template>
              </el-table-column>
              <template slot="empty">
                <el-empty description="暂无闲置资源" :image-size="60" />
              </template>
            </el-table>
          </section-card>
        </div>
      </el-tab-pane>
    </el-tabs>
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
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getAiopsAnomalies, getAiopsCost } from "@/api/monitor-aiops";

const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息队列",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
};

export default {
  name: "MonitorAiops",
  mixins: [chartSkin],
  components: { ScreenPage, CardGrid, StatCard, SectionCard, InfoTable },
  data() {
    return {
      activeTab: "anomaly",
      anomalies: {},
      cost: {},
      forecastChart: null,
      timer: null,
    };
  },
  computed: {
    anomalyList() {
      return this.anomalies.anomalies || [];
    },
    utilizationList() {
      return this.cost.utilizationByType || [];
    },
    idleList() {
      return this.cost.idleResources || [];
    },
    forecastNote() {
      const f = this.cost.forecast || {};
      if (f.fullInDays === undefined || f.fullInDays === null) return "";
      return `预计 ${f.fullInDays} 天后达上限`;
    },
  },
  watch: {
    activeTab() {
      this.$nextTick(this.renderForecast);
    },
  },
  mounted() {
    this.loadAll();
    this.timer = setInterval(this.loadAll, 5000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.forecastChart) {
      this.forecastChart.dispose();
      this.forecastChart = null;
    }
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? "-" : v;
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    withUnit(v, unit) {
      if (v === undefined || v === null) return "-";
      return `${v}${unit || ""}`;
    },
    deviationText(d) {
      if (d === undefined || d === null) return "-";
      const n = Number(d);
      return `${n > 0 ? "+" : ""}${n}%`;
    },
    deviationColor(d) {
      const n = Math.abs(Number(d) || 0);
      if (n >= 50) return "#f56c6c";
      if (n >= 20) return "#e6a23c";
      return "#67c23a";
    },
    severityTag(s) {
      if (s === "critical" || s === "high") return "danger";
      if (s === "warning" || s === "medium") return "warning";
      return "success";
    },
    utilColor(v) {
      const n = Number(v) || 0;
      if (n < 20) return "#f56c6c";
      if (n < 50) return "#e6a23c";
      return "#67c23a";
    },
    reinitChartsForSkin() {
      if (this.forecastChart) {
        this.forecastChart.dispose();
        this.forecastChart = null;
      }
      this.renderForecast();
    },
    renderForecast() {
      if (this.activeTab !== "cost") return;
      if (!this.$refs.forecastRef) return;
      if (!this.forecastChart) {
        applyChartTheme(echarts);
        this.forecastChart = echarts.init(this.$refs.forecastRef, currentChartTheme());
      }
      const f = this.cost.forecast || {};
      this.forecastChart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["实际", "预测"], right: 10 },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: f.times || [] },
        yAxis: { type: "value" },
        series: [
          {
            name: "实际",
            type: "line",
            smooth: true,
            showSymbol: false,
            areaStyle: { opacity: 0.12 },
            itemStyle: { color: "#409eff" },
            data: f.actual || [],
          },
          {
            name: "预测",
            type: "line",
            smooth: true,
            showSymbol: false,
            lineStyle: { type: "dashed" },
            itemStyle: { color: "#e6a23c" },
            data: f.predicted || [],
          },
        ],
      });
    },
    async loadAll() {
      try {
        const [aRes, cRes] = await Promise.all([
          getAiopsAnomalies(),
          getAiopsCost(),
        ]);
        this.anomalies = aRes.content || {};
        this.cost = cRes.content || {};
        await this.$nextTick();
        this.renderForecast();
      } catch (e) {
        // 静默：轮询期间忽略瞬时错误
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

// el-tabs 填满 ScreenPage 主体，tab 内容成为可用空间
.aiops-tabs {
  display: flex;
  flex-direction: column;
  min-height: 0;

  /deep/ .el-tabs__header {
    margin: 0 0 8px;
    flex-shrink: 0;
  }

  /deep/ .el-tabs__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /deep/ .el-tab-pane {
    height: 100%;
  }
}

// 每个 tab 内部为纵向 flex：统计/图表行固定，表格行填满并内部滚动
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  min-height: 0;
}

.row-stats,
.row-cost {
  flex-shrink: 0;
}

.forecast-chart {
  height: @chart-h-sm;
  width: 100%;
}

.util-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: @space-sm @space-md;
}

.util-item {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: @radius-base;
  padding: @space-sm @space-md;

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }

  &__type {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }

  &__waste {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
</style>
