import { getUserInfo, queryUserMenu, logout } from "@/api/user";

export default {
  namespaced: true,
  state: () => ({
    // 当前登录用户 { userId, userName, realName }
    userData: null,
    // 用户角色菜单 { roles: [], menuTree: [] }
    menu: null,
  }),
  mutations: {
    SET_USER(state, userData) {
      state.userData = userData;
    },
    SET_MENU(state, menu) {
      state.menu = menu;
    },
  },
  actions: {
    async getUserInfo({ commit, state }) {
      if (state.userData) {
        return state.userData;
      }
      const res = await getUserInfo();
      commit("SET_USER", res.content);
      return res.content;
    },
    async queryMenu({ commit, state }) {
      if (state.menu) {
        return state.menu;
      }
      const res = await queryUserMenu();
      commit("SET_MENU", res.content);
      return res.content;
    },
    async logout({ commit }) {
      const res = await logout();
      if (res.success) {
        commit("SET_USER", null);
        commit("SET_MENU", null);
      }
      return res;
    },
  },
};
