<template>
  <div class="m-shell">
    <!-- 顶部应用栏 -->
    <header class="m-appbar">
      <button v-if="showBack" class="m-appbar__back" type="button" aria-label="返回" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <span class="m-appbar__title">{{ pageTitle }}</span>
    </header>

    <!-- 内容区（可滚动） -->
    <main class="m-body">
      <router-view />
    </main>

    <!-- 底部 Tab 栏 -->
    <nav class="m-tabbar">
      <button
        v-for="t in tabs"
        :key="t.path"
        type="button"
        class="m-tab"
        :class="{ 'm-tab--active': isTabActive(t.path) }"
        @click="goTab(t.path)"
      >
        <el-icon class="m-tab__icon"><component :is="t.icon" /></el-icon>
        <span class="m-tab__label">{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ArrowLeft, Odometer, Share } from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();

const tabs = [
  { path: "/m/dashboard", label: "概览", icon: Odometer },
  { path: "/m/topology", label: "拓扑", icon: Share },
];

const TITLES = {
  "/m/dashboard": "监控·移动端",
  "/m/topology": "网络拓扑",
};

// tab 根页面不显示返回箭头；其它页面（如节点详情）显示
const isTabRoot = computed(() => tabs.some((t) => t.path === route.path));
const showBack = computed(() => !isTabRoot.value);

const pageTitle = computed(() => {
  if (route.path.startsWith("/m/node/")) return "节点指标";
  return TITLES[route.path] || "监控·移动端";
});

const isTabActive = (path) => {
  if (path === "/m/topology") {
    // 拓扑 tab 在节点详情页也保持高亮
    return route.path === "/m/topology" || route.path.startsWith("/m/node/");
  }
  return route.path === path;
};

const goTab = (path) => {
  if (route.path !== path) router.push(path);
};

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push("/m/topology");
};
</script>

<style scoped>
.m-shell {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--cm-bg-page);
  color: var(--cm-text-primary);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部应用栏 */
.m-appbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  padding-top: env(safe-area-inset-top);
  background: var(--cm-bg-card);
  border-bottom: 1px solid var(--cm-border-light);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.m-appbar__back {
  width: 40px;
  height: 40px;
  margin-left: -8px;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--cm-text-primary);
  font-size: 20px;
}
.m-appbar__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--cm-text-primary);
}

/* 内容区 */
.m-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px;
  padding-bottom: calc(64px + env(safe-area-inset-bottom) + 12px);
}

/* 底部 Tab 栏 */
.m-tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  display: flex;
  background: var(--cm-bg-card);
  border-top: 1px solid var(--cm-border-light);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 20;
}
.m-tab {
  flex: 1;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--cm-text-secondary);
  padding: 6px 0;
}
.m-tab--active {
  color: var(--cm-color-primary);
}
.m-tab__icon {
  font-size: 22px;
}
.m-tab__label {
  font-size: 12px;
  line-height: 1;
}
</style>
