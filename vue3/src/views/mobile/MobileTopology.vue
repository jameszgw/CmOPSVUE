<template>
  <div v-loading="loading" class="m-topo">
    <!-- 汇总 chips -->
    <div class="chips">
      <div class="chip" :style="{ '--c': '#67c23a' }">
        <span class="chip__num">{{ num(graph.healthy) }}</span>
        <span class="chip__label">健康</span>
      </div>
      <div class="chip" :style="{ '--c': '#e6a23c' }">
        <span class="chip__num">{{ num(graph.warning) }}</span>
        <span class="chip__label">警告</span>
      </div>
      <div class="chip" :style="{ '--c': '#f56c6c' }">
        <span class="chip__num">{{ num(graph.critical) }}</span>
        <span class="chip__label">严重</span>
      </div>
      <div v-if="incidentCount !== null" class="chip" :style="{ '--c': '#909399' }">
        <span class="chip__num">{{ incidentCount }}</span>
        <span class="chip__label">根因事件</span>
      </div>
    </div>

    <!-- 分层节点 -->
    <section v-for="layer in groupedLayers" :key="layer.layer" class="layer">
      <div class="layer__head">
        <span>{{ layer.layerName }}</span>
        <span class="layer__count">{{ layer.nodes.length }}</span>
      </div>
      <button
        v-for="node in layer.nodes"
        :key="node.id"
        type="button"
        class="node"
        @click="openNode(node)"
      >
        <img class="node__icon" :src="iconSrc(node.type, statusColor(node.status))" alt="" />
        <div class="node__main">
          <div class="node__name">{{ node.name || node.id }}</div>
          <div class="node__meta">
            <span v-if="node.ip">{{ node.ip }}</span>
            <span class="node__type">{{ typeLabel(node.type) }}</span>
          </div>
        </div>
        <span class="node__status" :style="{ background: softColor(node.status), color: statusColor(node.status) }">
          <span class="dot" :style="{ background: statusColor(node.status) }"></span>
          {{ statusText(node.status) }}
        </span>
      </button>
    </section>

    <el-empty v-if="!loading && !groupedLayers.length" description="暂无拓扑节点" :image-size="80" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getTopologyGraph, getTopologyRootCause } from "@/api/monitor-topology";
import { nodeSymbol, TYPE_LABEL } from "@/utils/topo-symbols";

const router = useRouter();
const loading = ref(false);
const graphData = ref({});
const incidentCount = ref(null);
let timer = null;

const graph = computed(() => graphData.value || {});
const num = (v) => (v === undefined || v === null ? "-" : v);
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const statusColor = (s) =>
  s === "critical" ? "#f56c6c" : s === "warning" ? "#e6a23c" : "#67c23a";
const softColor = (s) =>
  s === "critical"
    ? "var(--cm-danger-soft)"
    : s === "warning"
    ? "var(--cm-warning-soft)"
    : "var(--cm-success-soft)";
const statusText = (s) =>
  s === "critical" ? "严重" : s === "warning" ? "警告" : "健康";

// 图标：去掉 image:// 前缀后绑定到 <img :src>
const iconSrc = (type, color) => nodeSymbol(type, color).replace("image://", "");

// 按 layers 顺序分组节点
const groupedLayers = computed(() => {
  const nodes = Array.isArray(graph.value.nodes) ? graph.value.nodes : [];
  const layers = Array.isArray(graph.value.layers) ? graph.value.layers : [];
  const byLayer = new Map();
  for (const n of nodes) {
    const key = n.layer != null ? n.layer : "_";
    if (!byLayer.has(key)) byLayer.set(key, { layer: key, layerName: n.layerName || "未分层", nodes: [] });
    byLayer.get(key).nodes.push(n);
  }
  // 优先采用 layers 定义的顺序
  if (layers.length) {
    const ordered = [];
    const seen = new Set();
    for (const l of layers) {
      const key = l.layer != null ? l.layer : l.id != null ? l.id : l;
      const g = byLayer.get(key);
      if (g) {
        if (l.layerName || l.name) g.layerName = l.layerName || l.name;
        ordered.push(g);
        seen.add(key);
      }
    }
    for (const [key, g] of byLayer) if (!seen.has(key)) ordered.push(g);
    return ordered;
  }
  return Array.from(byLayer.values());
});

const openNode = (node) => {
  if (node && node.id != null) router.push("/m/node/" + node.id);
};

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const res = await getTopologyGraph();
    graphData.value = (res && res.content) || {};
  } catch (e) {
    /* null-safe */
  } finally {
    loading.value = false;
  }
  try {
    const rc = await getTopologyRootCause();
    const c = rc && rc.content;
    incidentCount.value = c && c.incidentCount != null ? c.incidentCount : null;
  } catch (e) {
    incidentCount.value = null;
  }
};

onMounted(() => {
  load();
  timer = setInterval(() => load(true), 10000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<style scoped>
.m-topo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 汇总 chips */
.chips {
  display: flex;
  gap: 8px;
}
.chip {
  flex: 1;
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: 10px;
  padding: 10px 4px;
  text-align: center;
  border-top: 2px solid var(--c);
}
.chip__num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--c);
}
.chip__label {
  font-size: 11px;
  color: var(--cm-text-secondary);
}

/* 分层 */
.layer__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cm-text-regular);
  margin: 4px 2px 8px;
}
.layer__count {
  font-size: 11px;
  font-weight: 600;
  color: var(--cm-text-secondary);
  background: var(--cm-bg-muted);
  border-radius: 8px;
  padding: 1px 7px;
}

/* 节点行 */
.node {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
}
.node:active {
  background: var(--cm-bg-muted);
}
.node__icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
}
.node__main {
  flex: 1;
  min-width: 0;
}
.node__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--cm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node__meta {
  display: flex;
  gap: 8px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.node__type {
  color: var(--cm-text-placeholder);
}
.node__status {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
</style>
