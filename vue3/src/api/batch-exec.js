import request from "@/utils/request";

/**
 * 分页查询批量执行记录
 * @param {Object} data - 原 QueryCommandExecPayload
 */
export async function fetchCommandExec(data) {
  return request("/api/devops/batch-exec/page", {
    method: "POST",
    data,
  });
}

/**
 * 提交批量执行
 * @param {Object} data - 原 CreateCommandExecPayload
 */
export async function createCommandExec(data) {
  return request("/api/devops/batch-exec/submit", {
    method: "POST",
    data,
  });
}

/**
 * 写入命令
 * @param {Object} data - 原 WriteCommandExecPayload
 */
export async function write(data) {
  return request("/api/devops/batch-exec/write", {
    method: "POST",
    data,
  });
}

/**
 * 终止执行
 * @param {Object} data - 原 TerminalCommandExecPayload
 */
export async function terminal(data) {
  return request("/api/devops/batch-exec/terminal", {
    method: "POST",
    data,
  });
}

/**
 * 批量查询执行状态
 * @param {Object} data - 原 BatchListStatusCommandExecPayload
 */
export async function listStatus(data) {
  return request("/api/devops/batch-exec/list-status", {
    method: "POST",
    data,
  });
}

/**
 * 查询执行详情
 * @param {Object} data - 原 GetCommandExecPayload
 */
export async function detail(data) {
  return request("/api/devops/batch-exec/detail", {
    method: "POST",
    data,
  });
}

/**
 * 批量删除执行记录
 * @param {Object} data - 原 BatchDeleteCommandExecPayload
 */
export async function batchDelete(data) {
  return request("/api/devops/batch-exec/delete", {
    method: "POST",
    data,
  });
}
