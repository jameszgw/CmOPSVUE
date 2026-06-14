// src/api/monitor-ess.js
// 储能监控：概览 / 电芯 / 充放电 / 趋势
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/ess/${path}`, { method: "GET", params: { deviceId } });
export const getEssOverview = (deviceId) => get("overview", deviceId);
export const getEssCells = (deviceId) => get("cells", deviceId);
export const getEssChargeDischarge = (deviceId) => get("chargeDischarge", deviceId);
export const getEssTrend = (deviceId) => get("trend", deviceId);
