<template>
  <ScreenPage v-loading="loading" title="AI 推理监控" gap="8px">
    <!-- ① 统计磁贴 -->
    <CardGrid min="160px" gap="8px" class="row-stats">
      <StatCard dense icon="Cpu" label="服务数" :value="num(ov.serviceCount)"
        :sub="`在线 ${num(ov.onlineServices)}`" color="#409eff" />
      <StatCard dense icon="MagicStick" label="模型数" :value="num(ov.modelCount)" color="#67c23a" />
      <StatCard dense icon="Histogram" label="GPU卡数" :value="num(ov.gpuCards)"
        :sub="`利用率 ${num(ov.gpuUtilAvg)}%`" color="#e6a23c" />
      <StatCard dense icon="ChatDotRound" label="活跃会话" :value="num(ov.activeSessions)" color="#9b59b6" />
      <StatCard dense icon="DataLine" label="Token吞吐" :value="num(ov.tokensPerSec)" :sub="'/s'" color="#13c2c2" />
      <StatCard dense icon="TrendCharts" label="QPS" :value="num(ov.qps)" color="#2f54eb" />
      <StatCard dense icon="Timer" label="P99延迟" :value="num(ov.p99LatencyMs)" :sub="'ms'" color="#fa8c16" />
      <StatCard dense icon="Bell" label="24h事件" :value="num(ov.events24h)" color="#f56c6c" />
    </CardGrid>

    <!-- ② 趋势图 -->
    <CardGrid min="320px" gap="8px" class="row-charts">
      <SectionCard dense title="Token 吞吐趋势" icon="DataLine">
        <div ref="tokenRef" class="ai-chart"></div>
      </SectionCard>
      <SectionCard dense title="QPS 趋势" icon="TrendCharts">
        <div ref="qpsRef" class="ai-chart"></div>
      </SectionCard>
    </CardGrid>

    <!-- ③ AI 推理服务 + 事件 + 会话：并排内部滚动 -->
    <CardGrid min="340px" gap="8px" class="row-tables fill">
      <SectionCard dense scrollable bodyClass="dense-table fill" class="fill" title="AI 推理服务" icon="Cpu">
        <el-table class="dense-table" height="100%" :data="services" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="engine" label="引擎" width="110" />
        <el-table-column prop="model" label="模型" min-width="150" show-overflow-tooltip />
        <el-table-column prop="gpu" label="GPU" width="120" show-overflow-tooltip />
        <el-table-column prop="replicas" label="副本" width="70" align="center" />
        <el-table-column prop="qps" label="QPS" width="80" align="right" />
        <el-table-column label="P99" width="90" align="right">
          <template #default="{ row }">{{ num(row.p99Ms) }} ms</template>
        </el-table-column>
        <el-table-column label="吞吐" width="100" align="right">
          <template #default="{ row }">{{ num(row.tokensPerSec) }} /s</template>
        </el-table-column>
        <el-table-column label="GPU利用率" width="150">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.gpuUtil)" :stroke-width="8"
              :color="utilColor(row.gpuUtil)" />
          </template>
        </el-table-column>
        <el-table-column label="KV命中" width="90" align="right">
          <template #default="{ row }">{{ num(row.kvCacheHit) }}%</template>
        </el-table-column>
        <el-table-column label="错误率" width="90" align="right">
          <template #default="{ row }">{{ num(row.errorRate) }}%</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'warning'" size="small">
              {{ row.status === 'online' ? '在线' : '降级' }}
            </el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无服务" :image-size="60" />
        </template>
      </el-table>
      </SectionCard>

      <!-- ④ AI 事件 -->
      <SectionCard dense scrollable bodyClass="dense-table fill" class="fill" title="AI 事件" icon="Bell">
        <el-table class="dense-table" height="100%" :data="events" size="small" stripe>
        <el-table-column prop="type" label="类型" width="130" />
        <el-table-column label="级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="levelTag(row.level)" size="small">{{ levelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="对象" min-width="150" show-overflow-tooltip />
        <el-table-column prop="message" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column prop="timeAgo" label="时间" width="120" align="right" />
        <template #empty>
          <el-empty description="暂无事件" :image-size="60" />
        </template>
      </el-table>
      </SectionCard>

      <!-- ⑤ AI 会话 -->
      <SectionCard dense scrollable bodyClass="dense-table fill" class="fill" title="AI 会话" icon="ChatDotRound">
        <el-table class="dense-table" height="100%" :data="sessions" size="small" stripe>
        <el-table-column prop="id" label="会话ID" width="130" show-overflow-tooltip />
        <el-table-column prop="client" label="来源" min-width="120" show-overflow-tooltip />
        <el-table-column prop="scene" label="场景" min-width="120" show-overflow-tooltip />
        <el-table-column prop="model" label="模型" min-width="140" show-overflow-tooltip />
        <el-table-column label="Token" width="110" align="right">
          <template #default="{ row }">
            <el-tooltip :content="`prompt ${num(row.promptTokens)} / completion ${num(row.completionTokens)}`" placement="top">
              <span>{{ num(row.totalTokens) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="吞吐" width="100" align="right">
          <template #default="{ row }">{{ num(row.tokensPerSec) }} /s</template>
        </el-table-column>
        <el-table-column label="时长" width="100" align="right">
          <template #default="{ row }">{{ fmtDuration(row.durationSec) }}</template>
        </el-table-column>
        <el-table-column label="首字延迟" width="100" align="right">
          <template #default="{ row }">{{ num(row.firstTokenMs) }} ms</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="sessionTag(row.status)" size="small">{{ sessionText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无会话" :image-size="60" />
        </template>
      </el-table>
      </SectionCard>
    </CardGrid>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getAiOverview,
  getAiServices,
  getAiEvents,
  getAiSessions,
} from "@/api/monitor-ai";

applyChartTheme(echarts);

const loading = ref(false);
const overview = ref({});
const services = ref([]);
const events = ref([]);
const sessions = ref([]);

const ov = computed(() => overview.value || {});

const tokenRef = ref(null);
const qpsRef = ref(null);
let tokenChart = null;
let qpsChart = null;
let timer = null;

const num = (v) => (v === undefined || v === null ? "-" : v);
const clamp = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const utilColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 90) return "#f56c6c";
  if (n >= 70) return "#e6a23c";
  return "#67c23a";
};
const levelTag = (l) => (l === "critical" ? "danger" : l === "warning" ? "warning" : "info");
const levelText = (l) => (l === "critical" ? "严重" : l === "warning" ? "警告" : "信息");
const sessionTag = (s) => (s === "failed" ? "danger" : s === "completed" ? "info" : "success");
const sessionText = (s) => (s === "failed" ? "失败" : s === "completed" ? "完成" : "进行中");
const fmtDuration = (s) => {
  const n = Number(s);
  if (!Number.isFinite(n)) return "-";
  return `${Math.floor(n / 60)}m${n % 60}s`;
};

