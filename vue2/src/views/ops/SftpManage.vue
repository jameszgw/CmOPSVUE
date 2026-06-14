<template>
  <div class="page-container">
    <h2 class="title">SFTP</h2>
    <el-card shadow="never">
      <el-row :gutter="24">
        <el-col :span="6">
          <el-card shadow="never">
            <template #header>目录树</template>
            <el-input
              v-model="inputPath"
              style="margin-bottom: 8px"
              @keyup.enter.native="handleInputPathSubmit"
            />
            <el-tree
              :key="treeKey"
              lazy
              :load="loadTreeNode"
              :props="treeProps"
              node-key="path"
              @node-click="handleDirectoryNodeSelect"
            />
          </el-card>
        </el-col>
        <el-col :span="18">
          <el-card shadow="never">
            <div class="toolbar">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item v-for="(part, index) in breadcrumbParts" :key="index">
                  {{ part === "" ? "/" : part }}
                </el-breadcrumb-item>
              </el-breadcrumb>

              <!-- 顶部操作按钮工具栏 -->
              <div class="toolbar-actions">
                <span style="margin-right: 8px">
                  显示隐藏文件
                  <el-switch v-model="showHiddenFiles" @change="toggleShowHiddenFiles" />
                </span>
                <el-button-group>
                  <el-button
                    icon="el-icon-back"
                    title="返回上一级"
                    :disabled="currentPath === '/'"
                    @click="goBack"
                  />
                  <el-button
                    icon="el-icon-delete"
                    title="删除"
                    :disabled="selectedRows.length === 0"
                    @click="deleteSelectedFiles(selectedRows.map((row) => row.path))"
                  />
                  <el-button
                    icon="el-icon-download"
                    title="下载"
                    :disabled="selectedRows.length === 0"
                    @click="downloadSelectedFiles(selectedRows.map((row) => row.path))"
                  />
                  <el-button
                    icon="el-icon-box"
                    title="打包下载"
                    :disabled="selectedRows.length === 0"
                    @click="packageSelected"
                  />
                  <el-button
                    icon="el-icon-document-copy"
                    title="复制路径"
                    @click="copySelectedFilesPath(currentPath)"
                  />
                </el-button-group>

                <!-- 传输列表 -->
                <el-popover placement="bottom-end" width="480" trigger="click">
                  <div class="transfer-toolbar">
                    <el-button-group>
                      <el-button size="mini" icon="el-icon-refresh" title="刷新" @click="getTransferList" />
                      <el-button size="mini" icon="el-icon-video-pause" title="暂停所有" @click="pauseAllTransfers" />
                      <el-button size="mini" icon="el-icon-refresh-right" title="恢复所有" @click="resumeAllTransfers" />
                      <el-button size="mini" icon="el-icon-finished" title="重试所有" @click="retryFailedTransfer" />
                      <el-button size="mini" icon="el-icon-box" title="打包传输" @click="packageAllDownloads" />
                      <el-button size="mini" icon="el-icon-delete" title="清空" @click="clearAllTransfers" />
                    </el-button-group>
                  </div>
                  <div class="transfer-list">
                    <div v-for="item in transferList" :key="item.fileToken" class="transfer-item">
                      <div class="transfer-file" :title="item.remoteFile">{{ item.remoteFile }}</div>
                      <div class="transfer-row">
                        <el-tag size="mini" :type="statusColorMapper[item.status]">
                          {{ statusMapper[item.status] }}
                        </el-tag>
                        <el-progress
                          :percentage="item.progress || 0"
                          :show-text="false"
                          style="width: 240px"
                        />
                        <el-button
                          v-if="item.status === 20"
                          size="mini"
                          icon="el-icon-video-pause"
                          title="暂停"
                          @click="handleAction(item, 'pause')"
                        />
                        <el-button
                          v-if="item.status === 30"
                          size="mini"
                          icon="el-icon-video-play"
                          title="恢复"
                          @click="handleAction(item, 'resume')"
                        />
                        <el-button
                          v-if="item.status === 40"
                          size="mini"
                          icon="el-icon-download"
                          title="下载"
                          @click="handleAction(item, 'download')"
                        />
                        <el-button
                          v-if="item.status === 50 || item.status === 60"
                          size="mini"
                          icon="el-icon-refresh-right"
                          title="重新传输"
                          @click="handleAction(item, 'retry')"
                        />
                        <el-button
                          size="mini"
                          icon="el-icon-delete"
                          title="删除"
                          @click="handleAction(item, 'delete')"
                        />
                      </div>
                    </div>
                  </div>
                  <el-button
                    slot="reference"
                    icon="el-icon-sort"
                    title="传输列表"
                    @click="getTransferList"
                  />
                </el-popover>

                <el-button icon="el-icon-plus" title="创建" @click="mkdirModalVisible = !mkdirModalVisible" />

                <!-- 上传 -->
                <el-popover placement="bottom-end" width="420" trigger="click">
                  <div class="upload-panel">
                    <el-upload
                      drag
                      multiple
                      action="#"
                      :auto-upload="false"
                      :file-list="fileList"
                      :on-change="handleUploadChange"
                      :on-remove="handleUploadRemove"
                    >
                      <i class="el-icon-upload" />
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
                  <el-button slot="reference" icon="el-icon-upload2" title="上传" />
                </el-popover>

                <el-button icon="el-icon-refresh" title="刷新" @click="refreshFileList" />
              </div>
            </div>

            <!-- 文件列表 -->
            <el-table
              :data="files"
              row-key="path"
              style="width: 100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="48" :reserve-selection="false" />
              <el-table-column label="名称">
                <template #default="{ row }">
                  <span class="file-name" @click="handleFileNameClick(row)">
                    <i :class="row.isDir ? 'el-icon-folder' : 'el-icon-document'" />
                    <span class="file-link">{{ row.name }}</span>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="size" label="大小" width="120" />
              <el-table-column prop="attr" label="文件属性" width="140" />
              <el-table-column label="修改时间" width="170">
                <template #default="{ row }">{{ formatTime(row.modifyTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="280">
                <template #default="{ row }">
                  <el-button type="text" @click="copySelectedFilesPath(row.path)">复制路径</el-button>
                  <el-button type="text" @click="downloadSelectedFiles([row.path])">下载</el-button>
                  <el-button type="text" @click="deleteSelectedFiles([row.path])">删除</el-button>
                  <el-button type="text" @click="openMoveModal(row)">移动</el-button>
                  <el-button type="text" @click="openPermissionModal(row)">修改权限</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 新建文件(夹) -->
    <el-dialog title="新建文件(夹)" :visible.sync="mkdirModalVisible" width="480px">
      <el-form ref="mkdirForm" :model="mkdirForm" label-position="top">
        <el-form-item
          label="创建类型"
          prop="type"
          :rules="[{ required: true, message: '请输入具体创建类型' }]"
        >
          <el-select v-model="mkdirForm.type" style="width: 100%">
            <el-option label="文件" value="file" />
            <el-option label="文件夹" value="dir" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="文件"
          prop="path"
          :rules="[{ required: true, message: '请输入具体文件或文件夹名称' }]"
        >
          <el-input v-model="mkdirForm.path">
            <el-select slot="prepend" v-model="basicPath" style="width: 110px">
              <el-option label="当前路径" :value="currentPath" />
              <el-option label="主目录" :value="homePath" />
              <el-option label="根目录" :value="''" />
            </el-select>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="mkdirModalVisible = false">取消</el-button>
        <el-button type="primary" @click="createFileOrFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件提权 -->
    <el-dialog title="文件提权" :visible.sync="permissionModalVisible" width="360px">
      <el-form label-position="top">
        <el-form-item label="文件路径">
          <span>{{ currentFile && currentFile.path }}</span>
        </el-form-item>
        <el-form-item label="权限">
          <el-input-number
            v-model="permissionForm.auth"
            :max="777"
            :controls="false"
            @change="handlePermissionInput"
          />
        </el-form-item>
        <el-form-item label="当前文件权限">{{ displayRwx }}</el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="permissionModalVisible = false">取消</el-button>
        <el-button type="primary" @click="updatePermission(permissionForm.auth)">确定</el-button>
      </template>
    </el-dialog>

    <!-- 文件移动 -->
    <el-dialog title="文件移动" :visible.sync="moveModalVisible" width="360px">
      <el-form ref="moveForm" :model="moveForm" label-position="top">
        <el-form-item label="文件路径">
          <span>{{ currentFile && currentFile.path }}</span>
        </el-form-item>
        <el-form-item
          label="目标路径"
          prop="target"
          :rules="[{ required: true, message: '请输入移动后目标路径' }]"
        >
          <el-input v-model="moveForm.target" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveModalVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="moveFile(currentFile && currentFile.path, moveForm.target)"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
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
  getUploadAccessToken,
  downloadFile,
  pauseFileTransfer,
  resumeFileTransfer,
  retryFailedTransfer,
  pauseAllTransfers,
  resumeAllTransfers,
  retryAllFailedTransfers,
  getTransferList,
  removeSingleTransfer,
  clearAllTransfers,
  packageDownloadFile,
  packageAllCompletedFiles,
  down,
} from "@/api/sftp";

