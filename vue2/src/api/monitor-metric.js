// src/api/monitor-metric.js
// 指标字典：设备类型列表 / 指标释义（含义、解读、来源、推荐阈值）
import request from "@/utils/request";

/** 指标字典支持的设备类型编码列表 */
export const getMetricDeviceTypes = () =>
  request("/api/devops/monitor/metric/device-types", { method: "GET" });

/**
 * 指标释义列表
 * @param {string} [deviceType] 设备类型编码（不传则返回全部）
 */
export const getMetricGlossary = (deviceType) =>
  request("/api/devops/monitor/metric/glossary", {
    method: "GET",
    params: { deviceType },
  });
