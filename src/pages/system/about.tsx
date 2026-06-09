import React, { useEffect, useState } from "react";
import { Card, Descriptions, Typography } from "antd";
import { PageContainer } from "@ant-design/pro-layout";
import { connect, Dispatch } from "umi";
import styles from "./about.less";
import { SystemAbout } from "@/models/system";

interface AboutProps {
  dispatch: Dispatch;
}

const About: React.FC<AboutProps> = ({ dispatch }) => {
  const [about, setAbout] = useState<SystemAbout>();

  useEffect(() => {
    dispatch({
      type: "system/getSystemAbout",
      callback: (data: SystemAbout) => {
        setAbout(data);
      },
    });
  }, []);

  return (
    <PageContainer>
      <Card>
        <div className="aboutContainer">
          <div className="otherTitle">关于</div>
          <div className="aboutDescriptions}">
            {about && (
              <Descriptions column={1}>
                <Descriptions.Item label="cake-devops-base 版本" span={3}>
                  <a
                    className="aboutValue"
                    href={`https://github.com/zhongshengwang/cake-devops-ops-base/releases/tag/v${about.version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {about.version}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="cake-tools 版本" span={3}>
                  <a
                    className={styles.aboutValue}
                    href={`https://github.com/zhongshengwang/cake-toolkit/releases/tag/v${about.kitVersion}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {about.kitVersion}
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="cake-devops-base 作者" span={3}>
                  <span className={styles.aboutValue}>
                    {about.author} ({about.authorCn})
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="github 地址" span={3}>
                  <a
                    className={styles.aboutValue}
                    href="https://github.com/zhongshengwang/cake-devops-base"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://github.com/zhongshengwang/cake-devops-base
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="问题反馈" span={3}>
                  <a
                    className={styles.aboutValue}
                    href="https://github.com/zhongshengwang/cake-devops-base/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://github.com/zhongshengwang/cake-devops-base/issues
                  </a>
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default connect()(About);
