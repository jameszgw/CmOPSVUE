import request from "@/utils/request";

/**
 * 分页查询脚本模板
 * @param {Object} data - 原 QueryScriptPayload
 */
export async function fetchScripts(data) {
  return request("/api/devops/script-template/page", {
    method: "POST",
    data,
  });
}

/**
 * 创建脚本模板
 * @param {Object} data - 原 CreateScriptPayload
 */
export async function createScript(data) {
  return request("/api/devops/script-template/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新脚本模板
 * @param {Object} data - 原 UpdateScriptPayload
 */
export async function updateScript(data) {
  return request("/api/devops/script-template/update", {
    method: "POST",
    data,
  });
}

/**
 * 删除脚本模板
 * @param {Object} data - 原 DeleteScriptPayload
 */
export async function deleteScript(data) {
  console.log("payload", data);
  return request("/api/devops/script-template/delete", {
    method: "POST",
    data,
  });
}
