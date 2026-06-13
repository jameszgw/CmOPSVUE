// src/api/monitor-mq.js
// 消息中间件监控：概览 / 主题 / 消费组 / Broker
import request from "@/utils/request";
const get = (path, deviceId) =>
  request(`/api/devops/monitor/mq/${path}`, { method: "GET", params: { deviceId } });
export const getMqOverview = (deviceId) => get("overview", deviceId);
export const getMqTopics = (deviceId) => get("topics", deviceId);
export const getMqConsumers = (deviceId) => get("consumers", deviceId);
export const getMqBrokers = (deviceId) => get("brokers", deviceId);
