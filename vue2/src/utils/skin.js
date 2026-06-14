// =============================================================
// 皮肤（light / dark）切换工具。
// 通过 <html data-theme="..."> 配合 src/styles/skin.less 的 CSS 变量生效。
// 持久化在 localStorage['cm-skin']。
// =============================================================

const STORAGE_KEY = "cm-skin";

export function getSkin() {
  try {
    return localStorage.getItem(STORAGE_KEY) || "light";
  } catch (e) {
    return "light";
  }
}

export function setSkin(s) {
  const skin = s === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", skin);
  try {
    localStorage.setItem(STORAGE_KEY, skin);
  } catch (e) {
    // ignore storage errors
  }
  return skin;
}

export function initSkin() {
  return setSkin(getSkin());
}
