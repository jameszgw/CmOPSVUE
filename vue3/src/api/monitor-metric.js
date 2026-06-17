// src/api/monitor-metric.js
// 指标字典（指标说明）：设备类型列表 + 指标释义/阈值
import request from "@/utils/request";

// 全部设备类型代码（SERVER/REDIS/...）
export const getMetricDeviceTypes = () =>
  request("/api/devops/monitor/metric/device-types", {
    method: "GET",
  });

// 指标释义。deviceType 可选：留空/省略 = 全部类型
export const getMetricGlossary = (deviceType) =>
  request("/api/devops/monitor/metric/glossary", {
    method: "GET",
    params: { deviceType },
  });
