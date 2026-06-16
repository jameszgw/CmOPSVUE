// src/api/monitor-topology.js
// 全链路拓扑与根因关联 + 可编辑拓扑维护
import request from "@/utils/request";
export const getTopologyGraph = (viewId) =>
  request("/api/devops/monitor/topology/graph", {
    method: "GET",
    params: viewId ? { viewId } : {},
  });
export const getTopologyRootCause = (viewId) =>
  request("/api/devops/monitor/topology/rootcause", {
    method: "GET",
    params: viewId ? { viewId } : {},
  });

// ===== 拓扑视图（topo-view） =====
export const listTopoViews = () =>
  request("/api/devops/monitor/topology/topo-view/list-all", {
    method: "POST",
    data: {},
  });

export const createTopoView = (data) =>
  request("/api/devops/monitor/topology/topo-view/create", {
    method: "POST",
    data,
  });

export const updateTopoView = (data) =>
  request("/api/devops/monitor/topology/topo-view/update", {
    method: "POST",
    data,
  });

export const deleteTopoView = (viewId) =>
  request("/api/devops/monitor/topology/topo-view/delete", {
    method: "POST",
    data: { viewId },
  });

export const getTopoViewGraph = (viewId) =>
  request("/api/devops/monitor/topology/topo-view/graph", {
    method: "POST",
    data: { viewId },
  });

// 保存整图（删除并重建该视图的节点/连线，保留提供的 id）
export const saveTopoGraph = (viewId, nodes, edges) =>
  request("/api/devops/monitor/topology/topo-view/save-graph", {
    method: "POST",
    data: { viewId, nodes: nodes || [], edges: edges || [] },
  });

// ===== 拓扑节点（topo-node） =====
export const createTopoNode = (data) =>
  request("/api/devops/monitor/topology/topo-node/create", {
    method: "POST",
    data,
  });

export const updateTopoNode = (data) =>
  request("/api/devops/monitor/topology/topo-node/update", {
    method: "POST",
    data,
  });

export const deleteTopoNode = (nodeId) =>
  request("/api/devops/monitor/topology/topo-node/delete", {
    method: "POST",
    data: { nodeId },
  });

// ===== 拓扑连线（topo-edge） =====
export const createTopoEdge = (data) =>
  request("/api/devops/monitor/topology/topo-edge/create", {
    method: "POST",
    data,
  });

export const updateTopoEdge = (data) =>
  request("/api/devops/monitor/topology/topo-edge/update", {
    method: "POST",
    data,
  });

export const deleteTopoEdge = (edgeId) =>
  request("/api/devops/monitor/topology/topo-edge/delete", {
    method: "POST",
    data: { edgeId },
  });

// ===== 节点指标（node-metrics） =====
export const getTopoNodeMetrics = (deviceId) =>
  request("/api/devops/monitor/topology/node-metrics", {
    method: "GET",
    params: { deviceId },
  });
