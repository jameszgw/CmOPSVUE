// src/api/host-env.js
import request from "@/utils/request";

/**
 * 获取主机环境变量列表
 * @param {Object} data - 原 FetchVariablePayload
 */
export async function fetchVariables(data) {
  console.log("payload", data);
  return request("/api/devops/host-env/page", {
    method: "POST",
    data,
  });
}

/**
 * 添加主机环境变量
 * @param {Object} payload - 原 CreateVariablePayload
 */
export async function addVariable(payload) {
  return request("/api/devops/host-env/create", {
    method: "POST",
    data: payload,
  });
}

/**
 * 更新主机环境变量
 * @param {Object} payload - 原 UpdateVariablePayload
 */
export async function updateVariable(payload) {
  return request(`/api/devops/host-env/update`, {
    method: "POST",
    data: payload,
  });
}

/**
 * 删除主机环境变量
 * @param {Object} payload - 原 DeleteVariablePayload
 */
export async function deleteVariable(payload) {
  return request(`/api/devops/host-env/delete`, {
    method: "POST",
    data: payload,
  });
}
