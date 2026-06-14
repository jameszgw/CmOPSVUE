<template>
  <div class="page-container">
    <h2 class="page-title">SFTP</h2>
    <el-card shadow="never">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-card header="目录树" shadow="never">
            <el-input
              v-model="inputPath"
              class="path-input"
              @keyup.enter="handleInputPathSubmit"
            />
            <el-tree
              v-if="session"
              lazy
              :load="loadNode"
              :props="{ label: 'name', isLeaf: 'leaf' }"
              @node-click="handleDirectoryNodeClick"
            />
          </el-card>
        </el-col>
        <el-col :span="18">
          <el-card shadow="never">
            <div class="file-toolbar">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item v-for="(part, index) in breadcrumbParts" :key="index">
                  {{ part === "" ? "/" : part }}
                </el-breadcrumb-item>
              </el-breadcrumb>

              <div class="toolbar-actions">
                <span class="hidden-switch">
                  显示隐藏文件
                  <el-switch v-model="showHiddenFiles" @change="toggleShowHiddenFiles" />
                </span>
                <el-button-group>
                  <el-button :icon="Back" title="返回上级" :disabled="currentPath === '/'" @click="goBack" />
                  <el-button
                    :icon="Delete"
                    title="删除"
                    :disabled="selectedRows.length === 0"
                    @click="deleteSelectedFiles(selectedRows.map((row) => row.path))"
                  />
                  <el-button
                    :icon="Download"
                    title="下载"
                    :disabled="selectedRows.length === 0"
                    @click="downloadSelectedFiles(selectedRows.map((row) => row.path))"
                  />
                  <el-button
                    :icon="FolderOpened"
                    title="打包下载"
                    :disabled="selectedRows.length === 0"
                    @click="packageSelected"
                  />
                  <el-button
                    :icon="CopyDocument"
                    title="复制路径"
                    @click="copySelectedFilesPath(currentPath)"
                  />

                  <!-- 传输列表 -->
                  <el-popover
                    placement="bottom-end"
                    :width="520"
                    trigger="click"
                    @show="onTransferPopoverShow"
                    @hide="onTransferPopoverHide"
                  >
                    <template #reference>
                      <el-badge
                        :value="activeTransferCount"
                        :hidden="activeTransferCount === 0"
                        type="primary"
                      >
                        <el-button :icon="Switch" title="传输列表" @click="getTransfers" />
                      </el-badge>
                    </template>
                    <div class="transfer-panel">
                      <el-button-group class="transfer-toolbar">
                        <el-button size="small" :icon="Refresh" title="刷新" @click="getTransfers" />
                        <el-button
                          size="small"
                          :icon="VideoPause"
                          title="暂停所有"
                          @click="pauseAll"
                        />
                        <el-button
                          size="small"
                          :icon="RefreshRight"
                          title="恢复所有"
                          @click="resumeAll"
                        />
                        <el-button
                          size="small"
                          :icon="CircleCheck"
                          title="重试所有"
                          @click="retryAllFailed"
                        />
                        <el-button
                          size="small"
                          :icon="Files"
                          title="打包传输"
                          @click="packageAllDownloads"
                        />
                        <el-button size="small" :icon="Delete" title="清空" @click="clearAll" />
                      </el-button-group>
                      <div class="transfer-list">
                        <div
                          v-for="item in transferList"
                          :key="item.fileToken"
                          class="transfer-item"
                        >
                          <div class="transfer-file" :title="item.remoteFile">
                            {{ item.remoteFile }}
                          </div>
                          <div
                            v-if="item.total"
                            class="transfer-size"
                          >
                            {{ item.transferredText || "0" }} / {{ item.totalText || "-" }}
                          </div>
                          <div class="transfer-row">
                            <el-tag :type="statusColorMapper[item.status] || 'info'" size="small">
                              {{ statusMapper[item.status] || "未知" }}
                            </el-tag>
                            <el-progress
                              class="transfer-progress"
                              :percentage="item.progress || 0"
                              :show-text="false"
                            />
                            <el-button
                              v-if="item.status === 20"
                              size="small"
                              :icon="VideoPause"
                              title="暂停"
                              @click="handleTransferAction(item, 'pause')"
                            />
                            <el-button
                              v-if="item.status === 30"
                              size="small"
                              :icon="VideoPlay"
                              title="恢复"
                              @click="handleTransferAction(item, 'resume')"
                            />
                            <el-button
                              v-if="item.status === 40"
                              size="small"
                              :icon="Download"
                              title="下载"
                              @click="handleTransferAction(item, 'download')"
                            />
                            <el-button
                              v-if="item.status === 50 || item.status === 60"
                              size="small"
                              :icon="RefreshRight"
                              title="重新传输"
                              @click="handleTransferAction(item, 'retry')"
                            />
                            <el-button
                              size="small"
                              :icon="Delete"
                              title="删除"
                              @click="handleTransferAction(item, 'delete')"
                            />
                          </div>
                        </div>
                        <el-empty
                          v-if="!transferList.length"
                          description="暂无传输任务"
                          :image-size="60"
                        />
                      </div>
                    </div>
                  </el-popover>

                  <el-button :icon="Plus" title="创建" @click="mkdirModalVisible = true" />

                  <!-- 上传 -->
                  <el-popover placement="bottom-end" :width="420" trigger="click">
                    <template #reference>
                      <el-button :icon="Upload" title="上传" />
                    </template>
                    <div class="upload-panel">
                      <el-upload
                        drag
                        multiple
                        :auto-upload="false"
                        :file-list="fileList"
                        :on-change="handleUploadChange"
                        :on-remove="handleUploadRemove"
                        class="upload-dragger"
                      >
                        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
                        <div class="el-upload__text">单击或拖动文件到此区域进行上传</div>
                      </el-upload>
                      <div class="upload-actions">
                        <el-button
                          type="primary"
                          :disabled="fileList.length === 0"
                          :loading="uploading"
                          @click="handleUpload"
                        >
                          {{ uploading ? "上传中" : "上传" }}
                        </el-button>
                        <el-button @click="clearUploadFileList">清空</el-button>
                      </div>
                    </div>
                  </el-popover>

                  <el-button :icon="Refresh" title="刷新" @click="refreshFileList" />
                </el-button-group>
              </div>
            </div>

            <!-- 文件列表 -->
            <el-table
              :data="files"
              row-key="path"
              style="width: 100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="40" />
              <el-table-column label="名称" min-width="200">
                <template #default="{ row }">
                  <span class="file-name" @click="handleFileNameClick(row)">
                    <el-icon v-if="row.isDir"><Folder /></el-icon>
                    <el-icon v-else><Document /></el-icon>
                    <el-link type="primary">{{ row.name }}</el-link>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="大小" width="100" />
              <el-table-column prop="attr" label="文件属性" width="120" />
              <el-table-column label="修改时间" width="170">
                <template #default="{ row }">{{ formatTime(row.modifyTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="320">
                <template #default="{ row }">
                  <el-button link type="primary" @click="copySelectedFilesPath(row.path)">
                    复制路径
                  </el-button>
                  <el-button link type="primary" @click="downloadSelectedFiles([row.path])">
                    下载
                  </el-button>
                  <el-button link type="danger" @click="deleteSelectedFiles([row.path])">
                    删除
                  </el-button>
                  <el-button link type="primary" @click="openMoveModal(row)">移动</el-button>
                  <el-button link type="primary" @click="openPermissionModal(row)">
                    修改权限
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新建文件(夹) -->
    <el-dialog v-model="mkdirModalVisible" title="新建文件(夹)" width="480px">
      <el-form ref="mkdirFormRef" :model="mkdirForm" :rules="mkdirRules" label-position="top">
        <el-form-item label="创建类型" prop="type">
          <el-select v-model="mkdirForm.type" style="width: 100%">
            <el-option value="file" label="文件" />
            <el-option value="dir" label="文件夹" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件" prop="path">
          <el-input v-model="mkdirForm.path">
            <template #prepend>
              <el-select v-model="basicPath" style="width: 110px">
                <el-option :value="currentPath" label="当前路径" />
                <el-option :value="homePath" label="主目录" />
                <el-option value="" label="根目录" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mkdirModalVisible = false">取消</el-button>
        <el-button type="primary" @click="createFileOrFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件提权 -->
    <el-dialog v-model="permissionModalVisible" title="文件提权" width="360px">
      <el-form label-position="top">
        <el-form-item label="文件路径">
          <span class="copy-path" @click="copySelectedFilesPath(currentFile?.path)">
            {{ currentFile?.path }}
          </span>
        </el-form-item>
        <el-form-item label="权限">
          <el-input-number
            v-model="permissionValue"
            :max="777"
            :min="0"
            :controls="false"
            @change="handlePermissionChange"
          />
        </el-form-item>
        <el-form-item label="当前文件权限">{{ displayRwx }}</el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionModalVisible = false">取消</el-button>
        <el-button type="primary" @click="updatePermission">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件移动 -->
    <el-dialog v-model="moveModalVisible" title="文件移动" width="360px">
      <el-form ref="moveFormRef" :model="moveForm" :rules="moveRules" label-position="top">
        <el-form-item label="文件路径">
          <span class="copy-path" @click="copySelectedFilesPath(currentFile?.path)">
            {{ currentFile?.path }}
          </span>
        </el-form-item>
        <el-form-item label="目标路径" prop="target">
          <el-input v-model="moveForm.target" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveModalVisible = false">取消</el-button>
        <el-button type="primary" @click="handleMoveFile">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Back,
  Delete,
  Download,
  CopyDocument,
  Switch,
  Plus,
  Upload,
  Refresh,
  RefreshRight,
  VideoPause,
  VideoPlay,
  CircleCheck,
  Files,
  FolderOpened,
} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import {
  openSftpConnection,
  getDirList,
  getFileList,
  createFolder,
  createFile,
  moveFile,
  removeFile,
  changeFilePermissions,
  downloadFile,
  getUploadAccessToken,
  getTransferList,
  pauseFileTransfer,
  resumeFileTransfer,
  retryFailedTransfer,
  retryAllFailedTransfers,
  pauseAllTransfers,
  resumeAllTransfers,
  clearAllTransfers,
  removeSingleTransfer,
  packageDownloadFile,
  packageAllCompletedFiles,
  down,
} from "@/api/sftp";

