// src/api/monitor-resilience.js
// 韧性与安全：混沌韧性评分 + 安全基线漂移
import request from "@/utils/request";
export const getResilienceScore = () =>
  request("/api/devops/monitor/resilience/score", { method: "GET" });
export const getSecurityDrift = () =>
  request("/api/devops/monitor/security/drift", { method: "GET" });
