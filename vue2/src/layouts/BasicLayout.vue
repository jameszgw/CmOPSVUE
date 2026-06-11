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
            @select="handleMenuSelect"
          >
            <template v-for="item in menuTree">
              <el-submenu
                v-if="item.children && item.children.length"
                :key="item.menuId"
                :index="item.path || item.menuId"
              >
                <template slot="title">
                  <i :class="iconOf(item.icon)" />
                  <span>{{ item.name }}</span>
                </template>
                <el-menu-item
                  v-for="child in item.children"
                  :key="child.menuId"
                  :index="child.path"
                >
                  <i :class="iconOf(child.icon)" />
                  <span>{{ child.name }}</span>
                </el-menu-item>
              </el-submenu>
              <el-menu-item v-else :key="item.menuId" :index="item.path">
                <i :class="iconOf(item.icon)" />
                <span>{{ item.name }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleUserCommand">
            <span class="user-info">
              <el-avatar
                size="small"
                src="https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg"
              />
              <span class="user-name">{{ userData && userData.userName }}</span>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="logout">
                <i class="el-icon-switch-button" /> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
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

<script>
import { mapState } from "vuex";

// 后端菜单 icon 为 antd 图标名，这里映射到 Element UI 图标
const ICON_MAP = {
  smile: "el-icon-sunny",
  crown: "el-icon-trophy",
  tablet: "el-icon-mobile",
  api: "el-icon-connection",
  chrome: "el-icon-position",
  setting: "el-icon-setting",
  desktop: "el-icon-monitor",
  cloud: "el-icon-cloudy",
  appstore: "el-icon-menu",
};

export default {
  name: "BasicLayout",
  data() {
    return {
      loading: true,
      menuLoaded: false,
    };
  },
  computed: {
    ...mapState("user", ["userData", "menu"]),
    menuTree() {
      return (this.menu && this.menu.menuTree) || [];
    },
    activePath() {
      return this.$route.path;
    },
  },
  async created() {
    try {
      await Promise.all([
        this.$store.dispatch("user/getUserInfo"),
        this.$store.dispatch("user/queryMenu"),
      ]);
      this.menuLoaded = true;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    iconOf(icon) {
      if (!icon || icon.startsWith("http")) {
        return "el-icon-menu";
      }
      return ICON_MAP[icon.toLowerCase()] || "el-icon-menu";
    },
    handleMenuSelect(index) {
      if (index && index.startsWith("/") && index !== this.$route.path) {
        this.$router.push(index);
      }
    },
    async handleUserCommand(command) {
      if (command === "logout") {
        const res = await this.$store.dispatch("user/logout");
        if (res.success) {
          this.$router.push("/");
        }
      }
    },
  },
};
</script>

<style lang="less" scoped>
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
  border-bottom: 1px solid #ebeef5;
  background: #fff;

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
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;

      .user-name {
        margin-left: 8px;
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
  background: #fff;
  border-top: 1px solid #ebeef5;
}
</style>
