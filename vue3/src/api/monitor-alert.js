// src/api/monitor-alert.js
// 告警中心：阈值规则管理 + 活跃告警 / 历史 / 统计
import request from "@/utils/request";

/** 阈值规则列表 */
export async function listAlertRules(deviceType) {
  return request("/api/devops/monitor/alert/rules", {
    method: "GET",
    params: { deviceType },
  });
}

/** 新增阈值规则 */
export async function addAlertRule(data) {
  return request("/api/devops/monitor/alert/rule/add", { method: "POST", data });
}

/** 更新阈值规则 */
export async function updateAlertRule(data) {
  return request("/api/devops/monitor/alert/rule/update", { method: "POST", data });
}

/** 删除阈值规则 */
export async function deleteAlertRule(id) {
  return request("/api/devops/monitor/alert/rule/delete", {
    method: "POST",
    params: { id },
  });
}

/** 启用 / 停用阈值规则 */
export async function toggleAlertRule(id, enabled) {
  return request("/api/devops/monitor/alert/rule/toggle", {
    method: "POST",
    params: { id, enabled },
  });
}

/** 活跃告警 */
export async function getActiveAlerts(level, deviceType) {
  return request("/api/devops/monitor/alert/active", {
    method: "GET",
    params: { level, deviceType },
  });
}

/** 历史告警 */
export async function getAlertHistory(limit = 30) {
  return request("/api/devops/monitor/alert/history", {
    method: "GET",
    params: { limit },
  });
}

/** 告警统计 */
export async function getAlertStats() {
  return request("/api/devops/monitor/alert/stats", { method: "GET" });
}
