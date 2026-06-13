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

`vue2/` 与 `vue3/` 均新增"系统监控"分组,包含三类设备监控页面(全部使用 Element UI / Element Plus):

| 页面 | 路由 | 标签页 |
| --- | --- | --- |
| Server监控 | `/devops/monitor/server` | 系统信息 / CPU信息 / 内存信息 / 磁盘信息 / 网络信息 / 进程信息 |
| Redis监控 | `/devops/monitor/redis` | 概览信息 / 内存信息 / 客户端 / 键空间 / 统计信息 / 慢日志 |
| 数据库监控 | `/devops/monitor/database` | 概览信息 / 连接信息 / 性能统计 / 表统计 |

- 每个页面左侧为指标分类导航(含搜索与"+新增设备"),右上角可**随时切换设备**并查看连接状态、开关自动刷新。
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
