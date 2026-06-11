// src/api/proxy.js
import request from "@/utils/request";

/**
 * 分页查询代理
 * @param {Object} data - 原 QueryProxiesPayload
 */
export async function fetchProxies(data) {
  console.log("payload", data);
  return request("/api/devops/proxy/page", {
    method: "POST",
    data,
  });
}

/**
 * 创建代理
 * @param {Object} data - 原 CreateProxyPayload
 */
export async function createProxy(data) {
  console.log("payload", data);
  return request("/api/devops/proxy/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新代理
 * @param {Object} data - 原 UpdateProxyPayload
 */
export async function updateProxy(data) {
  console.log("payload", data);
  return request("/api/devops/proxy/update", {
    method: "POST",
    data,
  });
}

/**
 * 删除代理
 * @param {Object} data - 原 DeleteProxyPayload
 */
export async function deleteProxy(data) {
  console.log("payload", data);
  return request("/api/devops/proxy/delete", {
    method: "POST",
    data,
  });
}
