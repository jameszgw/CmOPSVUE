// src/api/monitor-power.js
// 电能监控：概览 / 回路 / 电池 / 趋势
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/power/${path}`, { method: "GET", params: { deviceId } });
export const getPowerOverview = (deviceId) => get("overview", deviceId);
export const getPowerCircuits = (deviceId) => get("circuits", deviceId);
export const getPowerBattery = (deviceId) => get("battery", deviceId);
export const getPowerTrend = (deviceId) => get("trend", deviceId);
