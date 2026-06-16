<template>
  <div class="page-container">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="4">
        <StatCard icon="Share" label="节点总数" :value="nodeCount" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="CircleCheck" label="健康" :value="g.healthy ?? 0" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="Warning" label="警告" :value="g.warning ?? 0" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="CircleClose" label="严重" :value="g.critical ?? 0" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="5">
        <StatCard icon="Bell" label="根因事件" :value="rc.incidentCount ?? 0" color="#909399" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="16">
        <SectionCard title="全链路拓扑" icon="Share">
          <template #extra>{{ (g.layers || []).join(" → ") }}</template>
          <div ref="chartRef" class="topo-chart"></div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="8">
        <SectionCard title="根因分析" icon="Aim">
          <template #extra>共 {{ rc.incidentCount ?? 0 }} 个事件</template>
          <el-empty
            v-if="!(rc.incidentCount > 0)"
            description="当前无根因事件"
          />
          <div v-else class="incident-list">
            <div
              v-for="inc in rc.incidents || []"
              :key="inc.id"
              class="incident"
            >
              <div class="incident__head">
                <span class="incident__title">{{ inc.title }}</span>
                <el-tag
                  size="small"
                  :type="inc.severity === 'critical' ? 'danger' : 'warning'"
                  effect="dark"
                >
                  {{ inc.severityText }}
                </el-tag>
              </div>
              <div class="incident__meta">
                <span>置信度 {{ num(inc.confidence) }}%</span>
                <span>受影响 {{ inc.affectedCount ?? 0 }}</span>
              </div>
              <div class="incident__chain">
                <template v-for="(c, i) in inc.chain || []" :key="i">
                  <el-icon v-if="i > 0" class="chain-arrow"><Right /></el-icon>
                  <div
                    class="chain-node"
                    :class="{ 'chain-node--root': c.role === '根因' }"
                  >
                    <div class="chain-node__role">{{ c.role }}</div>
                    <div class="chain-node__name">{{ c.deviceName }}</div>
                    <div class="chain-node__type">{{ typeLabel(c.type) }}</div>
                    <div class="chain-node__symptom">{{ c.symptom }}</div>
                  </div>
                </template>
              </div>
              <div v-if="inc.recommendation" class="incident__rec">
                <el-icon><MagicStick /></el-icon>
                <span>处置建议：{{ inc.recommendation }}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getTopologyGraph, getTopologyRootCause } from "@/api/monitor-topology";
import { nodeSymbol } from "@/utils/topo-symbols";

applyChartTheme(echarts);

const graph = ref({});
const rootcause = ref({});
const g = computed(() => graph.value || {});
const rc = computed(() => rootcause.value || {});
const nodeCount = computed(() => (g.value.nodes || []).length);

const chartRef = ref(null);
let chart = null;
let timer = null;

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(0));

