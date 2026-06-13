// src/api/monitor-redis.js
// Redis 监控：概览 / 内存 / 客户端 / 键空间 / 统计 / 慢日志
import request from "@/utils/request";

const get = (path, deviceId) =>
  request(`/api/devops/monitor/redis/${path}`, {
    method: "GET",
    params: { deviceId },
  });

export const getRedisOverview = (deviceId) => get("overview", deviceId);
export const getRedisMemory = (deviceId) => get("memory", deviceId);
export const getRedisClients = (deviceId) => get("clients", deviceId);
export const getRedisKeyspace = (deviceId) => get("keyspace", deviceId);
export const getRedisStatistics = (deviceId) => get("statistics", deviceId);
export const getRedisSlowlog = (deviceId) => get("slowlog", deviceId);

export const getRedisPersistence = (deviceId) => get("persistence", deviceId);
