// src/api/monitor-android.js
// 安卓多开监控：概览 / 实例 / 群控 / 趋势
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/android/${path}`, { method: "GET", params: { deviceId } });
export const getAndroidOverview = (deviceId) => get("overview", deviceId);
export const getAndroidInstances = (deviceId) => get("instances", deviceId);
export const getAndroidGroupControl = (deviceId) => get("groupControl", deviceId);
export const getAndroidTrend = (deviceId) => get("trend", deviceId);
export const dispatchGroupControl = (data) =>
  request("/api/devops/monitor/android/group-control/dispatch", { method: "POST", data });
