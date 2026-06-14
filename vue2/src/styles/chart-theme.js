// =============================================================
// ECharts 主题 —— 与设计 token 保持一致的调色板。
// CHART_PALETTE 顺序需与 variables.less 的 @chart-palette 一致。
// 提供浅色 "cm" 与深色 "cm-dark" 两套主题，随皮肤（data-theme）切换。
// =============================================================

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

// 浅色 token
const LIGHT_TEXT_PRIMARY = "#303133";
const LIGHT_TEXT_SECONDARY = "#909399";
const LIGHT_TEXT_REGULAR = "#606266";
const LIGHT_AXIS = "#dcdfe6";
const LIGHT_SPLIT = "#ebeef5";

// 深色 token
const DARK_TEXT_PRIMARY = "#c0c4cc";
const DARK_TEXT_SECONDARY = "#8a8f99";
const DARK_AXIS = "#2c2f36";
const DARK_SPLIT = "#2c2f36";

let registered = false;

// 注册 "cm"（浅色）与 "cm-dark"（深色）两套 echarts 主题。多次调用安全（幂等）。
// 用法：applyChartTheme(echarts); echarts.init(el, currentChartTheme());
export function applyChartTheme(echarts) {
  if (!echarts || typeof echarts.registerTheme !== "function" || registered) {
    return;
  }
  echarts.registerTheme("cm", {
    color: CHART_PALETTE,
    textStyle: { color: LIGHT_TEXT_PRIMARY },
    title: {
      textStyle: { color: LIGHT_TEXT_PRIMARY },
      subtextStyle: { color: LIGHT_TEXT_SECONDARY },
    },
    legend: {
      textStyle: { color: LIGHT_TEXT_REGULAR },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: LIGHT_AXIS } },
      axisTick: { lineStyle: { color: LIGHT_AXIS } },
      axisLabel: { color: LIGHT_TEXT_SECONDARY },
      splitLine: { lineStyle: { color: LIGHT_SPLIT } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: LIGHT_AXIS } },
      axisTick: { lineStyle: { color: LIGHT_AXIS } },
      axisLabel: { color: LIGHT_TEXT_SECONDARY },
      splitLine: { lineStyle: { color: LIGHT_SPLIT } },
    },
  });
  echarts.registerTheme("cm-dark", {
    color: CHART_PALETTE,
    textStyle: { color: DARK_TEXT_PRIMARY },
    title: {
      textStyle: { color: DARK_TEXT_PRIMARY },
      subtextStyle: { color: DARK_TEXT_SECONDARY },
    },
    legend: {
      textStyle: { color: DARK_TEXT_SECONDARY },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: DARK_AXIS } },
      axisTick: { lineStyle: { color: DARK_AXIS } },
      axisLabel: { color: DARK_TEXT_SECONDARY },
      splitLine: { lineStyle: { color: DARK_SPLIT } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: DARK_AXIS } },
      axisTick: { lineStyle: { color: DARK_AXIS } },
      axisLabel: { color: DARK_TEXT_SECONDARY },
      splitLine: { lineStyle: { color: DARK_SPLIT } },
    },
  });
  registered = true;
}

// 返回当前皮肤对应的 echarts 主题名。
// 深色（<html data-theme="dark">）→ "cm-dark"，否则 → "cm"。
export function currentChartTheme() {
  try {
    if (
      document.documentElement.getAttribute("data-theme") === "dark"
    ) {
      return "cm-dark";
    }
  } catch (e) {
    // ignore
  }
  return "cm";
}

// 订阅皮肤切换事件（由 utils/skin.js 的 setSkin 派发）。
// 返回取消订阅函数。
export function onSkinChange(handler) {
  if (typeof handler !== "function" || typeof window === "undefined") {
    return function () {};
  }
  window.addEventListener("cm-skin-change", handler);
  return function () {
    window.removeEventListener("cm-skin-change", handler);
  };
}
