// 皮肤（浅色/深色）工具：读取、设置、初始化。持久化到 localStorage。
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
  document.documentElement.classList.toggle("dark", skin === "dark");
  try {
    localStorage.setItem(STORAGE_KEY, skin);
  } catch (e) {
    /* ignore */
  }
  return skin;
}

export function initSkin() {
  setSkin(getSkin());
}
