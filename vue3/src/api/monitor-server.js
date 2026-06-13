// src/api/monitor-server.js
// 服务器监控：系统 / CPU / 内存 / 磁盘 / 网络 / 进程
import request from "@/utils/request";

const get = (path, deviceId) =>
  request(`/api/devops/monitor/server/${path}`, {
    method: "GET",
    params: { deviceId },
  });

export const getServerSystem = (deviceId) => get("system", deviceId);
export const getServerCpu = (deviceId) => get("cpu", deviceId);
export const getServerMemory = (deviceId) => get("memory", deviceId);
export const getServerDisk = (deviceId) => get("disk", deviceId);
export const getServerNetwork = (deviceId) => get("network", deviceId);
export const getServerProcess = (deviceId) => get("process", deviceId);

export const getServerHardware = (deviceId) => get("hardware", deviceId);
