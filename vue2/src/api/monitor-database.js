// src/api/monitor-database.js
// 数据库监控：概览 / 连接 / 性能 / 表统计
import request from "@/utils/request";

const get = (path, deviceId) =>
  request(`/api/devops/monitor/database/${path}`, {
    method: "GET",
    params: { deviceId },
  });

export const getDatabaseOverview = (deviceId) => get("overview", deviceId);
export const getDatabaseConnection = (deviceId) => get("connection", deviceId);
export const getDatabasePerformance = (deviceId) => get("performance", deviceId);
export const getDatabaseTables = (deviceId) => get("tables", deviceId);

export const getDatabaseEngine = (deviceId) => get("engine", deviceId);
