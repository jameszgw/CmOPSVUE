// 对齐原 React 版 src/utils/permission.ts
// 增加前缀匹配以支持带参数的路由(如 /devops/ci/app/info/:id)
export const checkPermission = (path, menu) => {
  if (!menu || !menu.menuTree) {
    return false;
  }
  const hasPermission = (menuTree) =>
    (menuTree || []).some((item) => {
      if (item.path === path) {
        return true;
      }
      if (item.path && path.startsWith(item.path + "/")) {
        return true;
      }
      if (item.children) {
        return hasPermission(item.children);
      }
      return false;
    });
  return hasPermission(menu.menuTree);
};
