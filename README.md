# CmOPSVUE — 监控前端

监控平台前端,包含三套实现:

| 目录    | 技术栈                                                 | 启动方式                  |
| ------- | ------------------------------------------------------ | ------------------------- |
| `src/`  | React 18 + Umi 4 + Ant Design(原版)                  | `nvm use 16.20.2 && npm install -g umi && npm run dev` |
| `vue2/` | Vue 2.7 + Vue Router 3 + Vuex + **Element UI** + Vite  | `cd vue2 && npm install && npm run dev`(端口 8001)   |
| `vue3/` | Vue 3 + Vue Router 4 + Pinia + **Element Plus** + Vite | `cd vue3 && npm install && npm run dev`(端口 8002)   |

后端(CmOPS,监控后端)默认代理到 `http://localhost:8080`,
可通过环境变量 `VITE_PROXY_TARGET` 修改。

文档:

- [项目代码分析报告](docs/project-analysis.md)
- [React → Vue 迁移规范](docs/migration-conventions.md)
