<template>
  <screen-page title="全链路拓扑" gap="8px">
    <template #header-extra>
      <div class="topo-extra">
        <el-select
          v-model="selectedViewId"
          size="mini"
          class="view-select"
          placeholder="选择拓扑视图"
          @change="onViewChange"
        >
          <el-option
            v-for="opt in viewOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <span v-if="layerLabel" class="layer-label">{{ layerLabel }}</span>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <card-grid min="160px" gap="8px" class="row-stats">
      <stat-card dense icon="el-icon-share" label="节点总数" :value="nodeTotal" color="#409eff" />
      <stat-card dense icon="el-icon-circle-check" label="健康" :value="healthy" color="#67c23a" />
      <stat-card dense icon="el-icon-warning-outline" label="警告" :value="warning" color="#e6a23c" />
      <stat-card dense icon="el-icon-circle-close" label="严重" :value="critical" color="#f56c6c" />
      <stat-card dense icon="el-icon-aim" label="根因事件" :value="incidentCount" color="#909399" />
    </card-grid>

    <!-- 主体：拓扑图（填满高度）+ 根因分析（内部滚动），并排 -->
    <div class="row-main fill">
      <section-card dense title="全链路拓扑" icon="el-icon-share" class="topo-card fill">
        <el-empty v-if="nodeTotal === 0" description="该视图暂无拓扑节点" />
        <div v-show="nodeTotal > 0" ref="graphRef" class="graph-chart"></div>
      </section-card>

      <section-card
        dense
        scrollable
        body-class="fill"
        class="rc-card fill"
        title="根因分析"
        icon="el-icon-aim"
      >
        <template #extra>共 {{ incidentCount }} 个事件</template>
        <el-empty v-if="incidentCount === 0" description="当前无根因事件" />
        <div v-else class="incident-list">
          <div v-for="inc in incidents" :key="inc.id" class="incident-card">
            <div class="incident-card__head">
              <span class="incident-card__title">{{ inc.title }}</span>
              <el-tag size="mini" :type="severityType(inc.severity)" effect="dark">
                {{ inc.severityText }}
              </el-tag>
            </div>
            <div class="incident-card__meta">
              <span class="meta-item">置信度 <b>{{ confPct(inc.confidence) }}%</b></span>
              <span class="meta-item">受影响 <b>{{ num(inc.affectedCount) }}</b></span>
            </div>
            <div class="incident-card__chain">
              <div class="chain-label">传播链路</div>
              <div
                v-for="(c, ci) in (inc.chain || [])"
                :key="ci"
                class="chain-node"
                :class="{ 'chain-node--root': c.role === '根因' }"
              >
                <el-tag size="mini" :type="c.role === '根因' ? 'danger' : 'warning'" effect="plain">
                  {{ c.role }}
                </el-tag>
                <span class="chain-name">{{ c.deviceName }}</span>
                <span class="chain-type">{{ typeLabel(c.type) }}</span>
                <div class="chain-symptom">{{ c.symptom }}</div>
              </div>
            </div>
            <div class="incident-card__rec">
              <i class="el-icon-magic-stick"></i>
              <span>{{ inc.recommendation }}</span>
            </div>
          </div>
        </div>
      </section-card>
    </div>
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
import { getTopologyGraph, getTopologyRootCause, listTopoViews } from "@/api/monitor-topology";
import { nodeSymbol } from "@/utils/topo-symbols";

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
const STATUS_LABEL = { healthy: "健康", warning: "警告", critical: "严重" };
const STATUS_COLOR = { healthy: "#67c23a", warning: "#e6a23c", critical: "#f56c6c" };
const STATUS_INDEX = { healthy: 0, warning: 1, critical: 2 };

