// src/api/monitor-dispatch.js
// 下发历史（审计）：分页查询设备的下发任务记录
import request from "@/utils/request";
export const getDispatchHistory = (data) =>
  request("/api/devops/monitor/dispatch/history", { method: "POST", data });
