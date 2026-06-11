/**
 * 判断文件名是否为图片类型
 * @param {string} fileName - 文件名
 * @returns {boolean}
 */
export function isImageFileType(fileName) {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

  const fileExtension = fileName.toLowerCase().split(".").pop();

  return imageExtensions.includes(fileExtension);
}
