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

    <!-- 视图切换 -->
    <div class="view-select">
      <el-select v-model="selectedViewId" size="default" @change="onViewChange">
        <el-option
          v-for="opt in viewOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <!-- 搜索 -->
    <div class="search">
      <el-input
        v-model="keyword"
        placeholder="搜索设备名称 / IP"
        clearable
        :prefix-icon="Search"
      />
    </div>

    <!-- 设备类型筛选 -->
    <div class="type-chips">
      <button
        type="button"
        class="type-chip"
        :class="{ 'type-chip--active': activeType === '' }"
        @click="activeType = ''"
      >
        全部
      </button>
      <button
        v-for="t in typeOptions"
        :key="t"
        type="button"
        class="type-chip"
        :class="{ 'type-chip--active': activeType === t }"
        @click="activeType = t"
      >
        {{ typeLabel(t) }}
      </button>
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

    <el-empty
      v-if="!loading && !groupedLayers.length"
      :description="isFiltering ? '未找到匹配的设备' : '暂无拓扑节点'"
      :image-size="80"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { Search } from "@element-plus/icons-vue";
import {
  getTopologyGraph,
  getTopologyRootCause,
  listTopoViews,
} from "@/api/monitor-topology";
import { nodeSymbol, TYPE_LABEL } from "@/utils/topo-symbols";

const router = useRouter();
const loading = ref(false);
const graphData = ref({});
const incidentCount = ref(null);
const keyword = ref("");
const activeType = ref("");
let timer = null;

// 拓扑视图选择：空字符串表示全局拓扑
const selectedViewId = ref("");
const savedViews = ref([]);
const viewOptions = computed(() => [
  { value: "", label: "全局拓扑（全部设备）" },
  ...savedViews.value.map((v) => ({ value: v.id, label: v.name })),
]);

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

const allNodes = computed(() =>
  Array.isArray(graph.value.nodes) ? graph.value.nodes : []
);

// 当前图中出现过的设备类型（去重，保持出现顺序）
const typeOptions = computed(() => {
  const seen = new Set();
  const out = [];
  for (const n of allNodes.value) {
    const t = n && n.type;
    if (t != null && t !== "" && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
});

const isFiltering = computed(
  () => activeType.value !== "" || keyword.value.trim() !== ""
);

// 应用搜索 + 类型筛选
const filteredNodes = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const type = activeType.value;
  return allNodes.value.filter((n) => {
    if (type && n.type !== type) return false;
    if (kw) {
      const name = String(n.name || n.id || "").toLowerCase();
      const ip = String(n.ip || "").toLowerCase();
      if (!name.includes(kw) && !ip.includes(kw)) return false;
    }
    return true;
  });
});

// 按 layers 顺序分组节点（基于筛选后的节点）
const groupedLayers = computed(() => {
  const nodes = filteredNodes.value;
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
  const viewId = selectedViewId.value;
  try {
    const res = await getTopologyGraph(viewId);
    graphData.value = (res && res.content) || {};
  } catch (e) {
    /* null-safe */
  } finally {
    loading.value = false;
  }
  try {
    const rc = await getTopologyRootCause(viewId);
    const c = rc && rc.content;
    incidentCount.value = c && c.incidentCount != null ? c.incidentCount : null;
  } catch (e) {
    incidentCount.value = null;
  }
};

const loadViews = async () => {
  try {
    const res = await listTopoViews();
    savedViews.value = (res && res.content) || [];
  } catch (e) {
    savedViews.value = [];
  }
};

const onViewChange = () => load();

onMounted(() => {
  loadViews();
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

/* 视图切换 */
.view-select {
  margin-top: -2px;
}
.view-select :deep(.el-select) {
  width: 100%;
}

/* 搜索 */
.search {
  margin-top: -2px;
}

/* 设备类型筛选 chips */
.type-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2px;
  margin: -2px 0;
}
.type-chips::-webkit-scrollbar {
  display: none;
}
.type-chip {
  flex: 0 0 auto;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  font-size: 13px;
  white-space: nowrap;
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  color: var(--cm-text-regular);
  cursor: pointer;
}
.type-chip--active {
  background: var(--cm-color-primary);
  border-color: var(--cm-color-primary);
  color: #fff;
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