const route = useRoute();
const hostId = route.params.hostId;

const session = ref(null);
const files = ref([]);
const transferList = ref([]);

const showHiddenFiles = ref(false);
const selectedRows = ref([]);
const currentPath = ref("/");
const homePath = ref("/");
const pathStack = ref(["/"]);
const inputPath = ref("/");
const basicPath = ref("/");

const mkdirModalVisible = ref(false);
const moveModalVisible = ref(false);
const permissionModalVisible = ref(false);
const currentFile = ref(null);
const displayRwx = ref(null);
const permissionValue = ref(undefined);

const fileList = ref([]);
const uploading = ref(false);

const mkdirFormRef = ref(null);
const moveFormRef = ref(null);
const mkdirForm = reactive({ type: "file", path: "" });
const moveForm = reactive({ target: "" });

const mkdirRules = {
  type: [{ required: true, message: "请输入具体创建类型", trigger: "change" }],
  path: [{ required: true, message: "请输入具体文件或文件夹名称", trigger: "blur" }],
};
const moveRules = {
  target: [{ required: true, message: "请输入移动后目标路径", trigger: "blur" }],
};

const statusMapper = {
  10: "未开始",
  20: "进行中",
  30: "已暂停",
  40: "已完成",
  50: "已取消",
  60: "传输异常",
};

