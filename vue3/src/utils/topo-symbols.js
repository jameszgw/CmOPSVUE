// 拓扑图节点图标：按设备类型生成带状态色的 SVG 图标（ECharts symbol: image://）。
// 颜色编码进图标本身（状态色 healthy/warning/critical），底色为白圆便于在连线上识别。

// 每种设备类型的 SVG 内部图形（24x24 viewBox）。filled 形状用 fill，线条用 stroke。
const GLYPH = {
  SERVER:
    "<rect x='5' y='4' width='14' height='6' rx='1'/><rect x='5' y='14' width='14' height='6' rx='1'/><circle cx='8' cy='7' r='1' fill='#fff'/><circle cx='8' cy='17' r='1' fill='#fff'/>",
  REDIS:
    "<path d='M12 4l8 3-8 3-8-3 8-3z'/><path d='M4 10l8 3 8-3v3l-8 3-8-3v-3z' opacity='0.75'/><path d='M4 15l8 3 8-3v2l-8 3-8-3v-2z' opacity='0.55'/>",
  DATABASE:
    "<ellipse cx='12' cy='6' rx='7' ry='3'/><path d='M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6c0 1.7-3.1 3-7 3S5 7.7 5 6z' opacity='0.6'/>",
  K8S:
    "<path d='M12 3l8 4v8l-8 4-8-4V7l8-4z'/><circle cx='12' cy='11' r='3' fill='#fff'/>",
  MQ:
    "<rect x='4' y='6' width='16' height='12' rx='1.5'/><path d='M4.5 7l7.5 6 7.5-6' fill='none' stroke='#fff' stroke-width='1.5'/>",
  LB:
    "<path d='M12 3l4 4-4 4-4-4 4-4z'/><circle cx='5' cy='18' r='2.5'/><circle cx='12' cy='18' r='2.5'/><circle cx='19' cy='18' r='2.5'/><path d='M12 11v3M12 14H6v2M12 14h6v2' fill='none' stroke-width='1.3'/>",
  STORAGE:
    "<ellipse cx='12' cy='7' rx='7' ry='2.5'/><ellipse cx='12' cy='12' rx='7' ry='2.5' opacity='0.7'/><ellipse cx='12' cy='17' rx='7' ry='2.5' opacity='0.5'/>",
  NETDEV:
    "<rect x='3' y='11' width='18' height='7' rx='1.5'/><circle cx='7' cy='14.5' r='1' fill='#fff'/><circle cx='11' cy='14.5' r='1' fill='#fff'/><path d='M12 11V7M12 7l-3 2M12 7l3 2' fill='none' stroke-width='1.3'/>",
  GPU:
    "<rect x='6' y='6' width='12' height='12' rx='1.5'/><rect x='9' y='9' width='6' height='6' rx='1' fill='#fff'/><path d='M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3' stroke-width='1.3'/>",
  POWER:
    "<path d='M13 2L5 13h5l-1 9 8-12h-5l1-8z'/>",
  ESS:
    "<rect x='4' y='7' width='15' height='10' rx='1.5'/><rect x='19' y='10' width='2' height='4' rx='0.5'/><rect x='6.5' y='9.5' width='2' height='5' fill='#fff'/><rect x='10' y='9.5' width='2' height='5' fill='#fff'/><rect x='13.5' y='9.5' width='2' height='5' fill='#fff'/>",
  IOT:
    "<path d='M5 9a10 10 0 0 1 14 0M8 12a6 6 0 0 1 8 0M10.5 15a2.5 2.5 0 0 1 3 0' fill='none' stroke-width='1.6'/><circle cx='12' cy='17.5' r='1.4'/>",
  SBC:
    "<rect x='4' y='7' width='16' height='11' rx='1.5'/><rect x='12' y='9.5' width='6' height='6' rx='0.8' fill='#fff'/><circle cx='6.6' cy='10' r='0.9' fill='#fff'/><circle cx='9.2' cy='10' r='0.9' fill='#fff'/><circle cx='6.6' cy='12.6' r='0.9' fill='#fff'/><circle cx='9.2' cy='12.6' r='0.9' fill='#fff'/><path d='M5 19.2h14' fill='none' stroke-width='1.6'/>",
  ANDROID:
    "<path d='M8.2 6.6l-1.7-2.6' fill='none' stroke-width='1.5'/><path d='M15.8 6.6l1.7-2.6' fill='none' stroke-width='1.5'/><path d='M6 12.5a6 6 0 0 1 12 0v5.2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z'/><circle cx='10' cy='10.6' r='0.95' fill='#fff'/><circle cx='14' cy='10.6' r='0.95' fill='#fff'/>",
  VIRTUAL:
    "<circle cx='12' cy='12' r='8' fill='none' stroke-width='1.4'/><path d='M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16' fill='none' stroke-width='1.2'/>",
  INTERNET:
    "<circle cx='12' cy='12' r='8' fill='none' stroke-width='1.4'/><path d='M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16' fill='none' stroke-width='1.2'/>",
};

const DEFAULT_GLYPH = "<circle cx='12' cy='12' r='7'/>";

/**
 * 返回 ECharts symbol 字符串（image://data:image/svg+xml），按类型 + 状态色着色。
 * @param {string} type 设备类型（SERVER/REDIS/.../POWER/ESS/IOT/VIRTUAL/INTERNET）
 * @param {string} color 状态色（如 #67c23a / #e6a23c / #f56c6c）
 */
export function nodeSymbol(type, color) {
  const c = color || "#409eff";
  const inner = GLYPH[type] || DEFAULT_GLYPH;
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>" +
    "<circle cx='12' cy='12' r='11.4' fill='#ffffff' stroke='" + c + "' stroke-width='1.2'/>" +
    "<g fill='" + c + "' stroke='" + c + "'>" + inner + "</g>" +
    "</svg>";
  return "image://data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/** 设备类型中文名（图例/提示用）。 */
export const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息队列",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
  POWER: "电能",
  ESS: "储能",
  IOT: "物联",
  SBC: "单板机",
  ANDROID: "安卓",
  VIRTUAL: "虚拟节点",
  INTERNET: "互联网",
};
