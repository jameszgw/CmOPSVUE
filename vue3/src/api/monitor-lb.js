// src/api/monitor-lb.js
// 负载均衡 / 网关监控：概览 / 流量 / 上游 / 连接
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/lb/${path}`, { method: "GET", params: { deviceId } });
export const getLbOverview = (deviceId) => get("overview", deviceId);
export const getLbTraffic = (deviceId) => get("traffic", deviceId);
export const getLbUpstreams = (deviceId) => get("upstreams", deviceId);
export const getLbConnections = (deviceId) => get("connections", deviceId);
