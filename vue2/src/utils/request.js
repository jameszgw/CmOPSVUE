// 统一请求封装：对齐原 React 版 src/services/request.ts 的行为
// 响应体约定: { success: boolean, code: string, msg: string, content: T }
import axios from "axios";
import { Message } from "element-ui";

const instance = axios.create({
  baseURL: "/",
  timeout: 30000,
});

instance.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.success === false) {
      Message.error(data.msg || "请求失败");
      return Promise.reject(data);
    }
    return data;
  },
  (error) => {
    const data = error.response && error.response.data;
    Message.error((data && data.msg) || error.message || "网络异常");
    return Promise.reject(error);
  }
);

/**
 * 与原 umi-request 调用方式保持一致:
 * request(url, { method, data, params })
 */
export default function request(url, options = {}) {
  const { method = "GET", data, params, ...rest } = options;
  return instance.request({ url, method, data, params, ...rest });
}
