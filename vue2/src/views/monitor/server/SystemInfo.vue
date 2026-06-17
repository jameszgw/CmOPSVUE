<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '暂无数据'" :image-size="120" />
    <template v-else>
    <CardGrid min="200px" gap="8px" class="kpi-row">
      <StatCard dense icon="el-icon-cpu" label="CPU使用率" :value="`${num(d.cpuUsage)}%`"
        :percent="d.cpuUsage" color="#409eff" />
      <StatCard dense icon="el-icon-coin" label="内存使用率" :value="`${num(d.memoryUsage)}%`"
        :percent="d.memoryUsage" color="#67c23a" />
      <StatCard dense icon="el-icon-files" label="磁盘 IO" :value="diskWrite"
        :sub="`读 ${diskRead} / 写 ${diskWrite}`" color="#e6a23c" />
      <StatCard dense icon="el-icon-connection" label="网络 IO" :value="netDown"
        :sub="`上行 ${netUp} / 下行 ${netDown}`" color="#909399" />
    </CardGrid>

    <div class="body-grid">
      <div class="top-grid">
        <SectionCard dense title="基本信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </SectionCard>
        <SectionCard dense title="系统状态" icon="el-icon-set-up">
          <InfoTable :rows="statusRows" />
        </SectionCard>
        <SectionCard dense title="网络使用趋势图" icon="el-icon-data-line" class="chart-card">
          <template #extra>最近 {{ (d.netTrend && d.netTrend.times && d.netTrend.times.length) || 0 }} 个数据点</template>
          <div ref="chartRef" class="trend-chart"></div>
        </SectionCard>
      </div>

      <SectionCard dense title="Top 10 进程" icon="el-icon-s-order"
        class="fill proc-card" body-class="dense-table fill" scrollable>
        <el-table class="dense-table" :data="d.topProcess || []" height="100%" size="small" stripe>
          <el-table-column prop="pid" label="PID" width="80" />
          <el-table-column prop="name" label="进程名" />
          <el-table-column label="CPU %" width="90">
            <template slot-scope="{ row }">
              <span style="color: #67c23a">{{ num(row.cpu) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="内存 %" width="90">
            <template slot-scope="{ row }">
              <span style="color: #e6a23c">{{ num(row.mem) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template slot-scope="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="170" />
        </el-table>
      </SectionCard>
    </div>
    </template>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerSystem } from "@/api/monitor-server";

const OS_LABEL = { LINUX: "Linux", UNIX: "Unix", WINDOWS: "Windows", MACOS: "macOS" };
const MODE_LABEL = { AGENT: "含 Agent", AGENTLESS: "无 Agent" };

export default {
  name: "ServerSystemInfo",
  mixins: [chartSkin],
  components: { StatCard, SectionCard, InfoTable, CardGrid },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, chart: null };
  },
  computed: {
    diskRead() {
      return (this.d.diskIo && this.d.diskIo.readSpeed) || "-";
    },
    diskWrite() {
      return (this.d.diskIo && this.d.diskIo.writeSpeed) || "-";
    },
    netUp() {
      return (this.d.netIo && this.d.netIo.upSpeed) || "-";
    },
    netDown() {
      return (this.d.netIo && this.d.netIo.downSpeed) || "-";
    },
    basicRows() {
      const b = this.d.basic || {};
      return [
        { label: "主机名", value: b.hostname },
        { label: "IP 地址", value: b.ip },
        { label: "操作系统", value: b.osName },
        { label: "内核版本", value: b.kernel },
        { label: "运行时间", value: b.uptime },
        { label: "系统版本", value: b.platformVersion },
      ];
    },
    statusRows() {
      const s = this.d.status || {};
      return [
        { label: "系统类型", value: OS_LABEL[s.systemType] || s.systemType },
        { label: "运行状态", value: s.runStatus, color: "#67c23a" },
        { label: "采集模式", value: MODE_LABEL[s.collectMode] || s.collectMode, tag: s.agentInstalled ? "Agent 在线" : "远程采集" },
        { label: "启动时间", value: s.startTime },
        { label: "进程数", value: s.processCount },
        { label: "CPU 核心数", value: s.cpuCores },
        { label: "采集时间", value: s.collectTime },
      ];
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    reinitChartsForSkin() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      this.renderChart();
    },
    renderChart() {
      if (!this.$refs.chartRef) return;
      if (!this.chart) {
        applyChartTheme(echarts);
        this.chart = echarts.init(this.$refs.chartRef, currentChartTheme());
      }
      const t = this.d.netTrend || {};
      this.chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["上行 KB/s", "下行 KB/s"], right: 10 },
        grid: { left: 50, right: 20, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: { type: "value" },
        series: [
          { name: "上行 KB/s", type: "line", smooth: true, areaStyle: { opacity: 0.15 },
            showSymbol: false, data: (t.upload || []).map((v) => (v / 1024).toFixed(2)) },
          { name: "下行 KB/s", type: "line", smooth: true, areaStyle: { opacity: 0.15 },
            showSymbol: false, data: (t.download || []).map((v) => (v / 1024).toFixed(2)) },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerSystem(this.deviceId);
        this.d = res.content || {};
        await this.$nextTick();
        this.renderChart();
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kpi-row {
  flex-shrink: 0;
  margin-bottom: @dense-gap;
}
.body-grid {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: @dense-gap;
}
.top-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: @dense-gap;
  align-items: stretch;
}
.chart-card {
  /deep/ .section-card__body {
    display: flex;
  }
}
.proc-card {
  min-height: 160px;
}
.trend-chart {
  height: @chart-h-sm;
  width: 100%;
  flex: 1;
}
@media (max-width: 1200px) {
  .top-grid {
    grid-template-columns: 1fr 1fr;
  }
  .chart-card {
    grid-column: 1 / -1;
  }
}
</style>
