// src/api/monitor-gpu.js
// GPU / 边缘监控：概览 / GPU卡 / 推理与边缘
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/gpu/${path}`, { method: "GET", params: { deviceId } });
export const getGpuOverview = (deviceId) => get("overview", deviceId);
export const getGpuCards = (deviceId) => get("gpus", deviceId);
export const getGpuWorkloads = (deviceId) => get("workloads", deviceId);
