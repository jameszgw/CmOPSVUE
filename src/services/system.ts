// src/services/system.ts
import request from "@/services/request";

/**
 * 获取系统线程池指标
 */
export async function getSystemThreadMetrics() {
  return request("/api/devops/system/get-thread-metrics", {
    method: "GET",
  });
}

/**
 * 获取系统配置信息
 */

export async function updateOption(data: any) {
  return request("/api/devops/system/update-system-option", {
    method: "POST",
    data,
  });
}

/**
 * 获取系统配置信息
 */

export async function getSystemOption() {
  return request("/api/devops/system/get-system-options", {
    method: "GET",
  });
}

/**
 * 获取系统关于信息
 */
export async function getSystemAbout() {
  return request("/api/devops/system/about", {
    method: "GET",
  });
}

/**
 * 获取IP配置信息
 */
export async function getIpConfig() {
  return request("/api/devops/system/ip-info", {
    method: "GET",
  });
}

/**
 * 更新IP配置信息
 */
export async function updateIpConfig(data: any) {
  return request("/api/devops/system/config-ip", {
    method: "POST",
    data,
  });
}

/**
 * 获取系统分析信息
 */

export async function getSystemAnalysis() {
  return request("/api/devops/system/get-system-analysis", {
    method: "GET",
  });
}
/**
 * 清理文件
 */

export async function cleanSystemFile(data: any) {
  return request("/api/devops/system/clean-system-file", {
    method: "POST",
    data,
  });
}

/**
 * 重新分析
 */

export async function reAnalysisSystem() {
  return request("/api/devops/system/re-analysis", {
    method: "GET",
  });
}
