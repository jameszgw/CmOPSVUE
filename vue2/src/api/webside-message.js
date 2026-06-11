import request from "@/utils/request";

/**
 * 获取未读消息数量
 */
export async function getUnreadCount() {
  return request(`/api/devops/web-side-message/get-unread-count`, {
    method: "GET",
  });
}

/**
 * 全部设为已读
 */
export async function setAllRead() {
  return request(`/api/devops/web-side-message/set-all-read`, {
    method: "GET",
  });
}

/**
 * 已读消息
 * @param {Object} data
 */
export async function read(data) {
  return request("/api/devops/web-side-message/read", {
    method: "POST",
    data,
  });
}

/**
 * 删除全部已读消息
 */
export async function deleteAllRead() {
  return request(`/api/devops/web-side-message/delete-all-read`, {
    method: "POST",
  });
}

/**
 * 删除消息
 * @param {Object} data
 */
export async function deleteMessage(data) {
  return request("/api/devops/web-side-message/delete", {
    method: "POST",
    data,
  });
}

/**
 * 查询消息列表
 * @param {Object} data
 */
export async function fetchMessages(data) {
  return request("/api/devops/web-side-message/query", {
    method: "POST",
    data,
  });
}
