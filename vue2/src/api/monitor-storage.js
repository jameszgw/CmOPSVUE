// src/api/monitor-storage.js
// 存储监控：概览 / 存储池 / 性能 / 磁盘OSD
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/storage/${path}`, { method: "GET", params: { deviceId } });
export const getStorageOverview = (deviceId) => get("overview", deviceId);
export const getStoragePools = (deviceId) => get("pools", deviceId);
export const getStoragePerformance = (deviceId) => get("performance", deviceId);
export const getStorageDisks = (deviceId) => get("disks", deviceId);
