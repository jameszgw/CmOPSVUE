# CmOPSVUE — 监控前端

监控平台前端,包含三套实现:

| 目录    | 技术栈                                                 | 启动方式                  |
| ------- | ------------------------------------------------------ | ------------------------- |
| `src/`  | React 18 + Umi 4 + Ant Design(原版)                  | `nvm use 16.20.2 && npm install -g umi && npm run dev` |
| `vue2/` | Vue 2.7 + Vue Router 3 + Vuex + **Element UI** + Vite  | `cd vue2 && npm install && npm run dev`(端口 8001)   |
| `vue3/` | Vue 3 + Vue Router 4 + Pinia + **Element Plus** + Vite | `cd vue3 && npm install && npm run dev`(端口 8002)   |

后端(CmOPS,监控后端)默认代理到 `http://localhost:8080`,
可通过环境变量 `VITE_PROXY_TARGET` 修改。

## 系统监控模块

`vue2/` 与 `vue3/` 均含"系统监控"分组(全部使用 Element UI / Element Plus),覆盖设备监控、告警与智能增值:

### 总览与智能(P2)

| 页面 | 路由 | 内容 |
| --- | --- | --- |
| 监控大盘 | `/devops/monitor/dashboard` | 健康评分 / 设备分布 / 告警趋势 / 资源水位 / 问题设备 Top |
| 拓扑与根因 | `/devops/monitor/topology` | 四层依赖拓扑图 + 根因关联事件(传播链/置信度/处置建议) |
| 智能分析 | `/devops/monitor/aiops` | 异常检测(基线/偏离) + 成本优化 FinOps(闲置资源/容量预测) |
| 韧性与安全 | `/devops/monitor/resilience` | 混沌演练韧性评分(雷达) + 安全基线漂移检测 |
| 告警中心 | `/devops/monitor/alert` | 阈值规则管理 + 活跃/历史告警 + 统计 |

### 设备监控(P0 三件套 + P1 扩展设备)

| 页面 | 路由 | 标签页 |
| --- | --- | --- |
| Server监控 | `/devops/monitor/server` | 系统 / CPU / 内存(OOM·Slab) / 磁盘(await·inode) / 网络(重传·丢包·连接态) / 进程 |
| Redis监控 | `/devops/monitor/redis` | 概览 / 内存 / 客户端 / 键空间 / 统计 / 慢日志 / 持久化·复制 |
| 数据库监控 | `/devops/monitor/database` | 概览 / 连接 / 性能 / 表统计 / 引擎指标(MySQL·PG·Mongo·Oracle) |
| 容器监控 | `/devops/monitor/k8s` | 集群概览 / 节点 / 工作负载 / 控制平面 / 网络与存储 / 事件 |
| 消息中间件 | `/devops/monitor/mq` | 概览 / 主题分区 / 消费组 / Broker(Kafka·RocketMQ·RabbitMQ) |
| 负载均衡 | `/devops/monitor/lb` | 概览 / 流量 / 上游 / 连接与安全(Nginx·HAProxy·ALB) |
| 存储监控 | `/devops/monitor/storage` | 概览 / 存储池 / 性能 / 磁盘OSD(Ceph·SAN·NAS) |
| 网络设备 | `/devops/monitor/netdev` | 概览 / 端口 / 会话 / 协议(交换机·防火墙·路由器) |
| GPU监控 | `/devops/monitor/gpu` | 概览 / GPU卡 / 推理与边缘节点 |

- 每个设备监控页左侧为指标分类导航(含搜索与"+新增设备"),右上角可**随时切换设备**并查看连接状态、开关自动刷新。
- 服务器支持**物理服务器 + 多种虚拟机**(KVM / VMware / Hyper-V / Xen / VirtualBox / OpenStack / 云 ECS),
  操作系统覆盖 **Windows / Unix / Linux**,采集模式分为**含 Agent / 无 Agent**(无 Agent 时进程等明细受限并提示)。
- 数据由监控后端(CmOPS)模拟生成,刷新时呈现实时波动,无需真实被监控设备即可演示。

### 全栈联调

```bash
# 1) 启动监控后端(模拟数据,端口 8080)
cd ../CmOPS && mvn spring-boot:run
# 2) 启动任一前端
cd vue3 && npm install && npm run dev   # 或 cd vue2 && npm run dev
```

文档:

- [项目代码分析报告](docs/project-analysis.md)
- [React → Vue 迁移规范](docs/migration-conventions.md)
- [监控模块实现规范](docs/monitor-module-spec.md)