const renderToken = () => {
  if (!tokenRef.value) return;
  if (!tokenChart) tokenChart = echarts.init(tokenRef.value, currentChartTheme());
  const t = ov.value.tokenTrend || {};
  tokenChart.setOption({
    tooltip: { trigger: "axis" },
    legend: { data: ["Prompt", "Completion"], right: 10 },
    grid: { left: 48, right: 20, top: 40, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
    yAxis: { type: "value" },
    series: [
      { name: "Prompt", type: "line", smooth: true, showSymbol: false,
        itemStyle: { color: "#409eff" }, areaStyle: { opacity: 0.12 }, data: t.prompt || [] },
      { name: "Completion", type: "line", smooth: true, showSymbol: false,
        itemStyle: { color: "#67c23a" }, areaStyle: { opacity: 0.12 }, data: t.completion || [] },
    ],
  });
};

const renderQps = () => {
  if (!qpsRef.value) return;
  if (!qpsChart) qpsChart = echarts.init(qpsRef.value, currentChartTheme());
  const t = ov.value.qpsTrend || {};
  qpsChart.setOption({
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
    yAxis: { type: "value" },
    series: [
      { name: "QPS", type: "line", smooth: true, showSymbol: false,
        itemStyle: { color: "#2f54eb" }, areaStyle: { opacity: 0.12 }, data: t.qps || [] },
    ],
  });
};

const renderAll = () => {
  renderToken();
  renderQps();
};

const rerenderAllCharts = () => {
  if (tokenChart) { tokenChart.dispose(); tokenChart = null; }
  if (qpsChart) { qpsChart.dispose(); qpsChart = null; }
  renderAll();
};

useChartSkin(rerenderAllCharts);

const resizeAll = () => {
  tokenChart && tokenChart.resize();
  qpsChart && qpsChart.resize();
};

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const [ovRes, svcRes, evtRes, sesRes] = await Promise.all([
      getAiOverview(),
      getAiServices(),
      getAiEvents(),
      getAiSessions(),
    ]);
    overview.value = ovRes?.content || {};
    services.value = svcRes?.content || [];
    events.value = evtRes?.content || [];
    sessions.value = sesRes?.content || [];
    await nextTick();
    renderAll();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
  timer = setInterval(() => load(true), 5000);
  window.addEventListener("resize", resizeAll);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
  window.removeEventListener("resize", resizeAll);
  tokenChart && tokenChart.dispose();
  qpsChart && qpsChart.dispose();
  tokenChart = qpsChart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats,
.row-charts {
  flex-shrink: 0;
}

.row-tables {
  flex: 1;
  min-height: 0;
}

.ai-chart {
  height: @chart-h-sm;
  width: 100%;
}
</style>
