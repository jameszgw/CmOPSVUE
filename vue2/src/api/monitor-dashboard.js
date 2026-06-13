// src/api/monitor-dashboard.js
// 监控总览大盘
import request from "@/utils/request";
export const getDashboardSummary = () =>
  request("/api/devops/monitor/dashboard/summary", { method: "GET" });
