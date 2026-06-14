// =============================================================
// 图表皮肤混入 —— 让使用 echarts 的页面在皮肤切换时自动重建图表。
// 用法：
//   import chartSkin from "@/mixins/chartSkin";
//   export default { mixins: [chartSkin], methods: { reinitChartsForSkin() { ... } } };
// 组件需实现 reinitChartsForSkin()：dispose 已有图表并以 currentChartTheme()
// 重新 init + 重新渲染。
// =============================================================
import { onSkinChange } from "@/styles/chart-theme";

export default {
  mounted() {
    // 订阅皮肤切换；保存取消订阅函数，在 beforeDestroy 调用。
    this.__skinUnsub = onSkinChange(() => {
      if (typeof this.reinitChartsForSkin === "function") {
        this.reinitChartsForSkin();
      }
    });
  },
  beforeDestroy() {
    if (typeof this.__skinUnsub === "function") {
      this.__skinUnsub();
      this.__skinUnsub = null;
    }
  },
};
