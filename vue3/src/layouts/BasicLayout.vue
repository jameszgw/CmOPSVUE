<template>
  <div v-loading="loading" class="basic-layout">
    <el-container class="layout-container">
      <el-header class="layout-header" height="56px">
        <div class="header-left">
          <span class="logo">Cake</span>
          <el-menu
            v-if="menuTree.length"
            :default-active="activePath"
            mode="horizontal"
            class="top-menu"
            :ellipsis="false"
            @select="handleMenuSelect"
          >
            <template v-for="item in menuTree" :key="item.menuId">
              <el-sub-menu
                v-if="item.children && item.children.length"
                :index="item.path || item.menuId"
              >
                <template #title>
                  <el-icon><component :is="iconOf(item.icon)" /></el-icon>
                  <span>{{ item.name }}</span>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.menuId"
                  :index="child.path"
                >
                  <el-icon><component :is="iconOf(child.icon)" /></el-icon>
                  <span>{{ child.name }}</span>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="item.path">
                <el-icon><component :is="iconOf(item.icon)" /></el-icon>
                <span>{{ item.name }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
        <div class="header-right">
          <GlobalDeviceSearch class="header-search" />
          <el-button
            class="skin-toggle"
            circle
            text
            :title="isDark ? '切换浅色' : '切换深色'"
            @click="toggleSkin"
          >
            <el-icon><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
          </el-button>
          <el-dropdown @command="handleUserCommand">
            <span class="user-info">
              <el-avatar
                :size="28"
                src="https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg"
              />
              <span class="user-name">{{ userStore.userData?.userName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view v-if="menuLoaded" />
      </el-main>
      <el-footer class="layout-footer" height="48px">
        <div>© 2024 Made with 钟望 by Cake</div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/store/user";
import { getSkin, setSkin } from "@/utils/skin";
import GlobalDeviceSearch from "@/components/GlobalDeviceSearch.vue";

// 后端菜单 icon 为 antd 图标名，这里映射到 Element Plus 图标组件名
const ICON_MAP = {
  smile: "Sunny",
  crown: "Trophy",
  tablet: "Cellphone",
  api: "Connection",
  chrome: "Position",
  setting: "Setting",
  desktop: "Monitor",
  cloud: "Cloudy",
  appstore: "Menu",
};

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const menuLoaded = ref(false);

const isDark = ref(getSkin() === "dark");
const toggleSkin = () => {
  const next = isDark.value ? "light" : "dark";
  setSkin(next);
  isDark.value = next === "dark";
};

const menuTree = computed(() => userStore.menu?.menuTree || []);
const activePath = computed(() => route.path);

const iconOf = (icon) => {
  if (!icon || icon.startsWith("http")) {
    return "Menu";
  }
  return ICON_MAP[icon.toLowerCase()] || "Menu";
};

const handleMenuSelect = (index) => {
  if (index && index.startsWith("/") && index !== route.path) {
    router.push(index);
  }
};

const handleUserCommand = async (command) => {
  if (command === "logout") {
    const res = await userStore.logout();
    if (res.success) {
      router.push("/");
    }
  }
};

onMounted(async () => {
  try {
    await Promise.all([userStore.getUserInfo(), userStore.queryMenu()]);
    menuLoaded.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.basic-layout {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--cm-border-light);
  background: var(--cm-bg-card);

  .header-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;

    .logo {
      font-size: 18px;
      font-weight: 600;
      margin-right: 24px;
      color: #1677ff;
    }

    .top-menu {
      border-bottom: none;
      flex: 1;
      min-width: 0;
    }
  }

  .header-right {
    display: flex;
    align-items: center;

    .header-search {
      margin-right: @space-md;
    }

    .skin-toggle {
      margin-right: @space-md;
      color: var(--cm-text-regular);
    }

    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .user-name {
        margin-left: @space-sm;
      }
    }
  }
}

.layout-main {
  background: #f5f5f5;
  overflow: auto;
}

.layout-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  background: var(--cm-bg-card);
  border-top: 1px solid var(--cm-border-light);
}
</style>