const StatusMapper = {
  10: "未开始",
  20: "进行中",
  30: "已暂停",
  40: "已完成",
  50: "已取消",
  60: "传输异常",
};

const StatusColorMapper = {
  10: "info",
  20: "",
  30: "info",
  40: "success",
  50: "warning",
  60: "danger",
};

function modeToRwx(isDir, mode) {
  if (mode === null || mode === undefined) {
    return "----------";
  }

  // 将字符串形式的mode转换为八进制数值
  const numericMode = parseInt(mode.toString(), 8);

  // 定义rwx权限位的掩码
  const rMask = 4; // 0400 -> 4
  const wMask = 2; // 0200 -> 2
  const xMask = 1; // 0100 -> 1

  // 根据掩码检查rwx权限
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

  // 根据是否是目录在最前面添加 'd' 或 '-'
  return (isDir ? "d" : "-") + user + group + other;
}

export default {
  name: "SftpManage",
  data() {
    return {
      open: null, // 会话信息 { home, sessionToken, path, ... }
      files: [],
      transferList: [],
      treeKey: 0,
      treeProps: {
        label: "name",
        isLeaf: (data) => !data.isDir,
      },
      showHiddenFiles: false,
      mkdirModalVisible: false,
      moveModalVisible: false,
      permissionModalVisible: false,
      selectedRows: [],
      currentPath: "/",
      homePath: "/",
      pathStack: ["/"],
      inputPath: "/",
      basicPath: "/",
      currentFile: null,
      displayRwx: null,
      mkdirForm: { type: "file", path: "" },
      moveForm: { target: "" },
      permissionForm: { auth: undefined },
      fileList: [],
      uploading: false,
      statusMapper: StatusMapper,
      statusColorMapper: StatusColorMapper,
    };
  },
  computed: {
    hostId() {
      return this.$route.params.hostId;
    },
    sessionToken() {
      return this.open && this.open.sessionToken;
    },
    breadcrumbParts() {
      return (this.currentPath || "/").split("/");
    },
  },
  created() {
    if (this.hostId) {
      this.openSession(this.hostId);
    }
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "";
    },
    async openSession(hostId) {
      const res = await openSftpConnection({ hostId });
      this.open = res.content;
      if (this.open && this.open.sessionToken) {
        this.treeKey += 1; // 重新加载目录树
        this.getTransferList();
      }
      if (this.open && this.open.home) {
        this.currentPath = this.open.home;
        this.pathStack.push(this.open.home);
        this.basicPath = this.open.home;
        this.homePath = this.open.path || this.open.home;
        this.inputPath = this.open.home;
        this.getFileList(this.open.home, this.showHiddenFiles);
      }
    },
    // el-tree 懒加载目录
    async loadTreeNode(node, resolve) {
      if (!this.sessionToken) {
        resolve([]);
        return;
      }
      const path = node.level === 0 ? "/" : node.data.path;
      try {
        const res = await getDirList({ path, sessionToken: this.sessionToken });
        const dir = res.content || {};
        resolve(
          (dir.files || []).map((file) => ({
            name: file.name,
            path: file.path,
            isDir: file.isDir,
          }))
        );
      } catch (e) {
        resolve([]);
      }
    },
    handleDirectoryNodeSelect(data) {
      if (!data.isDir) return;
      this.currentPath = data.path;
      this.inputPath = data.path;
      this.pathStack.push(data.path);
      this.getFileList(data.path, this.showHiddenFiles);
    },
    async getFileList(dirPath, showHidden) {
      const res = await getFileList({
        path: dirPath,
        sessionToken: this.sessionToken,
        all: showHidden,
      });
      const content = res.content || {};
      this.files = content.files || [];
      this.currentPath = dirPath;
    },
    toggleShowHiddenFiles() {
      this.getFileList(this.currentPath, this.showHiddenFiles);
    },
    goBack() {
      if (this.pathStack.length >= 1) {
        this.pathStack.pop();
        const previousPath = this.pathStack[this.pathStack.length - 1] || "/";
        this.currentPath = previousPath;
        this.getFileList(previousPath, this.showHiddenFiles);
      } else {
        this.$message.warning("已经是根目录");
      }
    },
    handleInputPathSubmit() {
      this.currentPath = this.inputPath;
      this.pathStack.push(this.inputPath);
      this.getFileList(this.inputPath, this.showHiddenFiles);
    },
    handleFileNameClick(row) {
      if (row.isDir) {
        this.currentPath = row.path;
        this.pathStack.push(row.path);
        this.getFileList(row.path, this.showHiddenFiles);
      }
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    refreshFileList() {
      this.getFileList(this.currentPath, this.showHiddenFiles);
    },
    // 删除选中文件
    deleteSelectedFiles(paths) {
      this.$confirm("确定要删除选中的文件吗？", "确认删除", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          await removeFile({ paths, sessionToken: this.sessionToken });
          this.$message.success("删除成功");
          this.getFileList(this.currentPath, this.showHiddenFiles);
        })
        .catch(() => {});
    },
    // 下载选中文件
    async downloadSelectedFiles(paths) {
      await downloadFile({ paths, sessionToken: this.sessionToken });
      this.$message.success("添加传输列表成功");
    },
    // 复制选中文件路径
    copySelectedFilesPath(path) {
      navigator.clipboard.writeText(path).then(
        () => {
          this.$message.success("路径复制成功");
        },
        () => {
          this.$message.error("复制失败");
        }
      );
    },
    openMoveModal(row) {
      this.currentFile = row;
      this.moveForm.target = "";
      this.moveModalVisible = true;
    },
    // 移动文件
    async moveFile(source, target) {
      if (!source) return;
      this.$refs.moveForm.validate(async (valid) => {
        if (!valid) return;
        await moveFile({ source, target, sessionToken: this.sessionToken });
        this.$message.success("移动成功");
        this.getFileList(this.currentPath, this.showHiddenFiles);
        this.moveModalVisible = false;
      });
    },
    openPermissionModal(row) {
      this.currentFile = row;
      this.permissionForm.auth = undefined;
      this.displayRwx = modeToRwx(row.isDir, row.permission);
      this.permissionModalVisible = true;
    },
    handlePermissionInput(value) {
      if (this.currentFile) {
        this.displayRwx = modeToRwx(this.currentFile.isDir, value);
      }
    },
    // 更新文件权限
    async updatePermission(auth) {
      await changeFilePermissions({
        permission: auth,
        path: this.currentFile && this.currentFile.path,
        sessionToken: this.sessionToken,
      });
      this.$message.success("修改文件权限成功");
      this.getFileList(this.currentPath, this.showHiddenFiles);
      this.permissionModalVisible = false;
    },
    // 创建文件或文件夹
    createFileOrFolder() {
      this.$refs.mkdirForm.validate(async (valid) => {
        if (!valid) return;
        const fullPath = `${this.basicPath}/${this.mkdirForm.path}`;
        if (this.mkdirForm.type === "file") {
          await createFile({ sessionToken: this.sessionToken, path: fullPath });
          this.$message.success("文件创建成功");
        } else {
          await createFolder({ sessionToken: this.sessionToken, path: fullPath });
          this.$message.success("文件夹创建成功");
        }
        this.getFileList(this.currentPath, this.showHiddenFiles);
        this.mkdirModalVisible = false;
        this.mkdirForm = { type: "file", path: "" };
      });
    },
    // ===== 传输列表 =====
    async getTransferList() {
      const res = await getTransferList({ sessionToken: this.sessionToken });
      this.transferList = res.content || [];
    },
    async retryFailedTransfer() {
      await retryAllFailedTransfers({ sessionToken: this.sessionToken });
      this.getTransferList();
    },
    async clearAllTransfers() {
      await clearAllTransfers({ sessionToken: this.sessionToken });
      this.getTransferList();
    },
    async pauseAllTransfers() {
      await pauseAllTransfers({ sessionToken: this.sessionToken });
      this.getTransferList();
    },
    async resumeAllTransfers() {
      await resumeAllTransfers({ sessionToken: this.sessionToken });
      this.getTransferList();
    },
    // 通过 logId 触发浏览器下载 zip
    downloadByLogId(id) {
      if (id === undefined || id === null) return;
      const a = document.createElement("a");
      a.href = `/api/devops/download/sftp?logId=${id}`;
      a.setAttribute("download", "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    // 打包全部已完成传输并下载
    async packageAllDownloads() {
      try {
        const res = await packageAllCompletedFiles({
          sessionToken: this.sessionToken,
          packageType: "all",
        });
        const content = (res && res.content) || {};
        if (content.id === undefined || content.id === null) {
          this.$message.warning("暂无可打包的文件");
          return;
        }
        this.downloadByLogId(content.id);
        this.$message.success("打包成功，开始下载");
      } catch (e) {
        this.$message.error("打包失败");
      }
    },
    // 打包选中文件并下载
    async packageSelected() {
      if (!this.selectedRows.length) {
        this.$message.warning("请先选择文件");
        return;
      }
      try {
        const res = await packageDownloadFile({
          paths: this.selectedRows.map((row) => row.path),
          sessionToken: this.sessionToken,
        });
        const content = (res && res.content) || {};
        if (content.id === undefined || content.id === null) {
          this.$message.warning("打包结果为空");
          return;
        }
        this.downloadByLogId(content.id);
        this.$message.success("打包成功，开始下载");
      } catch (e) {
        this.$message.error("打包失败");
      }
    },
    async handleAction(item, action) {
      switch (action) {
        case "pause":
          await pauseFileTransfer({
            sessionToken: this.sessionToken,
            fileToken: item.fileToken,
          });
          break;
        case "resume":
          await resumeFileTransfer({
            sessionToken: this.sessionToken,
            fileToken: item.fileToken,
          });
          break;
        case "download":
          await down({ logId: item.id });
          break;
        case "retry":
          await retryFailedTransfer({
            sessionToken: this.sessionToken,
            fileToken: item.fileToken,
          });
          break;
        case "delete":
          await removeSingleTransfer({
            sessionToken: this.sessionToken,
            fileToken: item.fileToken,
          });
          break;
        default:
          return;
      }
      this.getTransferList();
    },
    // ===== 上传 =====
    handleUploadChange(file, fileList) {
      const isLt200M = file.size / 1024 / 1024 < 200;
      if (!isLt200M) {
        this.$message.error("文件大小必须小于200MB!");
        this.fileList = fileList.filter((f) => f.uid !== file.uid);
        return;
      }
      this.fileList = fileList;
    },
    handleUploadRemove(file, fileList) {
      this.fileList = fileList;
    },
    clearUploadFileList() {
      this.fileList = [];
    },
    async handleUpload() {
      const formData = new FormData();
      // 遍历文件数组并添加到formData中
      this.fileList.forEach((file) => {
        formData.append("files", file.raw);
      });
      this.uploading = true;
      try {
        const res = await getUploadAccessToken({
          sessionToken: this.sessionToken,
          hostId: this.hostId,
          remotePath: this.currentPath,
        });
        const accessToken = res.content;
        formData.append("accessToken", accessToken);
        await fetch("/api/devops/sftp/upload/exec", {
          method: "POST",
          body: formData,
        }).then((r) => r.json());
        this.fileList = [];
        this.$message.success("上传成功");
        this.getTransferList();
      } catch (e) {
        this.$message.error("上传失败");
      } finally {
        this.uploading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(121, 173, 242);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.file-name {
  cursor: pointer;

  .file-link {
    margin-left: 4px;
    color: #409eff;
  }
}

.transfer-toolbar {
  margin-bottom: 8px;
}

.transfer-list {
  max-height: 300px;
  overflow-y: auto;

  .transfer-item {
    margin-bottom: 10px;

    .transfer-file {
      max-width: 440px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .transfer-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.upload-panel {
  .upload-actions {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }
}
</style>
