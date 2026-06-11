// 由原 React 工程 src/utils/path.tsx 转换而来（移除 TypeScript 类型与 PathItem 接口，逻辑不变）。
// PathItem 结构: { name: string, path: string }

/**
 * 判断字符串是否为空（trim 后长度为 0）
 * @param {string} value
 * @returns {boolean}
 */
export function isEmptyStr(value) {
  return value.trim().length === 0;
}

/**
 * 递归解析路径为面包屑数组
 * @param {string} analysisPath - 要解析的路径
 * @param {Array<{name: string, path: string}>} [paths] - 累计的路径数组
 * @returns {Array<{name: string, path: string}>}
 */
export function getPathAnalysis(analysisPath, paths = []) {
  const lastSymbol = analysisPath.lastIndexOf("/");
  if (lastSymbol === -1) {
    paths.unshift({
      name: "/",
      path: "/",
    });
    return paths;
  }
  const name = analysisPath.substring(lastSymbol, analysisPath.length);
  if (!isEmptyStr(name) && name !== "/") {
    paths.unshift({
      name: name.substring(1, name.length),
      path: analysisPath,
    });
  }
  return getPathAnalysis(analysisPath.substring(0, lastSymbol), paths);
}

/**
 * Normalize the given path by replacing backslashes with forward slashes
 * and removing any duplicate slashes.
 *
 * @param {string} path - The path to normalize.
 * @returns {string} - The normalized path.
 */
export function getPath(path) {
  return path.replace(/\\+/g, "/").replace(/\/+/g, "/");
}

/**
 * Get the parent directory of the given path.
 *
 * @param {string} path - The path from which to get the parent directory.
 * @returns {string} - The parent directory path.
 */
export function getParentPath(path) {
  const paths = getPath(path).split("/");
  const len = paths.length;
  if (len <= 2) {
    return "/";
  }
  let parent = "";
  for (let i = 0; i < len - 1; i++) {
    parent += paths[i];
    if (i !== len - 2) {
      parent += "/";
    }
  }
  return parent;
}
