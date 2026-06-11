// src/api/app.js
import request from "@/utils/request";

/**
 * 分页查询应用
 * @param {Object} data - 原 QueryAppPayload
 */
export async function pageAppList(data) {
  return request("/api/devops/app/page", {
    method: "POST",
    data,
  });
}

/**
 * 创建应用
 * @param {Object} data - 原 CreateAppPayload
 */
export async function createApp(data) {
  return request("/api/devops/app/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新应用成员
 * @param {Object} data - 原 UpdateAppMemberPayload
 */
export async function updateMember(data) {
  return request("/api/devops/app/update-member", {
    method: "POST",
    data,
  });
}

/**
 * 添加应用成员
 * @param {Object} data - 原 AddAppMemberPayload
 */
export async function addMember(data) {
  return request("/api/devops/app/add-member", {
    method: "POST",
    data,
  });
}

/**
 * 删除应用成员
 * @param {Object} data - 原 DeleteAppMemberPayload
 */
export async function deleteMember(data) {
  return request("/api/devops/app/delete-member", {
    method: "POST",
    data,
  });
}

/**
 * 创建应用环境
 * @param {Object} data - 原 CreateAppEnvPayload
 */
export async function createAppEnv(data) {
  console.log(data);
  return request("/api/devops/app/create-env", {
    method: "POST",
    data,
  });
}

/**
 * 获取应用详情
 * @param {number} id - 应用 id
 */
export async function getAppDetail(id) {
  return request(`/api/devops/app/get?id=${id}`);
}

/**
 * 查询应用分支列表
 * @param {Object} data - { appId, search } (原 ListAppBranchPayload)
 */
export async function listAppBranch(data) {
  return request(
    `/api/devops/app/list-branch?appId=${data.appId}&search=${data.search}`
  );
}

/**
 * 修改应用环境 ConfigMap
 * @param {Object} data - 原 ModifyAppEnvConfigMapPayload
 */
export async function modifyAppEnvConfigMap(data) {
  return request(`/api/devops/app/modify-config-map`, {
    method: "POST",
    data,
  });
}

/**
 * 修改应用环境变量
 * @param {Object} data - 原 ModifyAppEnvVarsPayload
 */
export async function modifyAppEnvVars(data) {
  return request(`/api/devops/app/modify-env-vars`, {
    method: "POST",
    data,
  });
}

/**
 * 创建 Service
 * @param {Object} data - 原 AppServicePayload
 */
export async function createService(data) {
  return request(`/api/devops/app/create-svc`, {
    method: "POST",
    data,
  });
}

/**
 * 修改 Service
 * @param {Object} data - 原 AppServicePayload
 */
export async function modifyService(data) {
  return request(`/api/devops/app/modify-svc`, {
    method: "POST",
    data,
  });
}

/**
 * 删除 Service
 * @param {Object} data - 原 DeleteAppServicePayload
 */
export async function deleteService(data) {
  return request(`/api/devops/app/delete-svc`, {
    method: "POST",
    data,
  });
}

/**
 * 保存 Ingress（域名配置）
 * @param {Object} data - 原 SaveIngressPayload
 */
export async function saveIngress(data) {
  return request(`/api/devops/app/modify-env-domains`, {
    method: "POST",
    data,
  });
}

/**
 * 修改应用环境资源配置
 * @param {Object} data - 原 ModifyAppResourcesPayload
 */
export async function modifyAppEnvResource(data) {
  return request(`/api/devops/app/modify-env-resources`, {
    method: "POST",
    data,
  });
}

/**
 * 应用扩缩容
 * @param {Object} data
 */
export async function scale(data) {
  return request(`/api/devops/app/scale`, {
    method: "POST",
    data,
  });
}

/**
 * 获取应用环境
 * @param {Object} data
 */
export async function getAppEnv(data) {
  return request(`/api/devops/app/get-app-env`, {
    method: "POST",
    data,
  });
}

/**
 * 查询应用 Pod 列表
 * @param {Object} data
 */
export async function listAppPods(data) {
  return request(`/api/devops/app/list-app-pods`, {
    method: "POST",
    data,
  });
}

/**
 * 获取部门列表
 */
export async function getDepartments() {
  return request(`/api/devops/app/departments`);
}

/**
 * 分页查询应用成员
 * @param {Object} data - 原 QueryAppMemberPayload
 */
export async function pageAppMembers(data) {
  return request(`/api/devops/app/page-app-members`, {
    method: "POST",
    data,
  });
}
