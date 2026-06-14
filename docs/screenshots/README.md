# 端到端联调截图（e2e screenshots）

由 Playwright(Chromium) 对 vue3 前端 + codeman-monitor 后端（H2 内存库、模拟指标）真实联调后自动截取。
视口 1440×900。皮肤经 `localStorage['cm-skin']` 预置。

## 浅色（light）
| 页面 | 文件 |
| --- | --- |
| 监控大盘 | `light-dashboard.png` |
| 拓扑与根因 | `light-topology.png` |
| 拓扑维护（可编辑，含 保存整图/导出/导入JSON） | `light-topology-edit.png` |
| Server 监控 | `light-server.png` |
| 智能分析(AIOps) | `light-aiops.png` |
| 韧性与安全 | `light-resilience.png` |
| 主机列表 | `light-host-list.png` |
| 告警中心 | `light-alert.png` |

## 深色（dark，皮肤切换 + ECharts 暗色主题）
| 页面 | 文件 |
| --- | --- |
| 监控大盘（仪表盘/环形/折线均暗色适配） | `dark-dashboard.png` |
| 拓扑维护 | `dark-topology-edit.png` |
| Server 监控（左侧设备列表面板已深色一致） | `dark-server.png` |
| Redis 监控 | `dark-redis.png` |
| 容器(K8s)监控 | `dark-k8s.png` |
| 主机列表（左侧机组树 + 表格已深色一致） | `dark-host-list.png` |

> 深色一致性：共享布局 `MonitorLayout`（各设备监控页左侧列表/头部）、`InfoTable`、`LeftHostList`
> 等嵌套面板已全部迁移至 `var(--cm-*)`，深色下不再出现浅底残留。
