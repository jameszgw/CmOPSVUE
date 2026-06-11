# React → Vue 迁移规范 (vue2 / vue3 双版本)

本仓库根目录 `src/` 为原 React (Umi 4 + Ant Design) 版本，`vue2/` 与 `vue3/`
为迁移后的两套独立工程：

| 目录    | 技术栈                                                  |
| ------- | ------------------------------------------------------- |
| `vue2/` | Vue 2.7 + Vue Router 3 + Vuex 3 + **Element UI** + Vite  |
| `vue3/` | Vue 3 + Vue Router 4 + Pinia + **Element Plus** + Vite   |

## 目录映射

| 原 React 目录                    | Vue 工程目录                          |
| -------------------------------- | ------------------------------------- |
| `src/pages/<module>/x.tsx`       | `src/views/<module>/PascalCase.vue`   |
| `src/pages/<module>/components/` | `src/views/<module>/components/`      |
| `src/services/<name>.ts`         | `src/api/<name>.js`                   |
| `src/models/*.ts` (dva)          | 不迁移，页面直接调用 `@/api/*`        |
| `src/utils/*`                    | `src/utils/*.js`                      |

页面文件名必须与 `src/router/index.js` 中注册的组件路径完全一致。

## 数据流转换

原代码通过 dva `dispatch({ type: "model/effect", payload, callback })` 调用接口。
迁移时阅读对应 `src/models/<name>.ts`，找到 effect 实际调用的 service 函数，
页面**直接调用** `@/api/<name>.js` 中的同名函数（async/await），不再经过 store。

唯一保留的全局状态是用户信息与菜单：vue2 用 Vuex (`store/modules/user.js`)，
vue3 用 Pinia (`store/user.js`)。

接口响应体约定：`{ success, code, msg, content }`；分页数据
`content = { pageNo, pageSize, totalPage, total, items }`。
请求失败的统一报错已在 `@/utils/request.js` 拦截器处理。

## 组件映射 (antd → Element)

| antd                       | Element UI (vue2)          | Element Plus (vue3)             |
| -------------------------- | -------------------------- | ------------------------------- |
| `Table`                    | `el-table` + `el-table-column` | 同左                        |
| `Table pagination`         | `el-pagination`            | 同左                            |
| `Form` / `Form.Item`       | `el-form` / `el-form-item` | 同左                            |
| `Input/Select/Switch/...`  | `el-input/el-select/...`   | 同左                            |
| `Drawer`                   | `el-drawer`                | 同左                            |
| `Modal`                    | `el-dialog`                | 同左                            |
| `Modal.confirm`            | `this.$confirm`            | `ElMessageBox.confirm`          |
| `message.xxx`              | `this.$message.xxx`        | `ElMessage.xxx`                 |
| `Tag / Card / Tabs / Tree` | `el-tag / el-card / el-tabs / el-tree` | 同左                |
| `Descriptions`             | `el-descriptions`          | 同左                            |
| `PageContainer` (pro)      | `<div class="page-container">` | 同左                        |
| `@ant-design/icons`        | `el-icon-*` class          | `@element-plus/icons-vue` 组件  |

## 代码风格

- vue2：Options API，`this.$router / this.$route / this.$message / this.$confirm`
- vue3：`<script setup>` Composition API，`useRouter() / useRoute()`，
  `ElMessage / ElMessageBox`（图标组件已全局注册）
- 样式：原 `.less` 文件内容并入对应 SFC 的 `<style lang="less" scoped>`
- xterm / echarts / WebSocket 逻辑按原样移植，注意在 `beforeDestroy`
  (vue2) / `onBeforeUnmount` (vue3) 中销毁实例
- 路由跳转路径保持与原版完全一致（`/devops/...`）
