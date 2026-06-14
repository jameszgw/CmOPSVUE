import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./styles/global.less";
import { initSkin } from "./utils/skin";

Vue.use(ElementUI, { size: "small" });
Vue.config.productionTip = false;

initSkin();

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