const statusColorMapper = {
  10: "info",
  20: "primary",
  30: "warning",
  40: "success",
  50: "warning",
  60: "danger",
};

const breadcrumbParts = computed(() => currentPath.value.split("/"));

const formatTime = (time) => (time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "");

function modeToRwx(isDir, mode) {
  if (mode === null || mode === undefined) {
    return "----------";
  }
  // 将字符串形式的mode转换为八进制数值
  const numericMode = parseInt(mode.toString(), 8);
  const rMask = 4;
  const wMask = 2;
  const xMask = 1;
  const rUser = (numericMode & (rMask << 6)) !== 0;
  const wUser = (numericMode & (wMask << 6)) !== 0;
  const xUser = (numericMode & (xMask << 6)) !== 0;
  const rGroup = (numericMode & (rMask << 3)) !== 0;
  const wGroup = (numericMode & (wMask << 3)) !== 0;
  const xGroup = (numericMode & (xMask << 3)) !== 0;
  const rOther = (numericMode & rMask) !== 0;
  const wOther = (numericMode & wMask) !== 0;
  const xOther = (numericMode & xMask) !== 0;
  const user = `${rUser ? "r" : "-"}${wUser ? "w" : "-"}${xUser ? "x" : "-"}`;
  const group = `${rGroup ? "r" : "-"}${wGroup ? "w" : "-"}${xGroup ? "x" : "-"}`;
  const other = `${rOther ? "r" : "-"}${wOther ? "w" : "-"}${xOther ? "x" : "-"}`;
  return (isDir ? "d" : "-") + user + group + other;
}