const STATUS_COLOR = {
  healthy: "#67c23a",
  warning: "#e6a23c",
  critical: "#f56c6c",
};
const STATUS_CAT = { healthy: 0, warning: 1, critical: 2 };
const CATEGORIES = [
  { name: "健康", itemStyle: { color: "#67c23a" } },
  { name: "警告", itemStyle: { color: "#e6a23c" } },
  { name: "严重", itemStyle: { color: "#f56c6c" } },
];

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
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value, currentChartTheme());

  const nodes = g.value.nodes || [];
  const edges = g.value.edges || [];

  // group nodes by layer to distribute coordinates
  const byLayer = {};
  nodes.forEach((n) => {
    const l = n.layer ?? 0;
    (byLayer[l] = byLayer[l] || []).push(n);
  });

  const chartNodes = [];
  Object.keys(byLayer).forEach((lk) => {
    const layer = Number(lk);
    const group = byLayer[lk];
    const count = group.length;
    group.forEach((n, idx) => {
      const x = layer * 300; // 0..3 → spread horizontally
      const y = ((idx + 1) / (count + 1)) * 600; // evenly distribute vertically
      chartNodes.push({
        id: String(n.id),
        name: n.name,
        x,
        y,
        symbol: nodeSymbol(n.type, STATUS_COLOR[n.status] || "#67c23a"),
        symbolSize: 26,
        category: STATUS_CAT[n.status] ?? 0,
        itemStyle: { color: STATUS_COLOR[n.status] || "#67c23a" },
        label: { show: true },
        _meta: {
          type: typeLabel(n.type),
          ip: n.ip,
          status: n.status,
          source: n.source,
        },
      });
    });
  });

  const chartLinks = edges.map((e) => ({
    source: String(e.source),
    target: String(e.target),
    label: { show: false, formatter: e.relation },
    lineStyle: {
      color: STATUS_COLOR[e.status] || "#c0c4cc",
      width: 1.5,
      curveness: 0.1,
    },
  }));

  chart.setOption(
    {
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          if (p.dataType !== "node") {
            return p.data && p.data.label ? p.data.label.formatter || "" : "";
          }
          const m = p.data._meta || {};
          return [
            `<b>${p.data.name}</b>`,
            `类型：${m.type || "-"}`,
            `IP：${m.ip || "-"}`,
            `状态：${m.status || "-"}`,
            `来源：${{ agent: "真实采集·Agent", ssh: "真实采集·SSH", snmp: "真实采集·SNMP" }[m.source] || "模拟数据"}`,
          ].join("<br/>");
        },
      },
      legend: [
        {
          data: ["健康", "警告", "严重"],
          top: 8,
          right: 12,
        },
      ],
      series: [
        {
          type: "graph",
          layout: "none",
          roam: true,
          draggable: true,
          categories: CATEGORIES,
          label: {
            show: true,
            position: "bottom",
            fontSize: 11,
            color: "#303133",
          },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 7,
          lineStyle: { curveness: 0.1 },
          emphasis: { focus: "adjacency" },
          data: chartNodes,
          links: chartLinks,
        },
      ],
    },
    true
  );
};

// Re-create the chart under the current skin theme. Disposes the existing
// instance and lets renderChart re-init it via currentChartTheme(). Reads the
// current reactive data only — it does NOT refetch.
const rerenderChart = () => {
  if (chart) {
    chart.dispose();
    chart = null;
  }
  renderChart();
};

useChartSkin(rerenderChart);

const load = async () => {
  try {
    const [gRes, rRes] = await Promise.all([
      getTopologyGraph(),
      getTopologyRootCause(),
    ]);
    graph.value = gRes.content || {};
    rootcause.value = rRes.content || {};
    await nextTick();
    renderChart();
  } catch (e) {
    // null-safe: keep previous data
  }
};

onMounted(() => {
  load();
  timer = setInterval(load, 5000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
  chart && chart.dispose();
  chart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.page-container {
  padding: @space-lg;
}
.stat-row {
  margin-bottom: @space-xs;
}
.stat-row .el-col {
  margin-bottom: @space-md;
}
.topo-chart {
  height: 560px;
  width: 100%;
}

.incident-list {
  max-height: 560px;
  overflow-y: auto;
}
.incident {
  border: 1px solid var(--cm-border-light);
  border-radius: @radius-lg;
  padding: @space-md;
  margin-bottom: @space-md;
  background: var(--cm-bg-muted);

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
    color: var(--cm-text-primary);
  }

  &__meta {
    display: flex;
    gap: @space-lg;
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 10px;
  }

  &__chain {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 6px;
    margin-bottom: 10px;
  }

  &__rec {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    color: var(--cm-text-regular);
    background: var(--cm-success-soft);
    border-radius: @radius-base;
    padding: @space-sm 10px;

    .el-icon {
      color: var(--cm-status-healthy);
      margin-top: 2px;
    }
  }
}

.chain-arrow {
  align-self: center;
  color: var(--cm-text-placeholder);
}

.chain-node {
  flex: 1;
  min-width: 110px;
  border: 1px solid var(--cm-border-base);
  border-radius: @radius-base;
  padding: 6px @space-sm;
  background: var(--cm-bg-card);

  &--root {
    border-color: var(--cm-status-critical);
    background: var(--cm-danger-soft);
  }

  &__role {
    font-size: 11px;
    color: var(--cm-text-secondary);
  }

  &__name {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }

  &__type {
    font-size: 11px;
    color: var(--cm-text-secondary);
  }

  &__symptom {
    font-size: 11px;
    color: var(--cm-status-warning);
    margin-top: 2px;
  }

  &--root &__role {
    color: var(--cm-status-critical);
    font-weight: 600;
  }
}
</style>
