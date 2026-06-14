// src/api/monitor-iot.js
// 物联感知：概览 / 传感器 / 信号 / 事件
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/iot/${path}`, { method: "GET", params: { deviceId } });
export const getIotOverview = (deviceId) => get("overview", deviceId);
export const getIotSensors = (deviceId) => get("sensors", deviceId);
export const getIotSignal = (deviceId) => get("signal", deviceId);
export const getIotEvents = (deviceId) => get("events", deviceId);
