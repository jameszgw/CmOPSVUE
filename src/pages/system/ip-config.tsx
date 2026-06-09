import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  message,
  Descriptions,
  Space,
} from "antd";
import { PageContainer } from "@ant-design/pro-layout";
import { connect, Dispatch } from "umi";
import styles from "./ip-config.less";
import { IpListConfig } from "@/models/system";

interface IpConfigProps {
  dispatch: Dispatch;
}

const IpConfig: React.FC<IpConfigProps> = ({ dispatch }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [ipConfig, setIpConfig] = useState<IpListConfig | undefined>();

  useEffect(() => {
    fetchIpConfig();
  }, []);

  useEffect(() => {
    if (ipConfig) {
      form.setFieldsValue(ipConfig);
    }
  }, [ipConfig]);

  const fetchIpConfig = () => {
    dispatch({
      type: "system/getIpListConfig",
      callback: (data: IpListConfig) => {
        setIpConfig(data);
      },
    });
  };

  const handleSubmit = (values: IpListConfig) => {
    setLoading(true);
    dispatch({
      type: "system/updateIpConfig",
      payload: values,
      callback: (success: boolean) => {
        if (success) {
          message.success("IP配置更新成功");
        } else {
          message.error("IP配置更新失败");
        }
        setLoading(false);
        fetchIpConfig();
      },
    });
  };

  const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 16 },
  };

  return (
    <PageContainer>
      <Card>
        <div className={styles.ipConfigContainer}>
          <div className={styles.otherTitle}>IP配置信息</div>

          {/* 当前IP信息 */}
          <div className={styles.ipInfoSection}>
            <Descriptions column={1}>
              <Descriptions.Item label="当前访问IP">
                <span className={styles.ipValue}>
                  {ipConfig?.currentIp || "未知"}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="IP位置">
                <span className={styles.ipValue}>
                  {ipConfig?.ipLocation || "未知"}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* IP配置表单 */}
          <div className={styles.ipConfigForm}>
            <Form
              {...layout}
              form={form}
              onFinish={handleSubmit}
              initialValues={ipConfig}
            >
              <Form.Item
                label="IP黑名单"
                name="blackIpList"
                extra="请输入IP黑名单规则，多个则使用换行 仅支持IPv4地址."
              >
                <Input.TextArea rows={4} placeholder="请输入IP黑名单" />
              </Form.Item>

              <Form.Item
                label="IP白名单"
                name="whiteIpList"
                extra="请输入IP白名单规则，多个则使用换行 仅支持IPv4地址."
              >
                <Input.TextArea rows={4} placeholder="请输入IP白名单" />
              </Form.Item>

              <Form.Item
                label="是否启用"
                name="enableIpFilter"
                valuePropName="checked"
                extra="启用后将根据配置的IP白名单和黑名单进行访问控制"
              >
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>

              <Form.Item
                label="规则类型"
                name="enableWhiteIpList"
                valuePropName="checked"
                extra="启用后只有白名单中的IP可以访问，否则只有黑名单中的IP不能访问"
              >
                <Switch checkedChildren="白名单" unCheckedChildren="黑名单" />
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保 存
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default connect()(IpConfig);
