// src/api/host.js
import request from "@/utils/request";

/**
 * 分页查询主机
 * @param {Object} data - 原 QueryHostPayload
 */
export async function fetchHosts(data) {
  console.log("payload", data);
  return request("/api/devops/host/page", {
    method: "POST",
    data,
  });
}

/**
 * 创建主机
 * @param {Object} data - 原 CreateHostPayload
 */
export async function createHost(data) {
  console.log("payload", data);
  return request("/api/devops/host/create", {
    method: "POST",
    data,
  });
}

/**
 * 复制主机
 * @param {Object} data - 原 CopyHostPayload
 */
export async function copyHost(data) {
  console.log("payload", data);
  return request("/api/devops/host/copy", {
    method: "POST",
    data,
  });
}

/**
 * 删除主机
 * @param {Object} data - 原 DeleteHostPayload
 */
export async function deleteHost(data) {
  console.log("payload", data);
  return request("/api/devops/host/delete", {
    method: "POST",
    data,
  });
}

/**
 * ping 主机
 * @param {Object} data - 原 PingHostPayload
 */
export async function pingHost(data) {
  console.log("payload", data);
  return request("/api/devops/host/ping", {
    method: "POST",
    data,
  });
}

/**
 * 更新主机
 * @param {Object} data - 原 UpdateHostPayload
 */
export async function updateHost(data) {
  console.log("payload", data);
  return request("/api/devops/host/update", {
    method: "POST",
    data,
  });
}

/**
 * 获取主机分组树
 */
export async function fetchHostGroups() {
  return request("/api/devops/host-group/tree", {
    method: "POST",
  });
}

/**
 * 创建主机分组
 * @param {Object} data - 原 CreateHostGroupPayload
 */
export async function createHostGroup(data) {
  return request("/api/devops/host-group/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新主机分组
 * @param {Object} data - 原 UpdateHostGroupPayload
 */
export async function updateHostGroup(data) {
  return request("/api/devops/host-group/update", {
    method: "POST",
    data,
  });
}

/**
 * 创建主机秘钥
 * @param {Object} data - 原 CreateServerKeyPayload
 */
export async function createServerKey(data) {
  console.log("payload", data);
  return request("/api/devops/server-key/create", {
    method: "POST",
    data,
  });
}

/**
 * 更新主机秘钥
 * @param {Object} data - 原 UpdateServerKeyPayload
 */
export async function updateServerKey(data) {
  console.log("payload", data);
  return request("/api/devops/server-key/update", {
    method: "POST",
    data,
  });
}

/**
 * 删除主机秘钥
 * @param {Object} data - 原 DeleteServerKeyPayload
 */
export async function deleteServerKey(data) {
  console.log("payload", data);
  return request("/api/devops/server-key/delete", {
    method: "POST",
    data,
  });
}

/**
 * 分页查询主机秘钥
 * @param {Object} data - 原 QueryServerKeysPayload
 */
export async function queryServerKeys(data) {
  console.log("payload", data);
  return request("/api/devops/server-key/page", {
    method: "POST",
    data,
  });
}

/**
 * 获取终端 accessToken
 * @param {Object} data - { hostId }
 */
export async function getTerminalAccessToken(data) {
  console.log("payload", data);
  return request("/api/devops/host/terminal/access?hostId=" + data.hostId);
}

/**
 * 获取支持的 pty 类型
 */
export async function getSupportedPty() {
  return request("/api/devops/host/terminal/support/pty");
}

/**
 * 获取终端配置
 * @param {Object} data - { hostId }
 */
export async function getConfig(data) {
  return request("/api/devops/host/terminal/get-config?hostId=" + data.hostId);
}

/**
 * 更新终端配置
 * @param {Object} data
 */
export async function updateConfig(data) {
  console.log("payload", data);
  return request("/api/devops/host/terminal/update", {
    method: "POST",
    data,
  });
}

/**
 * 查询终端日志
 * @param {Object} data
 */
export async function queryLog(data) {
  console.log("payload", data);
  return request("/api/devops/host/terminal/log/list", {
    method: "POST",
    data,
  });
}

/**
 * 获取终端录屏路径
 * @param {Object} data - { id }
 */
export async function getScreenPath(data) {
  return request("/api/devops/host/terminal/log/screen?id=" + data.id);
}
