// src/api/monitor-aiops.js
// AIOps 智能分析：异常检测 + 成本/FinOps
import request from "@/utils/request";
export const getAiopsAnomalies = () =>
  request("/api/devops/monitor/aiops/anomalies", { method: "GET" });
export const getAiopsCost = () =>
  request("/api/devops/monitor/aiops/cost", { method: "GET" });