export default {
  name: "MonitorTopology",
  mixins: [chartSkin],
  components: { ScreenPage, CardGrid, StatCard, SectionCard },
  data() {
    return {
      graph: {},
      rootcause: {},
      chart: null,
      timer: null,
      selectedViewId: "",
      views: [],
    };
  },
  computed: {
    viewOptions() {
      const opts = [{ value: "", label: "全局拓扑（全部设备）" }];
      (this.views || []).forEach((v) => {
        opts.push({ value: v.id, label: v.name });
      });
      return opts;
    },
    nodeTotal() {
      return ((this.graph.nodes && this.graph.nodes.length) || 0);
    },
    healthy() {
      return this.num(this.graph.healthy);
    },
    warning() {
      return this.num(this.graph.warning);
    },
    critical() {
      return this.num(this.graph.critical);
    },
    incidentCount() {
      return Number(this.rootcause.incidentCount) || 0;
    },
    incidents() {
      return this.rootcause.incidents || [];
    },
    layerLabel() {
      const ls = this.graph.layers || [];
      return ls.length ? ls.join(" → ") : "";
    },
  },
  mounted() {
    this.loadViews();
    this.loadAll();
    this.timer = setInterval(this.loadAll, 5000);
    window.addEventListener("resize", this.resizeChart);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener("resize", this.resizeChart);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    resizeChart() {
      if (this.chart) this.chart.resize();
    },
    num(v) {
      return v === undefined || v === null ? 0 : v;
    },
    confPct(v) {
      const n = Number(v) || 0;
      return n <= 1 ? Math.round(n * 100) : Math.round(n);
    },
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    severityType(s) {
      return s === "critical" ? "danger" : "warning";
    },
    buildNodes() {
      const nodes = this.graph.nodes || [];
      // group by layer to distribute y
      const byLayer = {};
      nodes.forEach((n) => {
        const l = Number(n.layer) || 0;
        if (!byLayer[l]) byLayer[l] = [];
        byLayer[l].push(n);
      });
      const result = [];
      Object.keys(byLayer).forEach((lk) => {
        const layer = Number(lk);
        const group = byLayer[lk];
        const count = group.length;
        group.forEach((n, idx) => {
          const x = layer * 320;
          const y = count <= 1 ? 280 : (idx / (count - 1)) * 560;
          const status = n.status || "healthy";
          const isVirtual = n.type === "VIRTUAL" || n.type === "INTERNET";
          const color = isVirtual ? "#909399" : STATUS_COLOR[status] || "#67c23a";
          result.push({
            id: n.id,
            name: n.name,
            x: x,
            y: y,
            symbol: nodeSymbol(n.type, color),
            symbolSize: 26,
            category: STATUS_INDEX[status] === undefined ? 0 : STATUS_INDEX[status],
            label: { show: true },
            _raw: n,
          });
        });
      });
      return result;
    },
    buildLinks() {
      const edges = this.graph.edges || [];
      return edges.map((e) => ({
        source: e.source,
        target: e.target,
        lineStyle: { color: STATUS_COLOR[e.status] || "#67c23a", width: 1.6, curveness: 0.05 },
        label: { show: true, formatter: e.relation || "", fontSize: 10, color: "#909399" },
      }));
    },
    reinitChartsForSkin() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      this.renderChart();
    },
    renderChart() {
      if (!this.$refs.graphRef) return;
      if (!this.chart) {
        applyChartTheme(echarts);
        this.chart = echarts.init(this.$refs.graphRef, currentChartTheme());
      }
      const categories = [
        { name: STATUS_LABEL.healthy, itemStyle: { color: STATUS_COLOR.healthy } },
        { name: STATUS_LABEL.warning, itemStyle: { color: STATUS_COLOR.warning } },
        { name: STATUS_LABEL.critical, itemStyle: { color: STATUS_COLOR.critical } },
      ];
      this.chart.setOption(
        {
          tooltip: {
            trigger: "item",
            formatter: (p) => {
              if (p.dataType !== "node") return p.name || "";
              const n = (p.data && p.data._raw) || {};
              return (
                "<b>" + (n.name || "") + "</b><br/>" +
                "类型: " + this.typeLabel(n.type) + "<br/>" +
                "IP: " + (n.ip || "-") + "<br/>" +
                "状态: " + (STATUS_LABEL[n.status] || n.status || "-") + "<br/>" +
                "来源: " +
                ({ agent: "真实采集·Agent", ssh: "真实采集·SSH", snmp: "真实采集·SNMP", winrm: "真实采集·WinRM", redis: "真实采集·Redis" }[n.source] || "模拟数据")
              );
            },
          },
          legend: [
            {
              data: [STATUS_LABEL.healthy, STATUS_LABEL.warning, STATUS_LABEL.critical],
              top: 8,
            },
          ],
          series: [
            {
              type: "graph",
              layout: "none",
              roam: true,
              draggable: true,
              categories: categories,
              label: {
                show: true,
                position: "bottom",
                fontSize: 11,
                color: "#303133",
              },
              edgeLabel: { show: false },
              lineStyle: { color: "source", opacity: 0.7 },
              emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
              data: this.buildNodes(),
              links: this.buildLinks(),
            },
          ],
        },
        true
      );
    },
    async loadViews() {
      try {
        const res = await listTopoViews();
        this.views = (res && res.content) || [];
      } catch (e) {
        this.views = [];
      }
    },
    onViewChange() {
      this.loadAll();
    },
    async loadAll() {
      const viewId = this.selectedViewId;
      try {
        const [g, r] = await Promise.all([
          getTopologyGraph(viewId),
          getTopologyRootCause(viewId),
        ]);
        this.graph = (g && g.content) || {};
        this.rootcause = (r && r.content) || {};
        await this.$nextTick();
        this.renderChart();
      } catch (e) {
        // swallow polling errors
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

// 主体并排：拓扑图占 2 份宽，根因面板占 1 份；均填满剩余高度
.row-main {
  display: flex;
  gap: @space-sm;
  flex: 1;
  min-height: 0;
}
.topo-card {
  flex: 2;
  min-width: 0;
}
.rc-card {
  flex: 1;
  min-width: 280px;
}

.topo-extra {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.view-select {
  width: 200px;
}
.layer-label {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.graph-chart {
  height: 100%;
  min-height: @chart-h-md;
  width: 100%;
}
.incident-list {
  width: 100%;
}
.incident-card {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: @radius-lg;
  padding: @space-md 14px;
  margin-bottom: @space-md;
  background: var(--cm-bg-muted, @bg-muted);

  &:last-child {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: @space-sm;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-right: @space-sm;
  }

  &__meta {
    display: flex;
    gap: @space-lg;
    margin-bottom: 10px;

    .meta-item {
      font-size: 12px;
      color: var(--cm-text-secondary, @text-secondary);

      b {
        color: var(--cm-color-primary, @color-primary);
      }
    }
  }

  &__chain {
    border-top: 1px dashed var(--cm-border-light, @border-light);
    padding-top: @space-sm;

    .chain-label {
      font-size: 12px;
      color: var(--cm-text-secondary, @text-secondary);
      margin-bottom: 6px;
    }
  }

  &__rec {
    margin-top: 10px;
    padding-top: @space-sm;
    border-top: 1px dashed var(--cm-border-light, @border-light);
    font-size: 12px;
    color: var(--cm-text-regular, @text-regular);
    line-height: 1.5;

    i {
      color: var(--cm-color-warning, @color-warning);
      margin-right: @space-xs;
    }
  }
}
.chain-node {
  position: relative;
  padding: 6px @space-sm 6px @space-md;
  margin-bottom: 6px;
  border-left: 2px solid var(--cm-border-light, @border-light);

  &--root {
    border-left-color: var(--cm-color-danger, @color-danger);
  }

  .chain-name {
    margin: 0 6px;
    font-size: 13px;
    color: var(--cm-text-primary, @text-primary);
    font-weight: 500;
  }

  .chain-type {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }

  .chain-symptom {
    margin-top: @space-xs;
    font-size: 12px;
    color: var(--cm-text-regular, @text-regular);
  }
}
.incident-list /deep/ .el-tag--mini {
  margin-right: @space-xs;
}
</style>
