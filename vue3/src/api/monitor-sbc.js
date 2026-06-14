// src/api/monitor-sbc.js
// 单板机监控：概览 / 板载传感器 / GPIO / 趋势
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/sbc/${path}`, { method: "GET", params: { deviceId } });
export const getSbcOverview = (deviceId) => get("overview", deviceId);
export const getSbcBoardSensors = (deviceId) => get("boardSensors", deviceId);
export const getSbcGpio = (deviceId) => get("gpio", deviceId);
export const getSbcTrend = (deviceId) => get("trend", deviceId);
