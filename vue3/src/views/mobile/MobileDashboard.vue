<template>
  <div v-loading="loading" class="m-dash">
    <!-- 健康评分 -->
    <section class="card health" :style="{ '--accent': healthColor }">
      <div class="health__label">系统健康评分</div>
      <div class="health__score" :style="{ color: healthColor }">{{ num(healthScore) }}</div>
      <div class="health__text" :style="{ color: healthColor }">{{ healthText }}</div>
    </section>

    <!-- 设备统计 -->
    <div class="grid2">
      <section class="card stat">
        <el-icon class="stat__icon" :style="{ color: '#409eff' }"><Monitor /></el-icon>
        <div class="stat__value">{{ num(ds.total) }}</div>
        <div class="stat__label">设备总数</div>
      </section>
      <section class="card stat">
        <el-icon class="stat__icon" :style="{ color: '#67c23a' }"><CircleCheck /></el-icon>
        <div class="stat__value">{{ num(ds.online) }}</div>
        <div class="stat__label">在线</div>
      </section>
      <section class="card stat">
        <el-icon class="stat__icon" :style="{ color: '#909399' }"><CircleClose /></el-icon>
        <div class="stat__value">{{ num(ds.offline) }}</div>
        <div class="stat__label">离线</div>
      </section>
      <section class="card stat">
        <el-icon class="stat__icon" :style="{ color: '#e6a23c' }"><Bell /></el-icon>
        <div class="stat__value">{{ num(as.active) }}</div>
        <div class="stat__label">活跃告警</div>
      </section>
    </div>

    <!-- 活跃告警分级 -->
    <section class="card alertsum">
      <div class="alertsum__title">活跃告警</div>
      <div class="alertsum__row">
        <div class="alertsum__cell">
          <span class="dot" :style="{ background: '#f56c6c' }"></span>
          <span class="alertsum__num" style="color: #f56c6c">{{ num(as.critical) }}</span>
          <span class="alertsum__name">严重</span>
        </div>
        <div class="alertsum__cell">
          <span class="dot" :style="{ background: '#e6a23c' }"></span>
          <span class="alertsum__num" style="color: #e6a23c">{{ num(as.warning) }}</span>
          <span class="alertsum__name">警告</span>
        </div>
      </div>
    </section>

    <!-- 最近 / 活跃告警列表 -->
    <section v-if="alertList.length" class="card list">
      <div class="list__title">最近告警</div>
      <div v-for="(a, i) in alertList" :key="a.id || i" class="alert-item">
        <span class="alert-item__bar" :style="{ background: levelColor(a.level) }"></span>
        <div class="alert-item__main">
          <div class="alert-item__head">
            <span class="alert-item__device">{{ a.deviceName || a.device || "-" }}</span>
            <span class="alert-item__level" :style="{ color: levelColor(a.level) }">
              {{ a.levelText || levelText(a.level) }}
            </span>
          </div>
          <div class="alert-item__msg">{{ a.message || a.metricLabel || "-" }}</div>
          <div v-if="a.firstTime || a.time" class="alert-item__time">{{ a.firstTime || a.time }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Monitor, CircleCheck, CircleClose, Bell } from "@element-plus/icons-vue";
import { getDashboardSummary } from "@/api/monitor-dashboard";
import { getActiveAlerts } from "@/api/monitor-alert";

const loading = ref(false);
const data = ref({});
const alerts = ref([]);
let timer = null;

const d = computed(() => data.value || {});
const ds = computed(() => d.value.deviceStats || {});
const as = computed(() => d.value.alertStats || {});
const healthScore = computed(() => d.value.healthScore);

const num = (v) => (v === undefined || v === null ? "-" : v);

const healthColor = computed(() => {
  const s = Number(healthScore.value);
  if (!Number.isFinite(s)) return "#909399";
  if (s < 60) return "#f56c6c";
  if (s < 85) return "#e6a23c";
  return "#67c23a";
});
const healthText = computed(() => {
  if (d.value.healthLevel) return d.value.healthLevel;
  const s = Number(healthScore.value);
  if (!Number.isFinite(s)) return "-";
  if (s < 60) return "较差";
  if (s < 85) return "一般";
  return "良好";
});

const levelColor = (level) =>
  level === "critical" ? "#f56c6c" : level === "warning" ? "#e6a23c" : "#67c23a";
const levelText = (level) =>
  level === "critical" ? "严重" : level === "warning" ? "警告" : "正常";

// 优先用 dashboard 自带的 recentAlerts，否则用活跃告警接口
const alertList = computed(() => {
  const recent = Array.isArray(d.value.recentAlerts) ? d.value.recentAlerts : [];
  const active = Array.isArray(alerts.value) ? alerts.value : [];
  return (recent.length ? recent : active).slice(0, 8);
});

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const res = await getDashboardSummary();
    data.value = (res && res.content) || {};
  } catch (e) {
    /* null-safe: 保持旧数据 */
  } finally {
    loading.value = false;
  }
  // 仅当 dashboard 未提供 recentAlerts 时再拉活跃告警
  if (!Array.isArray(data.value.recentAlerts) || !data.value.recentAlerts.length) {
    try {
      const r = await getActiveAlerts();
      const c = r && r.content;
      alerts.value = Array.isArray(c) ? c : (c && c.list) || [];
    } catch (e) {
      alerts.value = [];
    }
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
.m-dash {
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

/* 健康评分 */
.health {
  text-align: center;
  padding: 20px 14px;
  border-top: 3px solid var(--accent);
}
.health__label {
  font-size: 13px;
  color: var(--cm-text-secondary);
}
.health__score {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  margin: 4px 0;
}
.health__text {
  font-size: 15px;
  font-weight: 600;
}

/* 统计网格 */
.grid2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.stat {
  text-align: center;
  padding: 16px 10px;
}
.stat__icon {
  font-size: 26px;
}
.stat__value {
  font-size: 26px;
  font-weight: 700;
  color: var(--cm-text-primary);
  margin: 4px 0 2px;
}
.stat__label {
  font-size: 12px;
  color: var(--cm-text-secondary);
}

/* 告警分级 */
.alertsum__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--cm-text-primary);
  margin-bottom: 10px;
}
.alertsum__row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.alertsum__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.alertsum__num {
  font-size: 24px;
  font-weight: 700;
}
.alertsum__name {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

/* 告警列表 */
.list__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--cm-text-primary);
  margin-bottom: 8px;
}
.alert-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--cm-border-lighter);
}
.alert-item:first-of-type {
  border-top: none;
}
.alert-item__bar {
  width: 3px;
  border-radius: 2px;
  flex: 0 0 3px;
}
.alert-item__main {
  flex: 1;
  min-width: 0;
}
.alert-item__head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.alert-item__device {
  font-size: 14px;
  font-weight: 600;
  color: var(--cm-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.alert-item__level {
  font-size: 12px;
  font-weight: 600;
  flex: 0 0 auto;
}
.alert-item__msg {
  font-size: 13px;
  color: var(--cm-text-regular);
  margin-top: 2px;
  word-break: break-all;
}
.alert-item__time {
  font-size: 11px;
  color: var(--cm-text-placeholder);
  margin-top: 2px;
}
</style>
