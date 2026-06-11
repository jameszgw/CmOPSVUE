// src/api/user.js
import request from "@/utils/request";

/**
 * 退出登录
 */
export async function logout() {
  return request("/sso/logout", { method: "GET" });
}

/**
 * 分页查询应用成员
 * @param {Object} data - 原 QueryAppAccountPayload
 */
export async function queryAppMembers(data) {
  return request("/api/devops/app/page-app-members", {
    method: "POST",
    data,
  });
}

/**
 * 查询成员
 * @param {Object} data - 原 QueryAccountPayload
 */
export async function queryMembers(data) {
  return request("/api/devops/user/query-members", {
    method: "POST",
    data,
  });
}

/**
 * 获取当前用户信息
 */
export async function getUserInfo() {
  return request("/api/devops/user/current", {
    method: "GET",
  });
}

/**
 * 查询用户菜单
 */
export async function queryUserMenu() {
  return request("/api/devops/user/menu", {
    method: "POST",
  });
}
