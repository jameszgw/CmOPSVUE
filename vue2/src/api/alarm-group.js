import request from "@/utils/request";

/**
 * 分页查询告警组
 * @param {Object} data - { pageNo, pageSize, ... } (原 QueryAlarmGroupPayload)
 */
export async function fetchAlarmGroup(data) {
  return request("/api/devops/alarm-group/page", {
    method: "POST",
    data,
  });
}

/**
 * 创建告警组
 * @param {Object} data - 原 CreateAlarmGroupPayload
 */
export async function createAlarmGroup(data) {
  return request("/api/devops/alarm-group/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新告警组
 * @param {Object} data - 原 UpdateAlarmGroupPayload
 */
export async function updateAlarmGroup(data) {
  return request("/api/devops/alarm-group/update", {
    method: "POST",
    data,
  });
}

/**
 * 删除告警组
 * @param {Object} data - 原 DeleteAlarmGroupPayload
 */
export async function deleteAlarmGroup(data) {
  console.log("payload", data);
  return request("/api/devops/alarm-group/delete", {
    method: "POST",
    data,
  });
}
