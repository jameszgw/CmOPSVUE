// src/api/monitor-config.js
// 监控开关（系统设置）：配置列表 / 更新单项
import request from "@/utils/request";

export const listMonitorConfig = () =>
  request("/api/devops/monitor/config/list", { method: "GET" });

export const updateMonitorConfig = (key, value) =>
  request("/api/devops/monitor/config/update", { method: "POST", data: { key, value } });
