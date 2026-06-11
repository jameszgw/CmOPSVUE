# 监控项目代码分析报告

> 命名约定：**CmOPS = 监控后端**，**CmOPSVUE = 监控前端**

## 一、CmOPS(监控后端)

当前仓库仅包含 `LICENSE` 与一行 `README.md`(`# CmOPS`)，**尚无任何后端代码**。
提交历史只有 "Initial commit" 与 "upgrade 1.0" 两次提交。

从前端代码反推，后端需要提供的能力包括:

- 统一响应体 `{ success, code, msg, content }`，分页结构
  `{ pageNo, pageSize, totalPage, total, items }`
- REST 接口前缀 `/api/devops/*`，按域划分:
  `user`(用户/菜单/权限)、`host`(主机)、`cluster`(集群)、
  `host-monitor`(主机监控)、`host-alarm`(告警配置/历史)、
  `alarm-group`(告警组)、`proxy`(代理)、`server-key`(密钥)、
  `host-env`(环境变量)、`app`(应用)、`release`(发布单)、
  `script-template`(脚本模板)、`batch-exec`(批量执行)、
  `webhook`、`system`(系统分析/线程指标/日志)、
  `web-side-message`(站内信)
- WebSocket 长连接(`/api/keep-alive/*`):
  机器终端、终端监控(watcher)、日志 tail、SFTP 通知
- SSO 登录登出(`/sso/logout`)，菜单树按用户角色动态下发

## 二、CmOPSVUE(监控前端)— 原 React 版本(根目录 `src/`)

### 技术栈

| 项 | 说明 |
| --- | --- |
| 框架 | React 18 + Umi 4(约定式路由) |
| UI | Ant Design 4 + Ant Design Pro Components/Layout |
| 状态管理 | dva(model + effect + dispatch/callback 回调风格) |
| 请求 | umi-request,统一错误处理(`success=false` 时 message 报错) |
| 终端 | xterm 5 + fit/search/web-links 插件,WebSocket 对接 |
| 图表 | ECharts 5(echarts-for-react) |
| 构建 | umi build,区分 test / pre / prod 三套环境 |

### 代码规模

约 125 个源文件、2.1 万行 TS/TSX,分三大业务模块:

| 模块 | 路由前缀 | 页面 | 主要功能 |
| --- | --- | --- | --- |
| ops 运维监控 | `/devops/ops/*` | 10 页 + 14 组件 | 主机管理(分组树/CRUD/Ping)、Web 终端(xterm)、SFTP 文件管理(1125 行,最大页面)、集群、密钥、代理、环境变量、服务器监控(ECharts + Top 进程表)、告警配置/历史 |
| ci 应用发布 | `/devops/ci/*` | 3 页 + 13 组件 | 应用列表/详情、团队成员、环境资源面板(Service/Ingress/ConfigMap/环境变量/域名)、发布单、部署流水线(892 行)、部署日志 |
| system 系统管理 | `/devops/system/*` | 12 页 + 3 组件 | 告警组、Webhook、脚本模板、批量执行、安全配置、IP 配置、系统日志、系统分析(ECharts)、线程指标、关于、403/404 |

### 架构特点

1. **动态菜单 + 权限**:菜单树由后端 `/api/devops/user/menu` 下发,
   `wrappers/auth` 对路由做权限校验,无权限跳 `/403`;布局为 ProLayout
   顶部导航 + 用户水印 + 站内信(`layouts/index-box.tsx`)。
2. **dva 数据流**:页面 `dispatch({ type, payload, callback })` →
   model effect → service → umi-request;model 层基本是纯透传,
   几乎无复杂 reducer 状态。
3. **实时能力**:终端/日志/SFTP 通过 4 类 WebSocket 通道实现。
4. **mock**:`mock/` 仅覆盖少量接口(用户、系统、应用分页)。

## 三、Vue 双版本升级方案(`vue2/` 与 `vue3/`)

| 项 | `vue2/` | `vue3/` |
| --- | --- | --- |
| 框架 | Vue 2.7 (Options API) | Vue 3 (`<script setup>`) |
| 路由 | Vue Router 3 | Vue Router 4 |
| 状态 | Vuex 3(仅 user 模块) | Pinia(仅 user store) |
| UI | **Element UI 2.15** | **Element Plus**(Element UI 官方 Vue3 版) |
| 请求 | axios(行为对齐原 umi-request 封装) | 同左 |
| 构建 | Vite 5 + @vitejs/plugin-vue2 | Vite 5 + @vitejs/plugin-vue |

> 说明:Element UI 官方只支持 Vue 2;Vue 3 下的官方延续版本为
> Element Plus,组件 API 与 Element UI 一脉相承,故 vue3 工程使用
> Element Plus。

dva model 层在迁移中被移除,页面直接调用 `@/api/*`(与原 services
一一对应);动态菜单、权限守卫、`/devops/*` 路由路径、响应体约定全部
保持与原版一致。详细转换规则见 `docs/migration-conventions.md`。
