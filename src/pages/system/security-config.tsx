// src/pages/system/SecurityConfigPage.tsx
import React, { useState, useEffect } from "react";
import { Form, Input, Space, Switch, message } from "antd";
import { useDispatch, useSelector } from "umi";
import styles from "./security-config.less";
import { SystemOption } from "@/models/system";

const SecurityConfigPage: React.FC = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm<SystemOption>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSecurityConfig();
  }, []);

  const fetchSecurityConfig = () => {
    dispatch({
      type: "system/getSystemOption",
      callback: (data: SystemOption) => {
        form.setFieldsValue(data);
      },
    });
  };

  const handleUpdate = (optionKey: keyof SystemOption, value: any) => {
    setLoading(true);
    dispatch({
      type: "system/updateOption",
      payload: {
        option: optionKey,
        value,
      },
      callback: () => {
        message.success("配置更新成功");
        setLoading(false);
      },
    });
  };

  return (
    <div className={styles["security-config-container"]}>
      <h1>安全配置</h1>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Form.Item
          label="允许多端登陆"
          name="allowMultipleLogin"
          valuePropName="checked"
          help="开启后一个账号可以多个设备同时登陆, 其他设备强制登陆后不会强制下线"
        >
          <Switch
            onChange={(checked) => {
              handleUpdate("allowMultipleLogin", checked);
            }}
          />
        </Form.Item>
        <Form.Item
          label="登录失败锁定"
          name="loginFailureLock"
          valuePropName="checked"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          help="开启后同个账号多次登陆失败后将会锁定账号无法继续登陆"
        >
          <Switch
            onChange={(checked) => {
              handleUpdate("loginFailureLock", checked);
            }}
          />
        </Form.Item>

        <Form.Item
          label="登录IP绑定"
          name="loginIpBind"
          valuePropName="checked"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 18 }}
          help="开启后登陆凭证和IP进行绑定, 其他IP使用此登陆凭证则无法访问"
        >
          <Switch
            onChange={(checked) => {
              handleUpdate("loginIpBind", checked);
            }}
          />
        </Form.Item>

        <Form.Item
          label="登录凭证自动续签"
          name="loginTokenAutoRenew"
          valuePropName="checked"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          help="登录凭证自动续签，当登录凭证过期后，自动续签，避免频繁登录"
        >
          <Switch
            onChange={(checked) => {
              handleUpdate("loginTokenAutoRenew", checked);
            }}
          />
        </Form.Item>

        <Form.Item
          label="凭证有效期(时)"
          name="loginTokenExpire"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          help="设置登陆凭证有效期时长(时), 设置后下次登陆生效"
        >
          <Input
            type="number"
            onBlur={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                handleUpdate("loginTokenExpire", value);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="登录失败锁定阈值"
          name="loginFailureLockThreshold"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          help="设置登陆失败锁定阈值, 达到该值后账号会被锁定, 设置后下次登陆生效"
        >
          <Input
            type="number"
            onBlur={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                handleUpdate("loginFailureLockThreshold", value);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          label="登录自动续签阈值"
          name="loginTokenAutoRenewThreshold"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          help="登陆凭证自动续签间隔(时)"
        >
          <Input
            type="number"
            onBlur={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                handleUpdate("loginTokenAutoRenewThreshold", value);
              }
            }}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default SecurityConfigPage;
