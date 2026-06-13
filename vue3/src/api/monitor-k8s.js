// src/api/monitor-k8s.js
// K8s / 容器集群监控：概览 / 节点 / Pod / 控制平面 / 网络存储 / 事件
import request from "@/utils/request";

const get = (path, deviceId) =>
  request(`/api/devops/monitor/k8s/${path}`, {
    method: "GET",
    params: { deviceId },
  });

export const getK8sOverview = (deviceId) => get("overview", deviceId);
export const getK8sNodes = (deviceId) => get("nodes", deviceId);
export const getK8sPods = (deviceId) => get("pods", deviceId);
export const getK8sControlPlane = (deviceId) => get("controlplane", deviceId);
export const getK8sNetStorage = (deviceId) => get("netstorage", deviceId);
export const getK8sEvents = (deviceId) => get("events", deviceId);
