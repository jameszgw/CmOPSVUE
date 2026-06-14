// 图表皮肤联动组合式函数。
// 在皮肤切换（"cm-skin-change" 事件）时，调用传入的 rerender 回调，
// 让页面用 currentChartTheme() 以新主题重新创建并渲染图表。
//
// 用法（在 <script setup> 中）：
//   import * as echarts from "echarts";
//   import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
//   import { useChartSkin } from "@/composables/useChartSkin";
//   applyChartTheme(echarts);            // 注册主题（幂等）
//   const renderChart = () => { ... chart = echarts.init(el, currentChartTheme()); ... };
//   useChartSkin(renderChart);           // 自动在皮肤切换时重渲染、卸载时清理
import { onMounted, onBeforeUnmount } from "vue";
import { onSkinChange } from "@/styles/chart-theme";

export function useChartSkin(rerender) {
  let unsubscribe = null;

  onMounted(() => {
    unsubscribe = onSkinChange(() => {
      try {
        if (typeof rerender === "function") rerender();
      } catch (e) {
        /* ignore */
      }
    });
  });

  onBeforeUnmount(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });
}
