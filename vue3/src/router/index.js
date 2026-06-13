import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/store/user";
import { checkPermission } from "@/utils/permission";

const BasicLayout = () => import("@/layouts/BasicLayout.vue");

const routes = [
  {
    path: "/",
    component: BasicLayout,
    redirect: "/devops/monitor/dashboard",
    children: [
      // ===== 系统监控 =====
      { path: "/devops/monitor/dashboard", component: () => import("@/views/monitor/MonitorDashboard.vue") },
      { path: "/devops/monitor/topology", component: () => import("@/views/monitor/MonitorTopology.vue") },
      { path: "/devops/monitor/server", component: () => import("@/views/monitor/MonitorServer.vue") },
      { path: "/devops/monitor/redis", component: () => import("@/views/monitor/MonitorRedis.vue") },
      { path: "/devops/monitor/database", component: () => import("@/views/monitor/MonitorDatabase.vue") },
      { path: "/devops/monitor/k8s", component: () => import("@/views/monitor/MonitorK8s.vue") },
      { path: "/devops/monitor/mq", component: () => import("@/views/monitor/MonitorMq.vue") },
      { path: "/devops/monitor/lb", component: () => import("@/views/monitor/MonitorLb.vue") },
      { path: "/devops/monitor/storage", component: () => import("@/views/monitor/MonitorStorage.vue") },
      { path: "/devops/monitor/netdev", component: () => import("@/views/monitor/MonitorNetDev.vue") },
      { path: "/devops/monitor/gpu", component: () => import("@/views/monitor/MonitorGpu.vue") },
      { path: "/devops/monitor/aiops", component: () => import("@/views/monitor/MonitorAiops.vue") },
      { path: "/devops/monitor/resilience", component: () => import("@/views/monitor/MonitorResilience.vue") },
      { path: "/devops/monitor/alert", component: () => import("@/views/monitor/AlertCenter.vue") },
      // ===== 运维监控 =====
      { path: "/devops/ops/host-list", component: () => import("@/views/ops/HostList.vue") },
      { path: "/devops/ops/host-detail/:id", component: () => import("@/views/ops/HostDetail.vue") },
      { path: "/devops/ops/host/alarm/history/:hostId", component: () => import("@/views/ops/HostAlarmHistory.vue") },
      { path: "/devops/ops/sftp-manage/:hostId", component: () => import("@/views/ops/SftpManage.vue") },
      { path: "/devops/ops/cluster-list", component: () => import("@/views/ops/ClusterList.vue") },
      { path: "/devops/ops/server-key", component: () => import("@/views/ops/ServerKey.vue") },
      { path: "/devops/ops/server-env", component: () => import("@/views/ops/ServerEnv.vue") },
      { path: "/devops/ops/server-proxy", component: () => import("@/views/ops/ServerProxy.vue") },
      { path: "/devops/ops/server-monitor", component: () => import("@/views/ops/ServerMonitor.vue") },
      { path: "/devops/ops/terminal-page", component: () => import("@/views/ops/TerminalPage.vue") },
      // ===== CI 应用发布 =====
      { path: "/devops/ci/app-list", component: () => import("@/views/ci/AppList.vue") },
      { path: "/devops/ci/app/info/:id", component: () => import("@/views/ci/AppDetail.vue") },
      { path: "/devops/ci/app/deploy/:id", component: () => import("@/views/ci/Deploy.vue") },
      // ===== 系统管理 =====
      { path: "/devops/system/alarm-group", component: () => import("@/views/system/AlarmGroup.vue") },
      { path: "/devops/system/webhook-config", component: () => import("@/views/system/WebhookConfig.vue") },
      { path: "/devops/system/script-template", component: () => import("@/views/system/ScriptTemplate.vue") },
      { path: "/devops/system/security-config", component: () => import("@/views/system/SecurityConfig.vue") },
      { path: "/devops/system/ip-config", component: () => import("@/views/system/IpConfig.vue") },
      { path: "/devops/system/system-log", component: () => import("@/views/system/SystemLog.vue") },
      { path: "/devops/system/system-analysis", component: () => import("@/views/system/SystemAnalysis.vue") },
      { path: "/devops/system/thread-metrics", component: () => import("@/views/system/ThreadMetrics.vue") },
      { path: "/devops/system/batch-exec", component: () => import("@/views/system/BatchExec.vue") },
      { path: "/devops/system/about", component: () => import("@/views/system/About.vue") },
    ],
  },
  { path: "/403", component: () => import("@/views/system/NotAuthorized.vue") },
  { path: "/:pathMatch(.*)*", component: () => import("@/views/system/NotFound.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 权限白名单
const WHITE_LIST = ["/", "/403"];

router.beforeEach(async (to) => {
  if (WHITE_LIST.includes(to.path) || to.matched.length === 0) {
    return true;
  }
  try {
    const userStore = useUserStore();
    const menu = await userStore.queryMenu();
    if (checkPermission(to.path, menu)) {
      return true;
    }
    return "/403";
  } catch (e) {
    // 菜单加载失败时放行，由接口层提示错误
    return true;
  }
});

export default router;
