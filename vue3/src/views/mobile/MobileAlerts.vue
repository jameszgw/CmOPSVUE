<template>
  <div v-loading="loading" class="m-alerts">
    <!-- 汇总 chips -->
    <div v-if="hasStats" class="stat-chips">
      <div class="stat-chip" :style="{ '--c': '#409eff' }">
        <span class="stat-chip__num">{{ num(stats.activeTotal) }}</span>
        <span class="stat-chip__label">活跃</span>
      </div>
      <div class="stat-chip" :style="{ '--c': '#f56c6c' }">
        <span class="stat-chip__num">{{ num(stats.critical) }}</span>
        <span class="stat-chip__label">严重</span>
      </div>
      <div class="stat-chip" :style="{ '--c': '#e6a23c' }">
        <span class="stat-chip__num">{{ num(stats.warning) }}</span>
        <span class="stat-chip__label">警告</span>
      </div>
    </div>

    <!-- 级别筛选 -->
    <div class="level-chips">
      <button
        v-for="opt in LEVEL_OPTIONS"
        :key="opt.value"
        type="button"
        class="level-chip"
        :class="{ 'level-chip--active': filterLevel === opt.value }"
        @click="setLevel(opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- 告警列表 -->
    <el-empty v-if="!loading && !sortedAlerts.length" description="暂无告警" :image-size="80" />
    <div v-else class="alert-list">
      <div
        v-for="(a, i) in sortedAlerts"
        :key="a.id ?? i"
        class="alert"
        :style="{ borderLeftColor: levelColor(a.level) }"
      >
        <div class="alert__head">
          <span class="alert__device">{{ a.deviceName || a.deviceId || "未知设备" }}</span>
          <span
            class="alert__level"
            :style="{ background: softColor(a.level), color: levelColor(a.level) }"
          >
            {{ a.levelText || levelText(a.level) }}
          </span>
        </div>
        <div v-if="metricText(a)" class="alert__metric">{{ metricText(a) }}</div>
        <div class="alert__msg">{{ a.message || "-" }}</div>
        <div v-if="a.firstTime || a.time" class="alert__time">{{ a.firstTime || a.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { getActiveAlerts, getAlertStats } from "@/api/monitor-alert";

const loading = ref(false);
const alerts = ref([]);
const stats = ref({});
const filterLevel = ref("");
let timer = null;

const LEVEL_OPTIONS = [
  { label: "全部", value: "" },
  { label: "严重", value: "critical" },
  { label: "警告", value: "warning" },
];

const num = (v) => (v === undefined || v === null || v === "" ? "-" : v);

const hasStats = computed(() => {
  const s = stats.value || {};
  return (
    s.activeTotal !== undefined ||
    s.critical !== undefined ||
    s.warning !== undefined
  );
});

const levelColor = (l) =>
  l === "critical" ? "#f56c6c" : l === "warning" ? "#e6a23c" : "#67c23a";
const softColor = (l) =>
  l === "critical"
    ? "var(--cm-danger-soft)"
    : l === "warning"
    ? "var(--cm-warning-soft)"
    : "var(--cm-success-soft)";
const levelText = (l) =>
  l === "critical" ? "严重" : l === "warning" ? "警告" : "正常";

// 指标 + 阈值描述（null-safe）
const CMP_MAP = { GT: ">", GTE: "≥", LT: "<", LTE: "≤" };
const fmtVal = (v, unit) =>
  v === undefined || v === null || v === "" ? "" : `${v}${unit || ""}`;
const metricText = (a) => {
  if (!a) return "";
  const label = a.metricLabel || a.ruleName || a.metric || "";
  const cur = fmtVal(a.value, a.unit);
  const cmp = CMP_MAP[a.comparator] || a.comparator || "";
  const thr = fmtVal(a.threshold, a.unit);
  let s = label;
  if (cur) s += s ? ` ${cur}` : cur;
  if (thr) s += `（阈值 ${cmp} ${thr}）`.replace("  ", " ");
  return s.trim();
};

// 解析时间用于排序（最新在前）
const timeOf = (a) => {
  const t = (a && (a.firstTime || a.time)) || "";
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? 0 : ms;
};
const sortedAlerts = computed(() =>
  [...alerts.value].sort((x, y) => timeOf(y) - timeOf(x))
);

const loadStats = async () => {
  try {
    const res = await getAlertStats();
    stats.value = (res && res.content) || {};
  } catch (e) {
    /* null-safe：保留旧数据 */
  }
};

const loadActive = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const res = await getActiveAlerts(filterLevel.value, "");
    alerts.value = (res && res.content) || [];
  } catch (e) {
    /* null-safe：保留旧数据 */
  } finally {
    loading.value = false;
  }
};

const setLevel = (val) => {
  if (filterLevel.value === val) return;
  filterLevel.value = val;
  loadActive();
};

onMounted(() => {
  loadStats();
  loadActive();
  timer = setInterval(() => {
    loadStats();
    loadActive(true);
  }, 10000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
});
</script>

<style scoped>
.m-alerts {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 统计 chips */
.stat-chips {
  display: flex;
  gap: 8px;
}
.stat-chip {
  flex: 1;
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-radius: 10px;
  padding: 10px 4px;
  text-align: center;
  border-top: 2px solid var(--c);
}
.stat-chip__num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--c);
}
.stat-chip__label {
  font-size: 11px;
  color: var(--cm-text-secondary);
}

/* 级别筛选 chips */
.level-chips {
  display: flex;
  gap: 8px;
}
.level-chip {
  flex: 1;
  min-height: 36px;
  border-radius: 18px;
  font-size: 13px;
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  color: var(--cm-text-regular);
  cursor: pointer;
}
.level-chip--active {
  background: var(--cm-color-primary);
  border-color: var(--cm-color-primary);
  color: #fff;
}

/* 告警卡片 */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.alert {
  background: var(--cm-bg-card);
  border: 1px solid var(--cm-border-light);
  border-left: 3px solid var(--cm-color-success);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.alert__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.alert__device {
  font-size: 15px;
  font-weight: 600;
  color: var(--cm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.alert__level {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 10px;
}
.alert__metric {
  font-size: 13px;
  color: var(--cm-text-regular);
  margin-top: 6px;
  word-break: break-all;
}
.alert__msg {
  font-size: 13px;
  color: var(--cm-text-secondary);
  margin-top: 4px;
  word-break: break-all;
}
.alert__time {
  font-size: 11px;
  color: var(--cm-text-placeholder);
  margin-top: 6px;
}
</style>
