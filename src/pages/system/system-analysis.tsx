import React, { useState, useEffect } from "react";
import styles from "./system-analysis.less";
import {
  Form,
  Input,
  Switch,
  Descriptions,
  Button,
  Tooltip,
  Modal,
  message,
} from "antd";
import { SYSTEM_CLEAR_TYPE, SYSTEM_OPTION_KEY } from "@/utils/index";
import { useDispatch, useSelector } from "umi";

const layout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 17 },
};

// 类型定义
export interface AnalysisData {
  tempFileCount: number;
  tempFileSize: string;
  logFileCount: number;
  logFileSize: string;
  swapFileCount: number;
  swapFileSize: string;
  distVersionCount: number;
  distFileSize: string;
  repoVersionCount: number;
  repoVersionFileSize: string;
  screenFileCount: number;
  screenFileSize: string;

  fileCleanThreshold?: number;
  autoCleanFile?: boolean;
}

const SystemAnalysisPage: React.FC = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const [analysis, setAnalysis] = useState<AnalysisData>({
    tempFileCount: 0,
    tempFileSize: "0 B",
    logFileCount: 0,
    logFileSize: "0 B",
    swapFileCount: 0,
    swapFileSize: "0 B",
    distVersionCount: 0,
    distFileSize: "0 B",
    repoVersionCount: 0,
    repoVersionFileSize: "0 B",
    screenFileCount: 0,
    screenFileSize: "0 B",
    fileCleanThreshold: undefined,
    autoCleanFile: false,
  });

  const [visibleClean, setVisibleClean] = useState({
    tempFile: true,
    logFile: true,
    swapFile: true,
    distFile: true,
    repoFile: true,
    screenFile: true,
  });

  const [reAnalysisLoading, setReAnalysisLoading] = useState(false);
  const [fileCleanThreshold, setFileCleanThreshold] = useState<
    number | undefined
  >(undefined);
  const [fileCleanThresholdLoading, setFileCleanThresholdLoading] =
    useState(false);
  const [autoCleanFile, setAutoCleanFile] = useState(false);
  const [autoCleanFileLoading, setAutoCleanFileLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch({
      type: "system/getSystemAnalysis",
      callback: (data: AnalysisData) => {
        setAnalysis(data);
        setFileCleanThreshold(data.fileCleanThreshold);
        setAutoCleanFile(!!data.autoCleanFile);
      },
    });
  };

  const saveCleanThreshold = () => {
    const threshold = parseInt(String(fileCleanThreshold), 10);
    if (threshold < 0) {
      message.warning("自动清理阈值不能小于0");
      return;
    }

    setFileCleanThresholdLoading(true);
    dispatch({
      type: "system/updateOption",
      payload: {
        option: SYSTEM_OPTION_KEY.FILE_CLEAN_THRESHOLD.value,
        value: threshold,
      },
      callback: (success: boolean) => {
        message.success("已保存");
        setFileCleanThresholdLoading(false);
      },
      onError: (success: boolean) => {
        message.error("保存失败");
        setFileCleanThresholdLoading(false);
      },
    });
  };

  const changeAutoClean = (checked: boolean) => {
    setAutoCleanFileLoading(true);
    dispatch({
      type: "system/updateOption",
      payload: {
        option: SYSTEM_OPTION_KEY.ENABLE_AUTO_CLEAN_FILE.value,
        value: checked,
      },
      callback: (success: boolean) => {
        setAutoCleanFile(checked);
        message.success("已保存");
        setAutoCleanFileLoading(false);
      },
      onError: () => {
        message.error("保存失败");
        setAutoCleanFileLoading(false);
      },
    });
  };

  const clear = async (type: any) => {
    Modal.confirm({
      title: "确认清理",
      content:
        "确认后会清理超过清理阈值的所有文件, 请先确认数据是否已备份, 清理后数据无法回滚!",
      okText: "确认",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        setVisibleClean((prev) => ({ ...prev, [type.key]: false }));
        const pending = message.loading(`正在提交 ${type.label} 清理任务...`);
        dispatch({
          type: "system/cleanFiles",
          payload: {
            cleanType: type.value,
          },
          callback: () => {
            pending();
            message.success(
              `正在清理 ${type.label}, 清理完成后需要手动点击重新分析`
            );
          },
          onError: () => {
            pending();
            setVisibleClean((prev) => ({ ...prev, [type.key]: true }));
          },
        });
      },
    });
  };

  const reAnalysis = () => {
    setReAnalysisLoading(true);
    dispatch({
      type: "system/reAnalyze",
      callback: (data: AnalysisData) => {
        setReAnalysisLoading(false);
        for (const key in visibleClean) {
          setVisibleClean((prev) => ({ ...prev, [key]: true }));
        }
        setAnalysis(data);
      },
      onError: () => {
        message.error("重新分析失败");
        setReAnalysisLoading(false);
      },
    });
  };

  return (
    <div className={styles["system-analysis-container"]}>
      {/* 清理配置 */}
      <div className={styles["system-clean-container"]}>
        <div className={styles["system-clean-title"]}>清理配置</div>
        <div className={styles["system-clean-form-wrapper"]}>
          <Form form={form} {...layout}>
            <Form.Item label="清理阈值(天)">
              <Input
                className={styles["clean-threshold-input"]}
                value={fileCleanThreshold}
                onChange={(e) =>
                  setFileCleanThreshold(parseInt(e.target.value, 10))
                }
                disabled={fileCleanThresholdLoading}
              />
              <Button
                type="primary"
                loading={fileCleanThresholdLoading}
                onClick={saveCleanThreshold}
                style={{ marginLeft: 8 }}
              >
                保存
              </Button>
              <div className={styles.extra}>
                设置后清理文件时会删除当前时间减当前值之前修改的所有文件,
                如果设置为0则全部清理
              </div>
            </Form.Item>
            <Form.Item label="自动清理">
              <Switch
                checked={autoCleanFile}
                loading={autoCleanFileLoading}
                onChange={changeAutoClean}
              />
              <div className={styles.extra}>
                开启后每天1:30会自动清理超过所配置阈值的文件
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* 系统统计分析 */}
      <div className={styles["system-analysis-descriptions"]}>
        <div className={styles["system-analysis-title"]}>系统统计分析</div>
        <div className={styles["analysis-items"]}>
          <div className={styles["analysis-item"]}>
            <span className={styles["analysis-label"]}>临时文件：</span>
            <span className={styles["analysis-count"]}>
              {analysis.tempFileCount} 个
            </span>
            <span className={styles["analysis-size"]}>
              {analysis.tempFileSize}
            </span>
          </div>
          <div className={styles["analysis-item"]}>
            <span className={styles["analysis-label"]}>日志文件：</span>
            <span className={styles["analysis-count"]}>
              {analysis.logFileCount} 个
            </span>
            <span className={styles["analysis-size"]}>
              {analysis.logFileSize}
            </span>
          </div>
          <div className={styles["analysis-item"]}>
            <span className={styles["analysis-label"]}>交换区文件：</span>
            <span className={styles["analysis-count"]}>
              {analysis.swapFileCount} 个
            </span>
            <span className={styles["analysis-size"]}>
              {analysis.swapFileSize}
            </span>
          </div>
          <div className={styles["analysis-item"]}>
            <span className={styles["analysis-label"]}>构建产物：</span>
            <span className={styles["analysis-count"]}>
              {analysis.distVersionCount} 个
            </span>
            <span className={styles["analysis-size"]}>
              {analysis.distFileSize}
            </span>
          </div>
          <div className={styles["analysis-item"]}>
            <span className={styles["analysis-label"]}>录屏文件：</span>
            <span className={styles["analysis-count"]}>
              {analysis.screenFileCount} 个
            </span>
            <span className={styles["analysis-size"]}>
              {analysis.screenFileSize}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles["system-analysis-handler-container"]}>
        <Button onClick={reAnalysis} className={styles["re-analysis-button"]}>
          重新分析
        </Button>
      </div>
    </div>
  );
};

export default SystemAnalysisPage;
