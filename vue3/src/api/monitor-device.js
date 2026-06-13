// src/api/monitor-device.js
// 监控设备管理：列表 / 详情 / 新增 / 更新 / 删除 / 表单枚举
import request from "@/utils/request";

/**
 * 按类型列出设备
 * @param {"SERVER"|"REDIS"|"DATABASE"} type
 */
export async function listDevices(type) {
  return request("/api/devops/monitor/device/list", {
    method: "GET",
    params: { type },
  });
}

/** 设备详情 */
export async function getDevice(id) {
  return request("/api/devops/monitor/device/get", {
    method: "GET",
    params: { id },
  });
}

/** 新增设备 */
export async function addDevice(data) {
  return request("/api/devops/monitor/device/add", {
    method: "POST",
    data,
  });
}

/** 更新设备 */
export async function updateDevice(data) {
  return request("/api/devops/monitor/device/update", {
    method: "POST",
    data,
  });
}

/** 删除设备 */
export async function deleteDevice(id) {
  return request("/api/devops/monitor/device/delete", {
    method: "POST",
    params: { id },
  });
}

/** 新增 / 编辑表单所需的枚举选项 */
export async function getDeviceOptions() {
  return request("/api/devops/monitor/device/options", { method: "GET" });
}