// 打开 SFTP 会话
const openSession = async () => {
  const res = await openSftpConnection({ hostId });
  session.value = res.content;
  const home = session.value?.home || "/";
  homePath.value = session.value?.path || "/";
  currentPath.value = home;
  basicPath.value = home;
  inputPath.value = home;
  pathStack.value.push(home);
  await loadFileListData(home, showHiddenFiles.value);
  await getTransfers();
  // 若已有进行中任务，开启轮询让徽标与进度保持实时
  if (shouldPoll()) startPolling();
};

// 文件列表
const loadFileListData = async (dirPath, showHidden) => {
  const res = await getFileList({
    path: dirPath,
    sessionToken: session.value?.sessionToken,
    all: showHidden,
  });
  files.value = res.content?.files || [];
  currentPath.value = dirPath;
};

// 目录树懒加载
const loadNode = async (node, resolve) => {
  const path = node.level === 0 ? "/" : node.data.path;
  try {
    const res = await getDirList({ path, sessionToken: session.value?.sessionToken });
    const children = (res.content?.files || []).map((file) => ({
      name: file.name,
      path: file.path,
      leaf: !file.isDir,
    }));
    resolve(children);
  } catch (e) {
    resolve([]);
  }
};

const handleDirectoryNodeClick = (data) => {
  currentPath.value = data.path;
  inputPath.value = data.path;
  pathStack.value.push(data.path);
  loadFileListData(data.path, showHiddenFiles.value);
};

const handleInputPathSubmit = () => {
  currentPath.value = inputPath.value;
  pathStack.value.push(inputPath.value);
  loadFileListData(inputPath.value, showHiddenFiles.value);
};

const handleFileNameClick = (row) => {
  if (row.isDir) {
    pathStack.value.push(row.path);
    loadFileListData(row.path, showHiddenFiles.value);
  }
};

const toggleShowHiddenFiles = () => {
  loadFileListData(currentPath.value, showHiddenFiles.value);
};

const goBack = () => {
  if (pathStack.value.length >= 1) {
    pathStack.value.pop();
    const previousPath = pathStack.value[pathStack.value.length - 1] || "/";
    loadFileListData(previousPath, showHiddenFiles.value);
  } else {
    ElMessage.warning("已经是根目录");
  }
};

const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

const refreshFileList = () => {
  loadFileListData(currentPath.value, showHiddenFiles.value);
};

// 删除选中文件
const deleteSelectedFiles = async (paths) => {
  await removeFile({ paths, sessionToken: session.value?.sessionToken });
  ElMessage.success("删除成功");
  refreshFileList();
};

// 下载选中文件
const downloadSelectedFiles = async (paths) => {
  await downloadFile({ paths, sessionToken: session.value?.sessionToken });
  ElMessage.success("添加传输列表成功");
};

