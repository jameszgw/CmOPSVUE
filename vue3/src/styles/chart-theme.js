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

// 注册一个名为 "cm" 的 echarts 主题，使所有图表共享同一调色板与文本/轴色。
// 用法：import * as echarts from "echarts"; applyChartTheme(echarts);
//      echarts.init(el, "cm");
export function applyChartTheme(echarts) {
  if (!echarts || typeof echarts.registerTheme !== "function") {
    return;
  }
  echarts.registerTheme("cm", {
    color: CHART_PALETTE,
    textStyle: { color: TEXT_PRIMARY },
    title: {
      textStyle: { color: TEXT_PRIMARY },
      subtextStyle: { color: TEXT_SECONDARY },
    },
    legend: { textStyle: { color: TEXT_SECONDARY } },
    categoryAxis: {
      axisLine: { lineStyle: { color: BORDER_LIGHT } },
      axisTick: { lineStyle: { color: BORDER_LIGHT } },
      axisLabel: { color: TEXT_SECONDARY },
      splitLine: { lineStyle: { color: BORDER_LIGHT } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: BORDER_LIGHT } },
      axisTick: { lineStyle: { color: BORDER_LIGHT } },
      axisLabel: { color: TEXT_SECONDARY },
      splitLine: { lineStyle: { color: BORDER_LIGHT } },
    },
  });
}
