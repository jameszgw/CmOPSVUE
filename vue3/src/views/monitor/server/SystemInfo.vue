<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '已禁用模拟数据，暂无真实采集数据'" />
    <template v-else>
    <CardGrid min="200px" gap="8px">
      <StatCard dense icon="Cpu" label="CPU使用率" :value="`${num(d.cpuUsage)}%`"
        :percent="d.cpuUsage" color="#409eff" />
      <StatCard dense icon="Coin" label="内存使用率" :value="`${num(d.memoryUsage)}%`"
        :percent="d.memoryUsage" color="#67c23a" />
      <StatCard dense icon="Files" label="磁盘 IO" :value="d.diskIo?.writeSpeed || '-'"
        :sub="`读 ${d.diskIo?.readSpeed || '-'} / 写 ${d.diskIo?.writeSpeed || '-'}`" color="#e6a23c" />
      <StatCard dense icon="Connection" label="网络 IO" :value="d.netIo?.downSpeed || '-'"
        :sub="`上行 ${d.netIo?.upSpeed || '-'} / 下行 ${d.netIo?.downSpeed || '-'}`" color="#909399" />
    </CardGrid>

    <CardGrid min="320px" gap="8px">
      <SectionCard dense title="基本信息" icon="InfoFilled">
        <template #extra>
          <el-tag size="small" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
            {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
          </el-tag>
        </template>
        <InfoTable :rows="basicRows" />
      </SectionCard>
      <SectionCard dense title="系统状态" icon="SetUp">
        <InfoTable :rows="statusRows" />
      </SectionCard>
    </CardGrid>

    <CardGrid min="360px" gap="8px">
      <SectionCard dense title="网络使用趋势图" icon="TrendCharts">
        <template #extra>最近 {{ d.netTrend?.times?.length || 0 }} 个数据点</template>
        <div ref="chartRef" class="trend-chart"></div>
      </SectionCard>
      <SectionCard dense title="Top 10 进程" icon="List" scrollable
        bodyClass="dense-table fill" class="fill proc-card">
        <el-table class="dense-table" height="100%" :data="d.topProcess || []" size="small" stripe>
          <el-table-column prop="pid" label="PID" width="80" />
          <el-table-column prop="name" label="进程名" min-width="120" />
          <el-table-column label="CPU %" width="90">
            <template #default="{ row }">
              <span style="color: #67c23a">{{ num(row.cpu) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="内存 %" width="90">
            <template #default="{ row }">
              <span style="color: #e6a23c">{{ num(row.mem) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" min-width="160" />
        </el-table>
      </SectionCard>
    </CardGrid>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
applyChartTheme(echarts);
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerSystem } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const chartRef = ref(null);
let chart = null;

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const OS_LABEL = { LINUX: "Linux", UNIX: "Unix", WINDOWS: "Windows", MACOS: "macOS" };
const MODE_LABEL = { AGENT: "含 Agent", AGENTLESS: "无 Agent" };

const basicRows = computed(() => {
  const b = d.value.basic || {};
  return [
    { label: "主机名", value: b.hostname },
    { label: "IP 地址", value: b.ip },
    { label: "操作系统", value: b.osName },
    { label: "内核版本", value: b.kernel },
    { label: "运行时间", value: b.uptime },
    { label: "系统版本", value: b.platformVersion },
  ];
});

const statusRows = computed(() => {
  const s = d.value.status || {};
  return [
    { label: "系统类型", value: OS_LABEL[s.systemType] || s.systemType },
    { label: "运行状态", value: s.runStatus, color: "#67c23a" },
    { label: "采集模式", value: MODE_LABEL[s.collectMode] || s.collectMode, tag: s.agentInstalled ? "Agent 在线" : "远程采集" },
    { label: "启动时间", value: s.startTime },
    { label: "进程数", value: s.processCount },
    { label: "CPU 核心数", value: s.cpuCores },
    { label: "采集时间", value: s.collectTime },
  ];
});

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());
  const t = d.value.netTrend || {};
  chart.setOption({
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
};

const rerenderAllCharts = () => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  renderChart();
};
useChartSkin(rerenderAllCharts);

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerSystem(props.deviceId);
    data.value = res.content || {};
    await nextTick();
    renderChart();
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
onBeforeUnmount(() => {
  chart && chart.dispose();
  chart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: @dense-gap;
}
.trend-chart {
  height: @chart-h-sm;
  width: 100%;
}
.proc-card {
  min-height: @chart-h-sm + 40px;
}
</style>