// 通过 logId 触发浏览器附件下载（创建临时 a 标签点击）
const downloadByLogId = (id) => {
  if (id === null || id === undefined) {
    return;
  }
  const a = document.createElement("a");
  a.href = `/api/devops/download/sftp?logId=${id}`;
  a.setAttribute("download", "");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 打包下载当前选中的文件
const packageSelected = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning("请先选择文件");
    return;
  }
  try {
    const res = await packageDownloadFile({
      paths: selectedRows.value.map((row) => row.path),
      sessionToken: session.value?.sessionToken,
    });
    const content = res?.content;
    if (!content?.id) {
      ElMessage.warning("打包失败或无可下载文件");
      return;
    }
    downloadByLogId(content.id);
    getTransfers();
  } catch (e) {
    /* toasted */
  }
};

// 打包全部已完成的传输
const packageAllDownloads = async () => {
  try {
    const res = await packageAllCompletedFiles({
      sessionToken: session.value?.sessionToken,
      packageType: "all",
    });
    const content = res?.content;
    if (!content?.id) {
      ElMessage.warning("暂无可打包的已完成文件");
      return;
    }
    downloadByLogId(content.id);
  } catch (e) {
    /* toasted */
  }
};

// 复制路径
const copySelectedFilesPath = (path) => {
  if (!path) {
    return;
  }
  navigator.clipboard.writeText(path).then(
    () => ElMessage.success("路径复制成功"),
    () => ElMessage.error("复制失败")
  );
};

// 创建文件或文件夹
const createFileOrFolder = () => {
  mkdirFormRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    const path = `${basicPath.value}/${mkdirForm.path}`;
    if (mkdirForm.type === "file") {
      await createFile({ sessionToken: session.value?.sessionToken, path });
      ElMessage.success("文件创建成功");
    } else {
      await createFolder({ sessionToken: session.value?.sessionToken, path });
      ElMessage.success("文件夹创建成功");
    }
    refreshFileList();
    mkdirModalVisible.value = false;
    mkdirForm.type = "file";
    mkdirForm.path = "";
  });
};

// 移动文件
const openMoveModal = (row) => {
  currentFile.value = row;
  moveForm.target = "";
  moveModalVisible.value = true;
};

const handleMoveFile = () => {
  moveFormRef.value.validate(async (valid) => {
    if (!valid) {
      return;
    }
    await moveFile({
      source: currentFile.value?.path,
      target: moveForm.target,
      sessionToken: session.value?.sessionToken,
    });
    ElMessage.success("移动成功");
    refreshFileList();
    moveModalVisible.value = false;
  });
};

// 修改权限
const openPermissionModal = (row) => {
  currentFile.value = row;
  permissionValue.value = undefined;
  displayRwx.value = modeToRwx(row?.isDir, row?.permission);
  permissionModalVisible.value = true;
};

const handlePermissionChange = (value) => {
  if (currentFile.value !== null) {
    displayRwx.value = modeToRwx(currentFile.value?.isDir, value);
  }
};

const updatePermission = async () => {
  await changeFilePermissions({
    permission: permissionValue.value,
    path: currentFile.value?.path,
    sessionToken: session.value?.sessionToken,
  });
  ElMessage.success("修改文件权限成功");
  refreshFileList();
  permissionModalVisible.value = false;
};

// 传输列表
const getTransfers = async () => {
  const res = await getTransferList({ sessionToken: session.value?.sessionToken });
  transferList.value = res.content || [];
  // 出现进行中任务时自动开启轮询（幂等）
  if (shouldPoll()) startPolling();
};

// ===== 传输进度自动轮询 =====
// 进行中的状态：未开始(10) / 进行中(20) / 已暂停(30)
const ACTIVE_STATUSES = [10, 20, 30];
const activeTransferCount = computed(
  () =>
    (transferList.value || []).filter((t) => ACTIVE_STATUSES.includes(t.status))
      .length
);
const transferPopoverOpen = ref(false);
let pollTimer = null;

const shouldPoll = () =>
  transferPopoverOpen.value || activeTransferCount.value > 0;

const tickPoll = async () => {
  // 静默刷新；失败不弹错以免轮询噪声
  try {
    await getTransfers();
  } catch (e) {
    /* ignore */
  }
  // 若已无需轮询则停止
  if (!shouldPoll()) {
    stopPolling();
  }
};

