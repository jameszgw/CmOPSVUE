// src/api/host-alarm-config.js
import request from "@/utils/request";

/**
 * 配置主机报警
 * @param {Object} payload - 原 ConfigureHostAlarmConfigPayload
 */
export async function configureAlarmConfig(payload) {
  return request("/api/devops/host-alarm/configure", {
    method: "POST",
    data: payload,
  });
}

/**
 * 获取主机报警配置
 * @param {Object} data - { hostId } (原 GetHostAlarmConfigPayload)
 */
export async function getAlarmConfig(data) {
  console.log("payload", data);
  return request(`/api/devops/host-alarm/get-config?hostId=` + data.hostId);
}

/**
 * 分页查询报警历史
 * @param {Object} payload - 原 PageHostAlarmHistoryPayload
 */
export async function pageAlarms(payload) {
  return request("/api/devops/host-alarm/history", {
    method: "POST",
    data: payload,
  });
}
