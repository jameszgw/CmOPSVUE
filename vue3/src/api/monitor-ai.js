// src/api/monitor-ai.js
// AI 监控：大模型/推理算力可观测 —— 概览 / 推理服务 / 事件 / 会话
import request from "@/utils/request";

export const getAiOverview = () =>
  request("/api/devops/monitor/ai/overview", { method: "GET" });
export const getAiServices = () =>
  request("/api/devops/monitor/ai/services", { method: "GET" });
export const getAiEvents = () =>
  request("/api/devops/monitor/ai/events", { method: "GET" });
export const getAiSessions = () =>
  request("/api/devops/monitor/ai/sessions", { method: "GET" });
