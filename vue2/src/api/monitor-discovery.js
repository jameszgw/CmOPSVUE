// src/api/monitor-discovery.js
// 网络发现：发起扫描 / 任务进度 / 任务列表 / 导入
import request from "@/utils/request";

export const startDiscoveryScan = (data) =>
  request("/api/devops/monitor/discovery/scan", { method: "POST", data });
export const getDiscoveryTask = (taskId) =>
  request("/api/devops/monitor/discovery/task", { method: "GET", params: { taskId } });
export const listDiscoveryTasks = () =>
  request("/api/devops/monitor/discovery/tasks", { method: "GET" });
export const importDiscovery = (data) =>
  request("/api/devops/monitor/discovery/import", { method: "POST", data });
