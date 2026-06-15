<template>
  <div v-loading="loading" class="page-container">
    <!-- ① 健康评分 + 4 统计卡 -->
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :lg="8">
        <SectionCard title="系统健康评分" icon="el-icon-odometer">
          <template #extra>{{ healthLevelText }}</template>
          <div ref="gaugeRef" class="gauge-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="16">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-cpu" label="设备总数" :value="num(deviceStats.total)"
              :sub="`在线 ${num(deviceStats.online)} / 离线 ${num(deviceStats.offline)}`" color="#409eff" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-success" label="在线设备" :value="num(deviceStats.online)"
              :sub="`共 ${num(deviceStats.total)} 台`" color="#67c23a" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-bell" label="活跃告警" :value="num(alertStats.active)"
              :sub="`严重 ${num(alertStats.critical)} / 警告 ${num(alertStats.warning)}`" color="#e6a23c" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-warning" label="严重告警" :value="num(alertStats.critical)"
              :sub="`警告 ${num(alertStats.warning)}`" color="#f56c6c" />
          </el-col>
        </el-row>
        <div class="source-row">
          <span class="source-row__label">采集来源：</span>
          <el-tag type="success" size="mini">真实采集 {{ deviceStats.agentCount || 0 }}</el-tag>
          <el-tag type="info" size="mini">模拟数据 {{ deviceStats.simulatedCount || 0 }}</el-tag>
        </div>
      </el-col>
    </el-row>

    <!-- ② 设备类型分布饼图 + 告警趋势折线 -->
    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="设备类型分布" icon="el-icon-pie-chart">
          <div ref="pieRef" class="dist-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="告警趋势" icon="el-icon-data-line">
          <div ref="trendRef" class="dist-chart"></div>
        </SectionCard>
      </el-col>
    </el-row>

    <!-- ③ 资源水位概览 -->
    <SectionCard title="资源水位概览" icon="el-icon-monitor">
      <el-row :gutter="12">
        <el-col v-for="r in resourceRows" :key="r.label" :xs="24" :sm="12" :lg="6">
          <div class="res-item">
            <div class="res-item__head">
              <span class="res-item__label">{{ r.label }}</span>
              <span class="res-item__value" :style="{ color: r.color }">{{ num1(r.value) }}%</span>
            </div>
            <el-progress :percentage="clamp(r.value)" :color="r.color" :stroke-width="10" :show-text="false" />
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <!-- ④ 问题设备 Top -->
    <SectionCard title="问题设备 Top" icon="el-icon-warning-outline">
      <el-table :data="topProblems" size="small" stripe>
        <el-table-column prop="deviceName" label="设备" min-width="160" />
        <el-table-column label="类型" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重" width="100">
          <template slot-scope="{ row }">
            <span style="color: #f56c6c">{{ num(row.critical) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="警告" width="100">
          <template slot-scope="{ row }">
            <span style="color: #e6a23c">{{ num(row.warning) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="topIssue" label="主要问题" min-width="200" />
      </el-table>
      <el-empty v-if="!topProblems.length" description="暂无问题设备" :image-size="80" />
    </SectionCard>

    <!-- ⑤ 最近告警 -->
    <SectionCard title="最近告警" icon="el-icon-bell">
      <el-table :data="recentAlerts" size="small" stripe>
        <el-table-column label="级别" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="row.level === 'critical' ? 'danger' : 'warning'">
              {{ row.levelText || (row.level === 'critical' ? '严重' : '警告') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备" min-width="140" />
        <el-table-column prop="metricLabel" label="指标" width="140" />
        <el-table-column label="描述" min-width="220">
          <template slot-scope="{ row }">
            <span>{{ row.message }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="firstTime" label="首次" width="180" />
      </el-table>
      <el-empty v-if="!recentAlerts.length" description="暂无告警" :image-size="80" />
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getDashboardSummary } from "@/api/monitor-dashboard";

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
  POWER: "电能",
  ESS: "储能",
  IOT: "物联",
  SBC: "单板机",
  ANDROID: "安卓",
};

export default {
  name: "MonitorDashboard",
  mixins: [chartSkin],
  components: { StatCard, SectionCard },
  data() {
    return {
      loading: false,
      summary: {},
      charts: {},
      timer: null,
    };
  },
  computed: {
    deviceStats() {
      return this.summary.deviceStats || {};
    },
    alertStats() {
      return this.summary.alertStats || {};
    },
    topProblems() {
      return this.summary.topProblems || [];
    },
    recentAlerts() {
      return this.summary.recentAlerts || [];
    },
    healthScore() {
      const s = this.summary.healthScore;
      return s === undefined || s === null ? 0 : Number(s);
    },
    healthLevelText() {
      const lv = this.summary.healthLevel;
      if (lv) return lv;
      const s = this.healthScore;
      if (s >= 85) return "健康";
      if (s >= 60) return "亚健康";
      return "异常";
    },
    healthColor() {
      const s = this.healthScore;
      if (s >= 85) return "#67c23a";
      if (s >= 60) return "#e6a23c";
      return "#f56c6c";
    },
    resourceRows() {
      const r = this.summary.resource || {};
      return [
        { label: "平均 CPU", value: r.avgCpu, color: "#409eff" },
        { label: "平均内存", value: r.avgMemory, color: "#67c23a" },
        { label: "平均磁盘", value: r.avgDisk, color: "#e6a23c" },
        { label: "平均网络", value: r.avgNetwork, color: "#909399" },
      ];
    },
  },
  mounted() {
    this.load();
    this.timer = setInterval(this.load, 5000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    Object.keys(this.charts).forEach((k) => {
      if (this.charts[k]) {
        this.charts[k].dispose();
        this.charts[k] = null;
      }
    });
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? 0 : v;
    },
    num1(v) {
      return v === undefined || v === null ? "0.0" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    async load() {
      this.loading = true;
      try {
        const res = await getDashboardSummary();
        this.summary = res.content || {};
        await this.$nextTick();
        this.renderCharts();
      } finally {
        this.loading = false;
      }
    },
    reinitChartsForSkin() {
      Object.keys(this.charts).forEach((k) => {
        if (this.charts[k]) {
          this.charts[k].dispose();
          this.charts[k] = null;
        }
      });
      this.renderCharts();
    },
    renderCharts() {
      this.renderGauge();
      this.renderPie();
      this.renderTrend();
    },
    chart(key, ref) {
      if (!this.$refs[ref]) return null;
      if (!this.charts[key]) {
        applyChartTheme(echarts);
        this.charts[key] = echarts.init(this.$refs[ref], currentChartTheme());
      }
      return this.charts[key];
    },
    renderGauge() {
      const c = this.chart("gauge", "gaugeRef");
      if (!c) return;
      c.setOption({
        series: [
          {
            type: "gauge",
            min: 0,
            max: 100,
            radius: "92%",
            center: ["50%", "58%"],
            startAngle: 210,
            endAngle: -30,
            axisLine: {
              lineStyle: {
                width: 14,
                color: [
                  [0.6, "#f56c6c"],
                  [0.85, "#e6a23c"],
                  [1, "#67c23a"],
                ],
              },
            },
            pointer: { itemStyle: { color: this.healthColor } },
            axisTick: { show: false },
            splitLine: { length: 12, lineStyle: { color: "#fff", width: 2 } },
            axisLabel: { distance: 18, fontSize: 10, color: "#909399" },
            detail: {
              valueAnimation: true,
              fontSize: 30,
              fontWeight: "bold",
              color: this.healthColor,
              offsetCenter: [0, "40%"],
              formatter: "{value}",
            },
            data: [{ value: this.healthScore, name: "健康分" }],
            title: { offsetCenter: [0, "72%"], fontSize: 12, color: "#606266" },
          },
        ],
      });
    },
    renderPie() {
      const c = this.chart("pie", "pieRef");
      if (!c) return;
      const byType = this.deviceStats.byType || {};
      const data = Object.keys(byType)
        .map((k) => ({ name: this.typeLabel(k), value: Number(byType[k]) || 0 }))
        .filter((it) => it.value > 0);
      c.setOption({
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { type: "scroll", orient: "vertical", right: 8, top: "center", textStyle: { fontSize: 12 } },
        series: [
          {
            type: "pie",
            radius: ["40%", "68%"],
            center: ["38%", "52%"],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: "#fff", borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
            data,
          },
        ],
      });
    },
    renderTrend() {
      const c = this.chart("trend", "trendRef");
      if (!c) return;
      const t = (this.alertStats && this.alertStats.trend) || {};
      c.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["严重", "警告"], right: 10 },
        grid: { left: 40, right: 20, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: { type: "value", minInterval: 1 },
        series: [
          {
            name: "严重",
            type: "line",
            smooth: true,
            showSymbol: false,
            itemStyle: { color: "#f56c6c" },
            areaStyle: { opacity: 0.12, color: "#f56c6c" },
            data: t.critical || [],
          },
          {
            name: "警告",
            type: "line",
            smooth: true,
            showSymbol: false,
            itemStyle: { color: "#e6a23c" },
            areaStyle: { opacity: 0.12, color: "#e6a23c" },
            data: t.warning || [],
          },
        ],
      });
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.page-container {
  padding: 16px;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.source-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13px;

  &__label {
    color: var(--cm-text-regular, @text-regular);
  }
}
.gauge-chart {
  height: 240px;
  width: 100%;
}
.dist-chart {
  height: 260px;
  width: 100%;
}
.res-item {
  padding: 8px 0 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }

  &__value {
    font-size: 18px;
    font-weight: 600;
  }

  /deep/ .el-progress-bar__outer {
    background-color: var(--cm-bg-page, @bg-page);
  }
}
</style>
