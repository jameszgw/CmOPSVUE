// =============================================================
// ECharts 主题 —— 与设计 token 保持一致的调色板。
// CHART_PALETTE 顺序需与 variables.less 的 @chart-palette 一致。
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

let registered = false;

// 注册名为 "cm" 的 echarts 主题。多次调用安全（幂等）。
// 用法：applyChartTheme(echarts); echarts.init(el, "cm");
export function applyChartTheme(echarts) {
  if (!echarts || registered) return;
  echarts.registerTheme("cm", {
    color: CHART_PALETTE,
    textStyle: {},
    title: {
      textStyle: { color: "#303133" },
      subtextStyle: { color: "#909399" },
    },
    legend: {
      textStyle: { color: "#606266" },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: "#dcdfe6" } },
      axisTick: { lineStyle: { color: "#dcdfe6" } },
      axisLabel: { color: "#909399" },
      splitLine: { lineStyle: { color: "#ebeef5" } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: "#dcdfe6" } },
      axisTick: { lineStyle: { color: "#dcdfe6" } },
      axisLabel: { color: "#909399" },
      splitLine: { lineStyle: { color: "#ebeef5" } },
    },
  });
  registered = true;
}
