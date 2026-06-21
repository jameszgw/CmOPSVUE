// src/api/monitor-ops.js
// 运维监控扩展：指标趋势 / 告警事件操作 / SLO 可用率 / 容量规划 / 拨测合成监控 / 操作审计 / 自愈修复 / 运维报告
import request from "@/utils/request";

const BASE = "/api/devops/monitor";

// ===== 1) 指标历史趋势 =====
/** 指标历史趋势区间 */
export function getMetricRange(deviceId, metricKey, rangeMin = 60) {
  return request(`${BASE}/metric/range`, {
    method: "GET",
    params: { deviceId, metricKey, rangeMin },
  });
}

/** 设备可用指标键列表 */
export function getMetricKeys(deviceId) {
  return request(`${BASE}/metric/keys`, { method: "GET", params: { deviceId } });
}

/** 指标最新值 */
export function getMetricLatest(deviceId, metricKey) {
  return request(`${BASE}/metric/latest`, {
    method: "GET",
    params: { deviceId, metricKey },
  });
}

// ===== 2) 告警事件操作（确认 / 恢复）=====
/** 确认告警事件 */
export function ackAlertEvent(id, operator) {
  return request(`${BASE}/alert/event/ack`, {
    method: "POST",
    params: { id, operator },
  });
}

/** 恢复告警事件 */
export function resolveAlertEvent(id) {
  return request(`${BASE}/alert/event/resolve`, {
    method: "POST",
    params: { id },
  });
}

// ===== 3) SLO / 可用率 =====
/** SLO 汇总 */
export function getSloSummary(windowDays = 7, target = 99.9) {
  return request(`${BASE}/slo/summary`, {
    method: "GET",
    params: { windowDays, target },
  });
}

/** 单设备 SLO */
export function getSloDevice(deviceId, windowDays = 7, target = 99.9) {
  return request(`${BASE}/slo/device`, {
    method: "GET",
    params: { deviceId, windowDays, target },
  });
}

// ===== 4) 容量规划 =====
/** 容量风险汇总 */
export function getCapacitySummary(windowDays = 7) {
  return request(`${BASE}/capacity/summary`, {
    method: "GET",
    params: { windowDays },
  });
}

/** 单设备/单指标容量预测 */
export function getCapacityForecast(
  deviceId,
  metricKey = "diskUsage",
  windowDays = 7,
  threshold = 90
) {
  return request(`${BASE}/capacity/forecast`, {
    method: "GET",
    params: { deviceId, metricKey, windowDays, threshold },
  });
}

// ===== 5) 拨测 / 合成监控 =====
/** 拨测概览 */
export function getDialtestOverview(windowMin = 60) {
  return request(`${BASE}/dialtest/overview`, {
    method: "GET",
    params: { windowMin },
  });
}

/** 拨测任务列表 */
export function getDialtestTasks() {
  return request(`${BASE}/dialtest/tasks`, { method: "GET" });
}

/** 新增拨测任务 */
export function addDialtestTask(data) {
  return request(`${BASE}/dialtest/task/add`, { method: "POST", data });
}

/** 更新拨测任务 */
export function updateDialtestTask(data) {
  return request(`${BASE}/dialtest/task/update`, { method: "POST", data });
}

/** 删除拨测任务 */
export function deleteDialtestTask(id) {
  return request(`${BASE}/dialtest/task/delete`, { method: "POST", params: { id } });
}

/** 启用 / 停用拨测任务 */
export function toggleDialtestTask(id, enabled) {
  return request(`${BASE}/dialtest/task/toggle`, {
    method: "POST",
    params: { id, enabled },
  });
}

/** 立即执行一次拨测 */
export function runDialtestTask(id) {
  return request(`${BASE}/dialtest/task/run`, { method: "POST", params: { id } });
}

/** 拨测结果（历史） */
export function getDialtestResults(taskId, limit = 50) {
  return request(`${BASE}/dialtest/results`, {
    method: "GET",
    params: { taskId, limit },
  });
}

// ===== 6) 操作审计 =====
/** 操作审计列表 */
export function getAuditList(limit = 100, operator, action) {
  return request(`${BASE}/audit/list`, {
    method: "GET",
    params: { limit, operator, action },
  });
}

// ===== 7) 自愈 / 修复规则 =====
/** 自愈规则列表 */
export function getRemediationRules() {
  return request(`${BASE}/remediation/rules`, { method: "GET" });
}

/** 新增自愈规则 */
export function addRemediationRule(data) {
  return request(`${BASE}/remediation/rule/add`, { method: "POST", data });
}

/** 更新自愈规则 */
export function updateRemediationRule(data) {
  return request(`${BASE}/remediation/rule/update`, { method: "POST", data });
}

/** 删除自愈规则 */
export function deleteRemediationRule(id) {
  return request(`${BASE}/remediation/rule/delete`, {
    method: "POST",
    params: { id },
  });
}

/** 启用 / 停用自愈规则 */
export function toggleRemediationRule(id, enabled) {
  return request(`${BASE}/remediation/rule/toggle`, {
    method: "POST",
    params: { id, enabled },
  });
}

/** 自愈执行历史 */
export function getRemediationHistory(limit = 50) {
  return request(`${BASE}/remediation/history`, {
    method: "GET",
    params: { limit },
  });
}

// ===== 9) 值班排班 =====
/** 值班排班列表 */
export function getOncallRosters() {
  return request(`${BASE}/oncall/rosters`, { method: "GET" });
}

/** 当前值班 */
export function getOncallCurrent() {
  return request(`${BASE}/oncall/current`, { method: "GET" });
}

/** 新增值班排班 */
export function addOncallRoster(data) {
  return request(`${BASE}/oncall/roster/add`, { method: "POST", data });
}

/** 更新值班排班 */
export function updateOncallRoster(data) {
  return request(`${BASE}/oncall/roster/update`, { method: "POST", data });
}

/** 删除值班排班 */
export function deleteOncallRoster(id) {
  return request(`${BASE}/oncall/roster/delete`, {
    method: "POST",
    params: { id },
  });
}

/** 启用 / 停用值班排班 */
export function toggleOncallRoster(id, enabled) {
  return request(`${BASE}/oncall/roster/toggle`, {
    method: "POST",
    params: { id, enabled },
  });
}

// ===== 8) 运维报告 =====
/** 报告汇总 */
export function getReportSummary(windowDays = 7) {
  return request(`${BASE}/report/summary`, {
    method: "GET",
    params: { windowDays },
  });
}

/** 报告导出下载地址（md|csv） */
export function reportExportUrl(format = "md", windowDays = 7) {
  return `${BASE}/report/export?format=${encodeURIComponent(
    format
  )}&windowDays=${encodeURIComponent(windowDays)}`;
}
