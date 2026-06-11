// src/api/host-monitor.js
import request from "@/utils/request";

/**
 * 分页查询主机监控
 * @param {Object} data - 原 QueryHostMonitorPayload
 */
export async function fetch(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/page", {
    method: "POST",
    data,
  });
}

/**
 * 更新监控配置
 * @param {Object} data - 原 UpdateHostMonitorPayload
 */
export async function update(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/update", {
    method: "POST",
    data,
  });
}

/**
 * 测试连接
 * @param {Object} data - 原 TestConnectionPayload
 */
export async function testConnect(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/test-connect", {
    method: "POST",
    data,
  });
}

/**
 * 安装监控插件
 * @param {Object} data - 原 InstallPayload
 */
export async function install(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/install", {
    method: "POST",
    data,
  });
}

/**
 * 同步监控插件
 * @param {Object} data - 原 SyncMonitorAgentPayload
 */
export async function sync(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/sync", {
    method: "POST",
    data,
  });
}

/**
 * 检查监控状态
 * @param {Object} data - { hostId } (原 CheckStatusPayload)
 */
export async function checkStatus(data) {
  console.log("payload", data);
  return request(`/api/devops/host-monitor/check?hostId=` + data.hostId);
}

/**
 * 监控端点 ping
 * @param {Object} data - { hostId }
 */
export async function sendPing(data) {
  console.log("payload", data);
  // return request("/api/devops/host-monitor/endpoint/ping", {
  //   method: "POST",
  //   data,
  // });

  return request(
    `/api/devops/host-monitor/endpoint/ping?hostId=` + data.hostId
  );
}

/**
 * 获取监控指标
 * @param {Object} data - { hostId }
 */
export async function metrics(data) {
  console.log("payload", data);
  return request(
    `/api/devops/host-monitor/endpoint/metrics?hostId=` + data.hostId
  );
}

/**
 * 获取负载信息
 * @param {Object} data - { hostId }
 */
export async function load(data) {
  console.log("payload", data);
  return request(
    `/api/devops/host-monitor/endpoint/load?hostId=` + data.hostId
  );
}

/**
 * 获取 top 信息
 * @param {Object} data - { hostId }
 */
export async function top(data) {
  console.log("payload", data);
  return request(`/api/devops/host-monitor/endpoint/top?hostId=` + data.hostId);
}

/**
 * 获取磁盘名称
 * @param {Object} data - { hostId }
 */
export async function getDiskName(data) {
  console.log("payload", data);
  return request(
    `/api/devops/host-monitor/endpoint/disk-name?hostId=` + data.hostId
  );
}

/**
 * 获取 CPU 统计图表数据
 * @param {Object} data
 */
export async function getCpuStatistics(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/endpoint/chart-cpu", {
    method: "POST",
    data,
  });
}

/**
 * 获取内存统计图表数据
 * @param {Object} data
 */
export async function getMemoryStatistics(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/endpoint/chart-memory", {
    method: "POST",
    data,
  });
}

/**
 * 获取网络统计图表数据
 * @param {Object} data
 */
export async function getNetStatistics(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/endpoint/chart-net", {
    method: "POST",
    data,
  });
}

/**
 * 获取磁盘统计图表数据
 * @param {Object} data
 */
export async function getDiskStatistics(data) {
  console.log("payload", data);
  return request("/api/devops/host-monitor/endpoint/chart-disk", {
    method: "POST",
    data,
  });
}
