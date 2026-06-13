// src/api/monitor-topology.js
// 全链路拓扑与根因关联
import request from "@/utils/request";
export const getTopologyGraph = () =>
  request("/api/devops/monitor/topology/graph", { method: "GET" });
export const getTopologyRootCause = () =>
  request("/api/devops/monitor/topology/rootcause", { method: "GET" });
