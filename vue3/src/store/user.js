import { defineStore } from "pinia";
import { getUserInfo, queryUserMenu, logout } from "@/api/user";

export const useUserStore = defineStore("user", {
  state: () => ({
    // 当前登录用户 { userId, userName, realName }
    userData: null,
    // 用户角色菜单 { roles: [], menuTree: [] }
    menu: null,
  }),
  actions: {
    async getUserInfo() {
      if (this.userData) {
        return this.userData;
      }
      const res = await getUserInfo();
      this.userData = res.content;
      return res.content;
    },
    async queryMenu() {
      if (this.menu) {
        return this.menu;
      }
      const res = await queryUserMenu();
      this.menu = res.content;
      return res.content;
    },
    async logout() {
      const res = await logout();
      if (res.success) {
        this.userData = null;
        this.menu = null;
      }
      return res;
    },
  },
});
