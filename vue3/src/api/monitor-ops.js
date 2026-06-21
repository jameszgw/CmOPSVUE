// src/api/monitor-ops.js
// 运维监控扩展：指标趋势 / 告警事件操作 / SLO 可用率 / 容量规划 / 拨测合成监控 / 操作审计
import request from "@/utils/request";

const BASE = "/api/devops/monitor";

// ===== 1) 指标历史趋势 =====
/** 指标历史趋势区间 */
export const getMetricRange = (deviceId, metricKey, rangeMin = 60) =>
  request(`${BASE}/metric/range`, {
    method: "GET",
    params: { deviceId, metricKey, rangeMin },
  });

/** 设备可用指标键列表 */
export const getMetricKeys = (deviceId) =>
  request(`${BASE}/metric/keys`, { method: "GET", params: { deviceId } });

/** 指标最新值 */
export const getMetricLatest = (deviceId, metricKey) =>
  request(`${BASE}/metric/latest`, {
    method: "GET",
    params: { deviceId, metricKey },
  });

// ===== 2) 告警事件操作（确认 / 恢复）=====
/** 确认告警事件 */
export const ackAlertEvent = (id, operator) =>
  request(`${BASE}/alert/event/ack`, {
    method: "POST",
    params: { id, operator },
  });

/** 恢复告警事件 */
export const resolveAlertEvent = (id) =>
  request(`${BASE}/alert/event/resolve`, {
    method: "POST",
    params: { id },
  });

// ===== 3) SLO / 可用率 =====
/** SLO 汇总 */
export const getSloSummary = (windowDays = 7, target = 99.9) =>
  request(`${BASE}/slo/summary`, {
    method: "GET",
    params: { windowDays, target },
  });

/** 单设备 SLO */
export const getSloDevice = (deviceId, windowDays = 7, target = 99.9) =>
  request(`${BASE}/slo/device`, {
    method: "GET",
    params: { deviceId, windowDays, target },
  });

// ===== 4) 容量规划 =====
/** 容量风险汇总 */
export const getCapacitySummary = (windowDays = 7) =>
  request(`${BASE}/capacity/summary`, {
    method: "GET",
    params: { windowDays },
  });

/** 单设备/单指标容量预测 */
export const getCapacityForecast = (
  deviceId,
  metricKey = "diskUsage",
  windowDays = 7,
  threshold = 90
) =>
  request(`${BASE}/capacity/forecast`, {
    method: "GET",
    params: { deviceId, metricKey, windowDays, threshold },
  });

// ===== 5) 拨测 / 合成监控 =====
/** 拨测概览 */
export const getDialtestOverview = (windowMin = 60) =>
  request(`${BASE}/dialtest/overview`, {
    method: "GET",
    params: { windowMin },
  });

/** 拨测任务列表 */
export const getDialtestTasks = () =>
  request(`${BASE}/dialtest/tasks`, { method: "GET" });

/** 新增拨测任务 */
export const addDialtestTask = (data) =>
  request(`${BASE}/dialtest/task/add`, { method: "POST", data });

/** 更新拨测任务 */
export const updateDialtestTask = (data) =>
  request(`${BASE}/dialtest/task/update`, { method: "POST", data });

/** 删除拨测任务 */
export const deleteDialtestTask = (id) =>
  request(`${BASE}/dialtest/task/delete`, { method: "POST", params: { id } });

/** 启用 / 停用拨测任务 */
export const toggleDialtestTask = (id, enabled) =>
  request(`${BASE}/dialtest/task/toggle`, {
    method: "POST",
    params: { id, enabled },
  });

/** 立即执行一次拨测 */
export const runDialtestTask = (id) =>
  request(`${BASE}/dialtest/task/run`, { method: "POST", params: { id } });

/** 拨测结果（历史） */
export const getDialtestResults = (taskId, limit = 50) =>
  request(`${BASE}/dialtest/results`, {
    method: "GET",
    params: { taskId, limit },
  });

// ===== 6) 操作审计 =====
/** 操作审计列表 */
export const getAuditList = (limit = 100, operator, action) =>
  request(`${BASE}/audit/list`, {
    method: "GET",
    params: { limit, operator, action },
  });

// ===== 7) 自动修复 / 编排规则 =====
/** 修复规则列表 */
export const getRemediationRules = () =>
  request(`${BASE}/remediation/rules`, { method: "GET" });

/** 新增修复规则 */
export const addRemediationRule = (data) =>
  request(`${BASE}/remediation/rule/add`, { method: "POST", data });

/** 更新修复规则 */
export const updateRemediationRule = (data) =>
  request(`${BASE}/remediation/rule/update`, { method: "POST", data });

/** 删除修复规则 */
export const deleteRemediationRule = (id) =>
  request(`${BASE}/remediation/rule/delete`, { method: "POST", params: { id } });

/** 启用 / 停用修复规则 */
export const toggleRemediationRule = (id, enabled) =>
  request(`${BASE}/remediation/rule/toggle`, {
    method: "POST",
    params: { id, enabled },
  });

/** 修复执行历史 */
export const getRemediationHistory = (limit = 50) =>
  request(`${BASE}/remediation/history`, { method: "GET", params: { limit } });

// ===== 9) 值班排班 =====
/** 值班排班列表 */
export const getOncallRosters = () =>
  request(`${BASE}/oncall/rosters`, { method: "GET" });

/** 当前值班 */
export const getOncallCurrent = () =>
  request(`${BASE}/oncall/current`, { method: "GET" });

/** 新增值班排班 */
export const addOncallRoster = (data) =>
  request(`${BASE}/oncall/roster/add`, { method: "POST", data });

/** 更新值班排班 */
export const updateOncallRoster = (data) =>
  request(`${BASE}/oncall/roster/update`, { method: "POST", data });

/** 删除值班排班 */
export const deleteOncallRoster = (id) =>
  request(`${BASE}/oncall/roster/delete`, { method: "POST", params: { id } });

/** 启用 / 停用值班排班 */
export const toggleOncallRoster = (id, enabled) =>
  request(`${BASE}/oncall/roster/toggle`, {
    method: "POST",
    params: { id, enabled },
  });

// ===== 8) 运维报告 =====
/** 报告汇总 */
export const getReportSummary = (windowDays = 7) =>
  request(`${BASE}/report/summary`, { method: "GET", params: { windowDays } });

/** 报告导出下载 URL（用于 window.open，format: md | csv） */
export const getReportExportUrl = (format = "md", windowDays = 7) =>
  `${BASE}/report/export?format=${format}&windowDays=${windowDays}`;
