<template>
  <div v-loading="loading" class="page-container">
    <!-- ① 统计磁贴 -->
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-cpu" label="服务数" :value="num(ov.serviceCount)"
          :sub="`在线 ${num(ov.onlineServices)}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-magic-stick" label="模型数" :value="num(ov.modelCount)" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-data-analysis" label="GPU卡数" :value="num(ov.gpuCards)"
          :sub="`利用率 ${num(ov.gpuUtilAvg)}%`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-chat-dot-round" label="活跃会话" :value="num(ov.activeSessions)" color="#9b59b6" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-data-line" label="Token吞吐" :value="num(ov.tokensPerSec)" sub="/s" color="#13c2c2" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-data-board" label="QPS" :value="num(ov.qps)" color="#2f54eb" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-time" label="P99延迟" :value="num(ov.p99LatencyMs)" sub="ms" color="#fa8c16" />
      </el-col>
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <StatCard icon="el-icon-bell" label="24h事件" :value="num(ov.events24h)" color="#f56c6c" />
      </el-col>
    </el-row>

    <!-- ② 趋势图 -->
    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="Token 吞吐趋势" icon="el-icon-data-line">
          <div ref="tokenRef" class="ai-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="QPS 趋势" icon="el-icon-data-board">
          <div ref="qpsRef" class="ai-chart"></div>
        </SectionCard>
      </el-col>
    </el-row>

    <!-- ③ AI 推理服务 -->
    <SectionCard title="AI 推理服务" icon="el-icon-cpu">
      <el-table :data="services" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="engine" label="引擎" width="110" />
        <el-table-column prop="model" label="模型" min-width="150" show-overflow-tooltip />
        <el-table-column prop="gpu" label="GPU" width="120" show-overflow-tooltip />
        <el-table-column prop="replicas" label="副本" width="70" align="center" />
        <el-table-column prop="qps" label="QPS" width="80" align="right" />
        <el-table-column label="P99" width="90" align="right">
          <template slot-scope="{ row }">{{ num(row.p99Ms) }} ms</template>
        </el-table-column>
        <el-table-column label="吞吐" width="100" align="right">
          <template slot-scope="{ row }">{{ num(row.tokensPerSec) }} /s</template>
        </el-table-column>
        <el-table-column label="GPU利用率" width="150">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.gpuUtil)" :stroke-width="8" :color="utilColor(row.gpuUtil)" />
          </template>
        </el-table-column>
        <el-table-column label="KV命中" width="90" align="right">
          <template slot-scope="{ row }">{{ num(row.kvCacheHit) }}%</template>
        </el-table-column>
        <el-table-column label="错误率" width="90" align="right">
          <template slot-scope="{ row }">{{ num(row.errorRate) }}%</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'warning'" size="mini">
              {{ row.status === 'online' ? '在线' : '降级' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!services.length" description="暂无服务" :image-size="80" />
    </SectionCard>

    <!-- ④ AI 事件 -->
    <SectionCard title="AI 事件" icon="el-icon-bell">
      <el-table :data="events" size="small" stripe>
        <el-table-column prop="type" label="类型" width="130" />
        <el-table-column label="级别" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="levelTag(row.level)" size="mini">{{ levelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="对象" min-width="150" show-overflow-tooltip />
        <el-table-column prop="message" label="描述" min-width="240" show-overflow-tooltip />
        <el-table-column prop="timeAgo" label="时间" width="120" align="right" />
      </el-table>
      <el-empty v-if="!events.length" description="暂无事件" :image-size="80" />
    </SectionCard>

    <!-- ⑤ AI 会话 -->
    <SectionCard title="AI 会话" icon="el-icon-chat-dot-round">
      <el-table :data="sessions" size="small" stripe>
        <el-table-column prop="id" label="会话ID" width="130" show-overflow-tooltip />
        <el-table-column prop="client" label="来源" min-width="120" show-overflow-tooltip />
        <el-table-column prop="scene" label="场景" min-width="120" show-overflow-tooltip />
        <el-table-column prop="model" label="模型" min-width="140" show-overflow-tooltip />
        <el-table-column label="Token" width="110" align="right">
          <template slot-scope="{ row }">
            <el-tooltip :content="`prompt ${num(row.promptTokens)} / completion ${num(row.completionTokens)}`" placement="top">
              <span>{{ num(row.totalTokens) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="吞吐" width="100" align="right">
          <template slot-scope="{ row }">{{ num(row.tokensPerSec) }} /s</template>
        </el-table-column>
        <el-table-column label="时长" width="100" align="right">
          <template slot-scope="{ row }">{{ fmtDuration(row.durationSec) }}</template>
        </el-table-column>
        <el-table-column label="首字延迟" width="100" align="right">
          <template slot-scope="{ row }">{{ num(row.firstTokenMs) }} ms</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="sessionTag(row.status)" size="mini">{{ sessionText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!sessions.length" description="暂无会话" :image-size="80" />
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getAiOverview,
  getAiServices,
  getAiEvents,
  getAiSessions,
} from "@/api/monitor-ai";

export default {
  name: "MonitorAi",
  mixins: [chartSkin],
  components: { StatCard, SectionCard },
  data() {
    return {
      loading: false,
      overview: {},
      services: [],
      events: [],
      sessions: [],
      charts: {},
      timer: null,
    };
  },
  computed: {
    ov() {
      return this.overview || {};
    },
  },
  mounted() {
    this.load();
    this.timer = setInterval(this.load, 5000);
    window.addEventListener("resize", this.resizeAll);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener("resize", this.resizeAll);
    Object.keys(this.charts).forEach((k) => {
      if (this.charts[k]) {
        this.charts[k].dispose();
        this.charts[k] = null;
      }
    });
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? "-" : v;
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    utilColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 70) return "#e6a23c";
      return "#67c23a";
    },
    levelTag(l) {
      return l === "critical" ? "danger" : l === "warning" ? "warning" : "info";
    },
    levelText(l) {
      return l === "critical" ? "严重" : l === "warning" ? "警告" : "信息";
    },
    sessionTag(s) {
      return s === "failed" ? "danger" : s === "completed" ? "info" : "success";
    },
    sessionText(s) {
      return s === "failed" ? "失败" : s === "completed" ? "完成" : "进行中";
    },
    fmtDuration(s) {
      const n = Number(s);
      if (!Number.isFinite(n)) return "-";
      return `${Math.floor(n / 60)}m${n % 60}s`;
    },
    chart(key, ref) {
      if (!this.$refs[ref]) return null;
      if (!this.charts[key]) {
        applyChartTheme(echarts);
        this.charts[key] = echarts.init(this.$refs[ref], currentChartTheme());
      }
      return this.charts[key];
    },
    resizeAll() {
      Object.keys(this.charts).forEach((k) => {
        if (this.charts[k]) this.charts[k].resize();
      });
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
      this.renderToken();
      this.renderQps();
    },
    renderToken() {
      const c = this.chart("token", "tokenRef");
      if (!c) return;
      const t = this.ov.tokenTrend || {};
      c.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["Prompt", "Completion"], right: 10 },
        grid: { left: 48, right: 20, top: 40, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: { type: "value" },
        series: [
          {
            name: "Prompt",
            type: "line",
            smooth: true,
            showSymbol: false,
            itemStyle: { color: "#409eff" },
            areaStyle: { opacity: 0.12, color: "#409eff" },
            data: t.prompt || [],
          },
          {
            name: "Completion",
            type: "line",
            smooth: true,
            showSymbol: false,
            itemStyle: { color: "#67c23a" },
            areaStyle: { opacity: 0.12, color: "#67c23a" },
            data: t.completion || [],
          },
        ],
      });
    },
    renderQps() {
      const c = this.chart("qps", "qpsRef");
      if (!c) return;
      const t = this.ov.qpsTrend || {};
      c.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: 40, right: 20, top: 30, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: { type: "value" },
        series: [
          {
            name: "QPS",
            type: "line",
            smooth: true,
            showSymbol: false,
            itemStyle: { color: "#2f54eb" },
            areaStyle: { opacity: 0.12, color: "#2f54eb" },
            data: t.qps || [],
          },
        ],
      });
    },
    async load() {
      this.loading = true;
      try {
        const [ovRes, svcRes, evtRes, sesRes] = await Promise.all([
          getAiOverview(),
          getAiServices(),
          getAiEvents(),
          getAiSessions(),
        ]);
        this.overview = (ovRes && ovRes.content) || {};
        this.services = (svcRes && svcRes.content) || [];
        this.events = (evtRes && evtRes.content) || [];
        this.sessions = (sesRes && sesRes.content) || [];
        await this.$nextTick();
        this.renderCharts();
      } finally {
        this.loading = false;
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.ai-chart {
  height: 280px;
  width: 100%;
}
</style>
