<template>
  <div v-loading="loading" class="m-node">
    <!-- 设备头部 -->
    <section class="card head" :style="{ borderTopColor: statusColor(node.status) }">
      <img class="head__icon" :src="iconSrc(node.type, statusColor(node.status))" alt="" />
      <div class="head__main">
        <div class="head__name">{{ node.name || deviceId }}</div>
        <div class="head__meta">
          <span class="head__type">{{ typeLabel(node.type) }}</span>
          <span v-if="node.ip" class="head__ip">{{ node.ip }}</span>
        </div>
      </div>
      <span
        class="head__status"
        :style="{ background: softColor(node.status), color: statusColor(node.status) }"
      >
        <span class="dot" :style="{ background: statusColor(node.status) }"></span>
        {{ statusText(node.status) }}
      </span>
    </section>

    <!-- 指标 -->
    <section class="card">
      <div class="sec-title">关键指标</div>
      <el-empty v-if="!metricEntries.length" description="暂无指标" :image-size="60" />
      <div v-else class="metric-list">
        <div v-for="m in metricEntries" :key="m.key" class="metric">
          <span class="metric__key">{{ m.label }}</span>
          <span class="metric__val">{{ m.value }}</span>
        </div>
      </div>
    </section>

    <!-- 告警 -->
    <section class="card">
      <div class="sec-title">
        告警
        <span v-if="alertList.length" class="sec-count">{{ alertList.length }}</span>
      </div>
      <el-empty v-if="!alertList.length" description="暂无告警" :image-size="60" />
      <div v-else class="alert-list">
        <div v-for="(a, i) in alertList" :key="a.id ?? i" class="alert">
          <span class="alert__bar" :style="{ background: levelColor(a.level || a.severity) }"></span>
          <div class="alert__main">
            <div class="alert__head">
              <span class="alert__metric">{{ a.metricLabel || a.metric || a.name || "告警" }}</span>
              <span class="alert__level" :style="{ color: levelColor(a.level || a.severity) }">
                {{ a.levelText || a.severityText || levelText(a.level || a.severity) }}
              </span>
            </div>
            <div class="alert__msg">{{ a.message || a.title || "-" }}</div>
            <div v-if="a.firstTime || a.time" class="alert__time">{{ a.firstTime || a.time }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { getTopoNodeMetrics } from "@/api/monitor-topology";
import { nodeSymbol, TYPE_LABEL } from "@/utils/topo-symbols";

const route = useRoute();
const loading = ref(false);
const data = ref({});
let timer = null;

const deviceId = computed(() => route.params.deviceId);
const node = computed(() => data.value || {});

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

const levelColor = (l) =>
  l === "critical" ? "#f56c6c" : l === "warning" ? "#e6a23c" : "#67c23a";
const levelText = (l) =>
  l === "critical" ? "严重" : l === "warning" ? "警告" : "正常";

// 去掉 image:// 前缀，绑定到 <img :src>
const iconSrc = (type, color) => nodeSymbol(type, color).replace("image://", "");

// 最小化人性化键名：下划线/驼峰转空格、首字母大写
const humanize = (key) => {
  if (key == null) return "";
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
};

// 把 metrics 对象转成可渲染的键值列表（值为对象时取 value/unit）
const metricEntries = computed(() => {
  const m = node.value.metrics;
  if (!m || typeof m !== "object") return [];
  return Object.keys(m).map((key) => {
    const raw = m[key];
    let value = raw;
    if (raw && typeof raw === "object") {
      const v = raw.value ?? raw.val ?? raw.current ?? "-";
      const unit = raw.unit ?? "";
      value = unit ? `${v}${unit}` : v;
    }
    if (value === undefined || value === null) value = "-";
    return { key, label: humanize(key), value };
  });
});

const alertList = computed(() =>
  Array.isArray(node.value.alerts) ? node.value.alerts : []
);

const load = async (silent = false) => {
  const id = deviceId.value;
  if (id == null) return;
  if (!silent) loading.value = true;
  try {
    const res = await getTopoNodeMetrics(id);
    data.value = (res && res.content) || {};
  } catch (e) {
    /* null-safe：保留旧数据 */
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  load();
  timer = setInterval(() => load(true), 10000);
});
// 同一布局下切换不同节点时重新加载
watch(deviceId, () => {
  data.value = {};
  load();
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<style scoped>
.m-node {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

/* 头部 */
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 3px solid var(--cm-color-success);
}
.head__icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
}
.head__main {
  flex: 1;
  min-width: 0;
}
.head__name {
  font-size: 17px;
  font-weight: 700;
  color: var(--cm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.head__meta {
  display: flex;
  gap: 10px;
  margin-top: 3px;
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.head__ip {
  color: var(--cm-text-placeholder);
}
.head__status {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 10px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

/* 区块标题 */
.sec-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--cm-text-primary);
  margin-bottom: 10px;
}
.sec-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--cm-text-secondary);
  background: var(--cm-bg-muted);
  border-radius: 8px;
  padding: 1px 7px;
}

/* 指标列表 */
.metric-list {
  display: flex;
  flex-direction: column;
}
.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--cm-border-lighter);
}
.metric:first-child {
  border-top: none;
}
.metric__key {
  font-size: 13px;
  color: var(--cm-text-regular);
}
.metric__val {
  font-size: 14px;
  font-weight: 600;
  color: var(--cm-text-primary);
  text-align: right;
  word-break: break-all;
}

/* 告警列表 */
.alert-list {
  display: flex;
  flex-direction: column;
}
.alert {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--cm-border-lighter);
}
.alert:first-child {
  border-top: none;
}
.alert__bar {
  width: 3px;
  border-radius: 2px;
  flex: 0 0 3px;
}
.alert__main {
  flex: 1;
  min-width: 0;
}
.alert__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.alert__metric {
  font-size: 14px;
  font-weight: 600;
  color: var(--cm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.alert__level {
  font-size: 12px;
  font-weight: 600;
  flex: 0 0 auto;
}
.alert__msg {
  font-size: 13px;
  color: var(--cm-text-regular);
  margin-top: 2px;
  word-break: break-all;
}
.alert__time {
  font-size: 11px;
  color: var(--cm-text-placeholder);
  margin-top: 2px;
}
</style>
