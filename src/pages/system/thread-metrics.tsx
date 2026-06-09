import React, { useEffect, useState } from "react";
import { Card, Button, Descriptions, Typography, Spin } from "antd";
import { PageContainer } from "@ant-design/pro-layout";
import { ReloadOutlined } from "@ant-design/icons";
import { connect, Dispatch } from "umi";
import {
  enumValueOf,
  enumKeyOf,
  THREAD_POOL_METRICS_TYPE,
} from "@/utils/index";
import styles from "./thread-metrics.less";

interface ThreadMetric {
  type: string;
  activeThreadCount: number;
  totalTaskCount: number;
  completedTaskCount: number;
  queueSize: number;
}

interface ThreadMetricsProps {
  dispatch: Dispatch;
}

const ThreadMetrics: React.FC<ThreadMetricsProps> = ({ dispatch }) => {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<ThreadMetric[]>([]);

  const init = () => {
    setLoading(true);
    dispatch({
      type: "system/getSystemThreadMetrics",
      callback: (data: ThreadMetric[]) => {
        setMetrics(data);
        setLoading(false);
      },
      onError: () => {
        setLoading(false);
      },
    });
  };

  useEffect(() => {
    init();
  }, []);

  const formatThreadType = (type: string, field: string) => {
    return enumValueOf(THREAD_POOL_METRICS_TYPE, type)[field];
  };

  return (
    <PageContainer>
      <Card>
        <div className="threadMetricsContainer">
          <div className="otherTitle">线程池指标</div>
          <Spin spinning={loading}>
            <div className="threadMetricsDescriptions">
              <Descriptions column={1}>
                {metrics.map((metric) => (
                  <Descriptions.Item
                    key={metric.type}
                    label={formatThreadType(metric.type, "label")}
                    span={3}
                  >
                    <div className="threadPoolMetricsWrapper">
                      <span className="metricsLabel">活跃线程数: </span>
                      <span className="metricsValueWrapper">
                        <span className="metricsValue">
                          {metric.activeThreadCount}
                        </span>{" "}
                        个
                      </span>
                      <span className="metricsLabel">总任务数: </span>
                      <span className="metricsValueWrapper">
                        <span className="metricsValue">
                          {metric.totalTaskCount}
                        </span>{" "}
                        个
                      </span>
                      <span className="metricsLabel">已处理任务数: </span>
                      <span className="metricsValueWrapper">
                        <span className="metricsValue">
                          {metric.completedTaskCount}
                        </span>{" "}
                        个
                      </span>
                      <span className="metricsLabel">队列任务数: </span>
                      <span className="metricsValueWrapper">
                        <span className="metricsValue">{metric.queueSize}</span>{" "}
                        个
                      </span>
                    </div>
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </div>
            <div className="threadMetricsHandlerContainer">
              <Button
                className="reloadButton"
                loading={loading}
                onClick={init}
                icon={<ReloadOutlined />}
              >
                重新加载
              </Button>
            </div>
          </Spin>
        </div>
      </Card>
    </PageContainer>
  );
};

export default connect()(ThreadMetrics);
