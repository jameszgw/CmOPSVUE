<template>
  <div class="page-container">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="4">
        <StatCard icon="el-icon-share" label="节点总数" :value="nodeTotal" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="el-icon-circle-check" label="健康" :value="healthy" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="el-icon-warning-outline" label="警告" :value="warning" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="el-icon-circle-close" label="严重" :value="critical" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="el-icon-aim" label="根因事件" :value="incidentCount" color="#909399" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="16">
        <SectionCard title="全链路拓扑" icon="el-icon-share">
          <template #extra>{{ layerLabel }}</template>
          <div ref="graphRef" class="graph-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="8">
        <SectionCard title="根因分析" icon="el-icon-aim">
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
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from "echarts";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getTopologyGraph, getTopologyRootCause } from "@/api/monitor-topology";

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
  components: { StatCard, SectionCard },
  data() {
    return {
      graph: {},
      rootcause: {},
      chart: null,
      timer: null,
    };
  },
  computed: {
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
    this.loadAll();
    this.timer = setInterval(this.loadAll, 5000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
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
          result.push({
            id: n.id,
            name: n.name,
            x: x,
            y: y,
            symbolSize: 46,
            category: STATUS_INDEX[status] === undefined ? 0 : STATUS_INDEX[status],
            itemStyle: { color: STATUS_COLOR[status] || "#67c23a" },
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
    renderChart() {
      if (!this.$refs.graphRef) return;
      if (!this.chart) this.chart = echarts.init(this.$refs.graphRef);
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
                "状态: " + (STATUS_LABEL[n.status] || n.status || "-")
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
    async loadAll() {
      try {
        const [g, r] = await Promise.all([getTopologyGraph(), getTopologyRootCause()]);
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
.page-container {
  padding: 16px;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.graph-chart {
  height: 560px;
  width: 100%;
}
.incident-list {
  max-height: 560px;
  overflow-y: auto;
}
.incident-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fafbfc;

  &:last-child {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-right: 8px;
  }

  &__meta {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;

    .meta-item {
      font-size: 12px;
      color: #909399;

      b {
        color: #409eff;
      }
    }
  }

  &__chain {
    border-top: 1px dashed #ebeef5;
    padding-top: 8px;

    .chain-label {
      font-size: 12px;
      color: #909399;
      margin-bottom: 6px;
    }
  }

  &__rec {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed #ebeef5;
    font-size: 12px;
    color: #606266;
    line-height: 1.5;

    i {
      color: #e6a23c;
      margin-right: 4px;
    }
  }
}
.chain-node {
  position: relative;
  padding: 6px 8px 6px 12px;
  margin-bottom: 6px;
  border-left: 2px solid #ebeef5;

  &--root {
    border-left-color: #f56c6c;
  }

  .chain-name {
    margin: 0 6px;
    font-size: 13px;
    color: #303133;
    font-weight: 500;
  }

  .chain-type {
    font-size: 12px;
    color: #909399;
  }

  .chain-symptom {
    margin-top: 4px;
    font-size: 12px;
    color: #606266;
  }
}
.incident-list /deep/ .el-tag--mini {
  margin-right: 4px;
}
</style>
