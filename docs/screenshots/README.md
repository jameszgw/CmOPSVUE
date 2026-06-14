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
| Server 监控 | `dark-server.png` |
| 主机列表 | `dark-host-list.png` |

> 已知小项：个别监控页的嵌套左侧列表面板在深色下仍为浅底，属逐页深色适配的少量残留，后续可继续打磨。
