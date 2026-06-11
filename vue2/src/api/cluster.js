// src/api/cluster.js
import request from "@/utils/request";

/**
 * 查询全部集群
 */
export async function listAll() {
  return request("/api/devops/cluster/list-all", {
    method: "GET",
    headers: {
      Accept: "application/json", // 设置 Accept 头为 application/json
      // 其他头部信息...
    },
  });
}

/**
 * 创建集群
 * @param {Object} data - 原 CreateClusterPayload
 */
export async function createCluster(data) {
  return request("/api/devops/cluster/create", {
    method: "POST",
    data,
  });
}

/**
 * 连接集群
 * @param {Object} data - 原 ConnectClusterPayload
 */
export async function connect(data) {
  return request("/api/devops/cluster/create", {
    method: "POST",
    data,
  });
}
