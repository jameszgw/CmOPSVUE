// src/models/system.ts
import { Effect } from "umi";
import * as api from "@/services/system";
import { API } from "typings";
import { message } from "antd";

export interface ThreadMetric {
  type: string;
  activeThreadCount: number;
  totalTaskCount: number;
  completedTaskCount: number;
  queueSize: number;
}

export interface SystemAbout {
  version: string;
  kitVersion: string;
  author: string;
  authorCn: string;
}

export interface IpListConfig {
  currentIp: string;
  ipLocation: string;
  whiteIpList: string;
  blackIpList: string;
  enableIpFilter: boolean;
  enableWhiteIpList: boolean;
}
export interface SystemAnalysis {
  tempFileCount: number;
  tempFileSize: string;
  logFileCount: number;
  logFileSize: string;
  swaggerFileCount: number;
  swaggerFileSize: string;
  distVersionCount: number;
  distFileSize: string;
  repoVersionCount: number;
  repoVersionFileSize: string;
  screenFileCount: number;
  screenFileSize: string;
  fileCleanThreshold: number;
  autoCleanFile: boolean;
}
//
export interface SystemOption {
  // 是否启用自动清理
  autoCleanFile: boolean;
  // 清理文件的阈值，单位为MB
  fileCleanThreshold: number;
  // 允许多端登陆
  allowMultipleLogin: boolean;
  // 登陆失败锁定
  loginFailureLock: boolean;
  // 登陆IP绑定
  loginIpBind: boolean;
  // 登录token自动续期
  loginTokenAutoRenew: boolean;
  // 登录token过期时间，单位为分钟
  loginTokenExpire: number;
  // 登录失败锁定阈值，单位为次
  loginFailureLockThreshold: number;
  // 登陆自动续签阈值
  loginTokenAutoRenewThreshold: number;
  //  自动恢复启用的调度任务
  resumeEnableSchedulerTask: boolean;
  // 终端后台主动推送心跳
  terminalActivePushHeartbeat: boolean;
  // SFTP 上传文件最大阈值 (MB)
  sftpUploadThreshold: number;
  // 统计缓存有效时间 (分)
  statisticsCacheExpire: number;
}

export interface SystemModelState {}

const initialState: SystemModelState = {};

export interface SystemModelType {
  namespace: "system";
  state: SystemModelState;
  effects: {
    getSystemThreadMetrics: Effect;
    getSystemAbout: Effect;
    getIpListConfig: Effect;
    updateIpConfig: Effect;
    cleanSystemFile: Effect;
    reAnalysisSystem: Effect;
    getSystemAnalysis: Effect;
    updateOption: Effect;
    getSystemOption: Effect;
  };
  reducers: {};
}

const SystemModel: SystemModelType = {
  namespace: "system",
  state: initialState, // 使用初始 state
  effects: {
    *updateOption({ payload, callback }, { call, put }) {
      const response: API.ResponseBody<boolean> = yield call(
        api.updateOption,
        payload
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback();
      } else {
        message.error(msg);
      }
    },
    *getSystemOption({ callback }, { call, put }) {
      const response: API.ResponseBody<SystemOption> = yield call(
        api.getSystemOption
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },

    *getSystemThreadMetrics({ callback, payload }, { call, put }) {
      const response: API.ResponseBody<boolean> = yield call(
        api.getSystemThreadMetrics,
        payload
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },
    *getSystemAnalysis({ callback }, { call, put }) {
      const response: API.ResponseBody<SystemAnalysis> = yield call(
        api.getSystemAnalysis
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },
    *reAnalysisSystem({ callback }, { call, put }) {
      const response: API.ResponseBody<boolean> = yield call(
        api.reAnalysisSystem
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },
    *cleanSystemFile({ callback }, { call, put }) {
      const response: API.ResponseBody<boolean> = yield call(
        api.cleanSystemFile
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },
    *getSystemAbout({ callback }, { call, put }) {
      const response: API.ResponseBody<SystemAbout> = yield call(
        api.getSystemAbout
      );
      const { success, msg, content } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },

    *getIpListConfig({ callback }, { call, put }) {
      const response: API.ResponseBody<IpListConfig> = yield call(
        api.getIpConfig
      );
      const { success, msg } = response;
      // 如果传入了回调函数，则执行回调函数
      // 调用回调函数
      if (success && callback && typeof callback === "function") {
        callback(response.content);
      } else {
        message.error(msg);
      }
    },

    *updateIpConfig({ payload, callback }, { call, put }) {
      const response: API.ResponseBody<boolean> = yield call(
        api.updateIpConfig,
        payload
      );
      const { success, msg } = response;

      if (success) {
        if (callback && typeof callback === "function") {
          callback(response.content);
        }
      } else {
        message.error(msg);
      }
    },
  },
  reducers: {},
};

export default SystemModel;
