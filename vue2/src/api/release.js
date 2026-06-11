// src/api/release.js
import request from "@/utils/request";

/**
 * 创建发布单
 * @param {Object} data - 原 CreateReleasePayload
 */
export async function create(data) {
  return request("/api/devops/release/create", {
    method: "POST",
    data,
  });
}

/**
 * 分页查询发布单
 * @param {Object} data - 原 PageReleasePayload
 */
export async function page(data) {
  return request("/api/devops/release/page", {
    method: "POST",
    data,
  });
}

/**
 * 分页查询部署历史
 * @param {Object} data - 原 PageDeployHistoryPayload
 */
export async function pageDeployHistory(data) {
  return request("/api/devops/release/page-deploy-history", {
    method: "POST",
    data,
  });
}

/**
 * 查询部署日志
 * @param {Object} data - { pipeKey } (原 QueryPipeLogPayLoad)
 */
export async function queryPipeLog(data) {
  console.log("payload", data);
  return request(
    `/api/devops/release/query-deploy-log?pipeKey=` + data.pipeKey
  );
}

/**
 * 部署
 * @param {Object} data - 原 DeployPayload
 */
export async function deploy(data) {
  return request("/api/devops/release/deploy", {
    method: "POST",
    data,
  });
}

/**
 * 关闭发布单
 * @param {Object} data - 原 ClosePayload
 */
export async function close(data) {
  return request("/api/devops/release/close", {
    method: "POST",
    data,
  });
}
