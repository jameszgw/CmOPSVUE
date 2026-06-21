// src/api/monitor-meta.js
// 监控元数据：第三方产品适配版本一览 / 单产品版本适配状态
import request from "@/utils/request";

/** 适配版本一览（全量矩阵） */
export const getSupportedVersions = () =>
  request("/api/devops/monitor/meta/supported-versions", { method: "GET" });

/**
 * 单产品检测版本的适配状态
 * @param {string} product 产品 KEY（如 REDIS / MYSQL / KAFKA / NGINX / K8S 等）
 * @param {string} version 实际检测到的版本
 */
export const getVersionStatus = (product, version) =>
  request("/api/devops/monitor/meta/version-status", {
    method: "GET",
    params: { product, version },
  });
