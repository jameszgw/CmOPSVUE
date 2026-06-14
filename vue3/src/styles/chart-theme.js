// 共享图表调色板（与 variables.less 的 @chart-palette 保持一致）。
export const CHART_PALETTE = [
  "#409eff",
  "#67c23a",
  "#e6a23c",
  "#f56c6c",
  "#9254de",
  "#1890ff",
  "#13c2c2",
  "#fa8c16",
];

// token 文本 / 轴线色（浅色主题）
const TEXT_PRIMARY = "#303133";
const TEXT_SECONDARY = "#909399";
const BORDER_LIGHT = "#ebeef5";

// token 文本 / 轴线色（深色主题）
const DARK_TEXT_PRIMARY = "#c0c4cc";
const DARK_TEXT_SECONDARY = "#8a8f99";
const DARK_BORDER = "#2c2f36";

const buildTheme = (textPrimary, textSecondary, border) => ({
  color: CHART_PALETTE,
  textStyle: { color: textPrimary },
  title: {
    textStyle: { color: textPrimary },
    subtextStyle: { color: textSecondary },
  },
  legend: { textStyle: { color: textSecondary } },
  categoryAxis: {
    axisLine: { lineStyle: { color: border } },
    axisTick: { lineStyle: { color: border } },
    axisLabel: { color: textSecondary },
    splitLine: { lineStyle: { color: border } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: border } },
    axisTick: { lineStyle: { color: border } },
    axisLabel: { color: textSecondary },
    splitLine: { lineStyle: { color: border } },
  },
});

// 注册名为 "cm"（浅色）与 "cm-dark"（深色）的 echarts 主题，使所有图表
// 共享同一调色板与文本/轴色。
// 用法：import * as echarts from "echarts"; applyChartTheme(echarts);
//      echarts.init(el, currentChartTheme());
export function applyChartTheme(echarts) {
  if (!echarts || typeof echarts.registerTheme !== "function") {
    return;
  }
  echarts.registerTheme("cm", buildTheme(TEXT_PRIMARY, TEXT_SECONDARY, BORDER_LIGHT));
  echarts.registerTheme(
    "cm-dark",
    buildTheme(DARK_TEXT_PRIMARY, DARK_TEXT_SECONDARY, DARK_BORDER)
  );
}

// 返回当前应使用的 echarts 主题名：深色皮肤下为 "cm-dark"，否则 "cm"。
export function currentChartTheme() {
  try {
    return document.documentElement.classList.contains("dark") ? "cm-dark" : "cm";
  } catch (e) {
    return "cm";
  }
}

// 订阅皮肤切换事件（由 utils/skin.js 在 setSkin 后派发）。
// 返回取消订阅函数。
export function onSkinChange(handler) {
  if (typeof handler !== "function" || typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("cm-skin-change", handler);
  return () => window.removeEventListener("cm-skin-change", handler);
}