const startPolling = () => {
  if (pollTimer) return;
  pollTimer = setInterval(tickPoll, 1500);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const onTransferPopoverShow = () => {
  transferPopoverOpen.value = true;
  getTransfers();
  startPolling();
};

const onTransferPopoverHide = () => {
  transferPopoverOpen.value = false;
  // 弹层关闭后，若仍有进行中任务则继续轮询徽标计数，否则停止
  if (!shouldPoll()) {
    stopPolling();
  }
};

const pauseAll = async () => {
  await pauseAllTransfers({ sessionToken: session.value?.sessionToken });
  getTransfers();
};

const resumeAll = async () => {
  await resumeAllTransfers({ sessionToken: session.value?.sessionToken });
  getTransfers();
};

const retryAllFailed = async () => {
  await retryAllFailedTransfers({ sessionToken: session.value?.sessionToken });
  getTransfers();
};

const clearAll = async () => {
  await clearAllTransfers({ sessionToken: session.value?.sessionToken });
  getTransfers();
};

const handleTransferAction = async (item, action) => {
  const sessionToken = session.value?.sessionToken;
  switch (action) {
    case "pause":
      await pauseFileTransfer({ sessionToken, fileToken: item.fileToken });
      break;
    case "resume":
      await resumeFileTransfer({ sessionToken, fileToken: item.fileToken });
      break;
    case "download":
      await down({ logId: item.id });
      break;
    case "retry":
      await retryFailedTransfer({ sessionToken, fileToken: item.fileToken });
      break;
    case "delete":
      await removeSingleTransfer({ sessionToken, fileToken: item.fileToken });
      break;
    default:
      break;
  }
  getTransfers();
};

// 上传
const handleUploadChange = (file, uploadFiles) => {
  const isLt200M = file.size / 1024 / 1024 < 200;
  if (!isLt200M) {
    ElMessage.error("文件大小必须小于200MB!");
    fileList.value = uploadFiles.filter((item) => item.uid !== file.uid);
    return;
  }
  fileList.value = uploadFiles;
};

const handleUploadRemove = (file, uploadFiles) => {
  fileList.value = uploadFiles;
};

const clearUploadFileList = () => {
  fileList.value = [];
};

const handleUpload = async () => {
  const formData = new FormData();
  fileList.value.forEach((file) => {
    formData.append("files", file.raw);
  });
  uploading.value = true;
  try {
    const res = await getUploadAccessToken({
      sessionToken: session.value?.sessionToken,
      hostId,
      remotePath: currentPath.value,
    });
    formData.append("accessToken", res.content);
    await fetch("/api/devops/sftp/upload/exec", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then(() => {
        fileList.value = [];
        ElMessage.success("上传成功");
        getTransfers();
      })
      .catch(() => {
        ElMessage.error("上传失败");
      });
  } finally {
    uploading.value = false;
  }
};

onMounted(() => {
  if (hostId) {
    openSession();
  }
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style lang="less" scoped>
.title {
  background: rgb(121, 173, 242);
}

.page-title {
  margin: 0 0 16px;
}

.path-input {
  margin-bottom: 8px;
}

.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .toolbar-actions {
    display: flex;
    align-items: center;

    .hidden-switch {
      margin-right: 12px;
      white-space: nowrap;
    }
  }
}

.file-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.copy-path {
  cursor: pointer;
  color: var(--el-color-primary);
  word-break: break-all;
}

.transfer-panel {
  .transfer-toolbar {
    margin-bottom: 8px;
  }

  .transfer-list {
    max-height: 300px;
    overflow-y: auto;
    padding-right: 8px;

    .transfer-item {
      margin-bottom: 8px;

      .transfer-file {
        max-width: 480px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .transfer-size {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin: 2px 0;
      }

      .transfer-row {
        display: flex;
        align-items: center;
        gap: 4px;

        .transfer-progress {
          width: 280px;
        }
      }
    }
  }
}

.upload-panel {
  .upload-actions {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
