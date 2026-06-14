<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="aiops-tabs">
      <!-- 异常检测 -->
      <el-tab-pane label="异常检测" name="anomaly">
        <el-row :gutter="12" class="stat-row">
          <el-col :xs="24" :sm="8">
            <StatCard icon="el-icon-warning-outline" label="异常总数"
              :value="num(anomalies.total)" color="#409eff" />
          </el-col>
          <el-col :xs="24" :sm="8">
            <StatCard icon="el-icon-circle-close" label="严重"
              :value="num(anomalies.critical)" color="#f56c6c" />
          </el-col>
          <el-col :xs="24" :sm="8">
            <StatCard icon="el-icon-warning" label="警告"
              :value="num(anomalies.warning)" color="#e6a23c" />
          </el-col>
        </el-row>

        <SectionCard title="异常检测明细" icon="el-icon-data-analysis">
          <template #extra>共 {{ anomalyList.length }} 条</template>
          <el-empty v-if="!anomalyList.length" description="暂无异常" />
          <el-table v-else :data="anomalyList" size="small" stripe>
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
          </el-table>
        </SectionCard>
      </el-tab-pane>

      <!-- 成本优化 -->
      <el-tab-pane label="成本优化" name="cost">
        <el-row :gutter="12" class="stat-row">
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-wallet" label="月度成本"
              :value="cost.totalMonthlyCost || '-'" color="#409eff" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-coin" label="可节省"
              :value="cost.potentialSavings || '-'" color="#67c23a" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-pie-chart" label="节省占比"
              :value="`${num(cost.savingsPct)}%`" :percent="cost.savingsPct" color="#e6a23c" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-remove-outline" label="闲置项"
              :value="num(cost.idleCount)" color="#909399" />
          </el-col>
        </el-row>

        <SectionCard title="资源利用率" icon="el-icon-odometer">
          <el-empty v-if="!utilizationList.length" description="暂无数据" />
          <el-row v-else :gutter="12">
            <el-col v-for="(u, i) in utilizationList" :key="i" :xs="24" :sm="12" :lg="8">
              <div class="util-item">
                <div class="util-item__head">
                  <span class="util-item__type">{{ typeLabel(u.type) }}</span>
                  <span class="util-item__waste">浪费 {{ u.wasteCost || "-" }}</span>
                </div>
                <el-progress :percentage="clamp(u.avgUtil)" :color="utilColor(u.avgUtil)"
                  :stroke-width="10" />
              </div>
            </el-col>
          </el-row>
        </SectionCard>

        <SectionCard title="容量预测" icon="el-icon-data-line">
          <template #extra>{{ forecastNote }}</template>
          <div ref="forecastRef" class="forecast-chart"></div>
        </SectionCard>

        <SectionCard title="闲置资源" icon="el-icon-box">
          <template #extra>共 {{ idleList.length }} 项</template>
          <el-empty v-if="!idleList.length" description="暂无闲置资源" />
          <el-table v-else :data="idleList" size="small" stripe>
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
          </el-table>
        </SectionCard>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import * as echarts from "echarts";
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
  components: { StatCard, SectionCard, InfoTable },
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
    renderForecast() {
      if (this.activeTab !== "cost") return;
      if (!this.$refs.forecastRef) return;
      if (!this.forecastChart) this.forecastChart = echarts.init(this.$refs.forecastRef);
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
.page-container {
  padding: 16px;
}
.aiops-tabs {
  /deep/ .el-tabs__content {
    overflow: visible;
  }
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.forecast-chart {
  height: 300px;
  width: 100%;
}
.util-item {
  padding: 12px 14px;
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  margin-bottom: 12px;

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
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
