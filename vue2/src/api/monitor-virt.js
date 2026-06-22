// src/api/monitor-virt.js
// 虚拟化监控（KVM / VMware / Docker）：概览 / 宿主节点 / 虚机容器 / 资源容量
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/virt/${path}`, { method: "GET", params: { deviceId } });
export const getVirtOverview = (deviceId) => get("overview", deviceId);
export const getVirtHosts = (deviceId) => get("hosts", deviceId);
export const getVirtGuests = (deviceId) => get("guests", deviceId);
export const getVirtCapacity = (deviceId) => get("capacity", deviceId);
