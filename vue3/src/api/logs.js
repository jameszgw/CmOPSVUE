import request from "@/utils/request";

/**
 * 查询操作日志
 * @param {Object} data - 原 QueryLogPayload
 */
export async function queryLogs(data) {
  return request("/api/devops/logs/query-logs", {
    method: "POST",
    data,
  });
}

/**
 * 获取事件分类
 */
export async function getEventClassify() {
  return request("/api/devops/logs/get-classify", {
    method: "GET",
  });
}

/**
 * 获取事件类型
 * @param {Object} data - { classify } (原 GetEventTypePayload)
 */
export async function getEventType(data) {
  return request(
    "/api/devops/logs/get-event-type?eventClassify=" + data.classify,
    {
      method: "GET",
    }
  );
}
