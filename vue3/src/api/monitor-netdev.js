// src/api/monitor-netdev.js
// 网络设备监控：概览 / 端口 / 会话 / 协议拓扑
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/netdev/${path}`, { method: "GET", params: { deviceId } });
export const getNetDevOverview = (deviceId) => get("overview", deviceId);
export const getNetDevPorts = (deviceId) => get("ports", deviceId);
export const getNetDevSessions = (deviceId) => get("sessions", deviceId);
export const getNetDevProtocols = (deviceId) => get("protocols", deviceId);
