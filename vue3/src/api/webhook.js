import request from "@/utils/request";

/**
 * 分页查询 webhook
 * @param {Object} data - 原 QueryWebHooksPayload
 */
export async function fetchWebhooks(data) {
  return request("/api/devops/webhook/page", {
    method: "POST",
    data,
  });
}

/**
 * 创建 webhook
 * @param {Object} data - 原 CreateWebHookPayload
 */
export async function createWebhook(data) {
  return request("/api/devops/webhook/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新 webhook
 * @param {Object} data - 原 UpdateWebHookPayload
 */
export async function updateWebhook(data) {
  return request("/api/devops/webhook/update", {
    method: "POST",
    data,
  });
}

/**
 * 删除 webhook
 * @param {Object} data - 原 DeleteWebHookPayload
 */
export async function deleteWebhook(data) {
  console.log("payload", data);
  return request("/api/devops/webhook/delete", {
    method: "POST",
    data,
  });
}
