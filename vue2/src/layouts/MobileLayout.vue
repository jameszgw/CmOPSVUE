<template>
  <div class="m-shell">
    <!-- 顶部应用栏 -->
    <header class="m-appbar">
      <button v-if="showBack" class="m-appbar__back" type="button" aria-label="返回" @click="goBack">
        <i class="el-icon-arrow-left"></i>
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
        <i class="m-tab__icon" :class="t.icon"></i>
        <span class="m-tab__label">{{ t.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script>
export default {
  name: "MobileLayout",
  data() {
    return {
      tabs: [
        { path: "/m/dashboard", label: "概览", icon: "el-icon-odometer" },
        { path: "/m/topology", label: "拓扑", icon: "el-icon-share" },
        { path: "/m/alerts", label: "告警", icon: "el-icon-bell" },
      ],
      titles: {
        "/m/dashboard": "监控·移动端",
        "/m/topology": "网络拓扑",
        "/m/alerts": "告警中心",
      },
    };
  },
  computed: {
    // tab 根页面不显示返回箭头；其它页面（如节点详情）显示
    isTabRoot() {
      const p = this.$route.path;
      return this.tabs.some((t) => t.path === p);
    },
    showBack() {
      return !this.isTabRoot;
    },
    pageTitle() {
      const p = this.$route.path;
      if (p.indexOf("/m/node/") === 0) return "节点指标";
      return this.titles[p] || "监控·移动端";
    },
  },
  methods: {
    isTabActive(path) {
      const p = this.$route.path;
      if (path === "/m/topology") {
        // 拓扑 tab 在节点详情页也保持高亮
        return p === "/m/topology" || p.indexOf("/m/node/") === 0;
      }
      return p === path;
    },
    goTab(path) {
      if (this.$route.path !== path) this.$router.push(path);
    },
    goBack() {
      if (window.history.length > 1) this.$router.back();
      else this.$router.push("/m/topology");
    },
  },
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
  width: 44px;
  height: 44px;
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
