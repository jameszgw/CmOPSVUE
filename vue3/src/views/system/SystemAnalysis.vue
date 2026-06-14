<template>
  <div class="page-container">
    <div class="system-analysis-container">
      <!-- 清理配置 -->
      <div class="system-clean-container">
        <div class="system-clean-title">清理配置</div>
        <div class="system-clean-form-wrapper">
          <el-form label-width="120px">
            <el-form-item label="清理阈值(天)">
              <el-input
                v-model="fileCleanThreshold"
                class="clean-threshold-input"
                :disabled="fileCleanThresholdLoading"
              />
              <el-button
                type="primary"
                :loading="fileCleanThresholdLoading"
                style="margin-left: 8px"
                @click="saveCleanThreshold"
              >
                保存
              </el-button>
              <div class="extra">
                设置后清理文件时会删除当前时间减当前值之前修改的所有文件,
                如果设置为0则全部清理
              </div>
            </el-form-item>
            <el-form-item label="自动清理">
              <el-switch
                v-model="autoCleanFile"
                :loading="autoCleanFileLoading"
                @change="changeAutoClean"
              />
              <div class="extra">
                开启后每天1:30会自动清理超过所配置阈值的文件
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 系统统计分析 -->
      <div class="system-analysis-descriptions">
        <div class="system-analysis-title">系统统计分析</div>
        <div class="analysis-items">
          <div
            v-for="item in analysisItems"
            :key="item.key"
            class="analysis-item"
          >
            <span class="analysis-label">{{ item.label }}：</span>
            <span class="analysis-count">{{ analysis[item.countField] }} 个</span>
            <span class="analysis-size">{{ analysis[item.sizeField] }}</span>
            <el-button
              v-if="visibleClean[item.clearType.key]"
              type="danger"
              link
              class="clean-button"
              @click="clear(item.clearType)"
            >
              清理
            </el-button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="system-analysis-handler-container">
        <el-button
          class="re-analysis-button"
          :loading="reAnalysisLoading"
          @click="reAnalysis"
        >
          重新分析
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getSystemAnalysis,
  updateOption,
  cleanSystemFile,
  reAnalysisSystem,
} from "@/api/system";

// 系统配置项 (对齐原 React 版 SYSTEM_OPTION_KEY)
const SYSTEM_OPTION_KEY = {
  FILE_CLEAN_THRESHOLD: { key: "fileCleanThreshold", value: 10 },
  ENABLE_AUTO_CLEAN_FILE: { key: "autoCleanFile", value: 20 },
};

// 系统清理类型 (对齐原 React 版 SYSTEM_CLEAR_TYPE)
const SYSTEM_CLEAR_TYPE = {
  TEMP_FILE: { key: "tempFile", value: 10, label: "临时文件" },
  LOG_FILE: { key: "logFile", value: 20, label: "日志文件" },
  SWAP_FILE: { key: "swapFile", value: 30, label: "交换区文件" },
  DIST_FILE: { key: "distFile", value: 40, label: "旧版本构建产物" },
  REPO_FILE: { key: "repoFile", value: 50, label: "旧版本应用仓库" },
  SCREEN_FILE: { key: "screenFile", value: 60, label: "录屏文件" },
};

const analysisItems = [
  {
    key: "tempFile",
    label: "临时文件",
    countField: "tempFileCount",
    sizeField: "tempFileSize",
    clearType: SYSTEM_CLEAR_TYPE.TEMP_FILE,
  },
  {
    key: "logFile",
    label: "日志文件",
    countField: "logFileCount",
    sizeField: "logFileSize",
    clearType: SYSTEM_CLEAR_TYPE.LOG_FILE,
  },
  {
    key: "swapFile",
    label: "交换区文件",
    countField: "swapFileCount",
    sizeField: "swapFileSize",
    clearType: SYSTEM_CLEAR_TYPE.SWAP_FILE,
  },
  {
    key: "distFile",
    label: "构建产物",
    countField: "distVersionCount",
    sizeField: "distFileSize",
    clearType: SYSTEM_CLEAR_TYPE.DIST_FILE,
  },
  {
    key: "screenFile",
    label: "录屏文件",
    countField: "screenFileCount",
    sizeField: "screenFileSize",
    clearType: SYSTEM_CLEAR_TYPE.SCREEN_FILE,
  },
];

const analysis = reactive({
  tempFileCount: 0,
  tempFileSize: "0 B",
  logFileCount: 0,
  logFileSize: "0 B",
  swapFileCount: 0,
  swapFileSize: "0 B",
  distVersionCount: 0,
  distFileSize: "0 B",
  repoVersionCount: 0,
  repoVersionFileSize: "0 B",
  screenFileCount: 0,
  screenFileSize: "0 B",
});

const visibleClean = reactive({
  tempFile: true,
  logFile: true,
  swapFile: true,
  distFile: true,
  repoFile: true,
  screenFile: true,
});

const reAnalysisLoading = ref(false);
const fileCleanThreshold = ref(undefined);
const fileCleanThresholdLoading = ref(false);
const autoCleanFile = ref(false);
const autoCleanFileLoading = ref(false);

const loadData = async () => {
  const res = await getSystemAnalysis();
  const data = res.content || {};
  Object.assign(analysis, data);
  fileCleanThreshold.value = data.fileCleanThreshold;
  autoCleanFile.value = !!data.autoCleanFile;
};

const saveCleanThreshold = async () => {
  const threshold = parseInt(String(fileCleanThreshold.value), 10);
  if (threshold < 0) {
    ElMessage.warning("自动清理阈值不能小于0");
    return;
  }
  fileCleanThresholdLoading.value = true;
  try {
    await updateOption({
      option: SYSTEM_OPTION_KEY.FILE_CLEAN_THRESHOLD.value,
      value: threshold,
    });
    ElMessage.success("已保存");
  } catch (e) {
    ElMessage.error("保存失败");
  } finally {
    fileCleanThresholdLoading.value = false;
  }
};

const changeAutoClean = async (checked) => {
  autoCleanFileLoading.value = true;
  try {
    await updateOption({
      option: SYSTEM_OPTION_KEY.ENABLE_AUTO_CLEAN_FILE.value,
      value: checked,
    });
    ElMessage.success("已保存");
  } catch (e) {
    autoCleanFile.value = !checked;
    ElMessage.error("保存失败");
  } finally {
    autoCleanFileLoading.value = false;
  }
};

const clear = (type) => {
  ElMessageBox.confirm(
    "确认后会清理超过清理阈值的所有文件, 请先确认数据是否已备份, 清理后数据无法回滚!",
    "确认清理",
    {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger",
    }
  )
    .then(async () => {
      visibleClean[type.key] = false;
      const pending = ElMessage({
        message: `正在提交 ${type.label} 清理任务...`,
        duration: 0,
      });
      try {
        await cleanSystemFile({ cleanType: type.value });
        pending.close();
        ElMessage.success(
          `正在清理 ${type.label}, 清理完成后需要手动点击重新分析`
        );
      } catch (e) {
        pending.close();
        visibleClean[type.key] = true;
      }
    })
    .catch(() => {});
};

const reAnalysis = async () => {
  reAnalysisLoading.value = true;
  try {
    const res = await reAnalysisSystem();
    Object.keys(visibleClean).forEach((key) => {
      visibleClean[key] = true;
    });
    Object.assign(analysis, res.content || {});
  } catch (e) {
    ElMessage.error("重新分析失败");
  } finally {
    reAnalysisLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style lang="less" scoped>
.system-analysis-container {
  padding: 24px;
  background: var(--cm-bg-card);
  border-radius: 4px;

  .system-clean-container {
    margin-bottom: 24px;

    .system-clean-title {
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      margin-bottom: 16px;
    }

    .system-clean-form-wrapper {
      .clean-threshold-input {
        width: 200px;
      }

      .extra {
        width: 100%;
        color: rgba(0, 0, 0, 0.45);
        margin-top: 8px;
      }
    }
  }

  .system-analysis-descriptions {
    .system-analysis-title {
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      margin: 24px 0 16px;
    }

    .analysis-items {
      .analysis-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .analysis-label {
          width: 120px;
          text-align: right;
          margin-right: 16px;
          color: rgba(0, 0, 0, 0.65);
        }

        .analysis-count,
        .analysis-size {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.65);
        }

        .analysis-size {
          margin-left: 16px;
          color: #1890ff;
        }

        .clean-button {
          margin-left: 16px;
        }
      }
    }
  }

  .system-analysis-handler-container {
    margin-top: 24px;
    text-align: left;

    .re-analysis-button {
      padding: 0 16px;
      height: 32px;
      line-height: 32px;
      font-size: 14px;
    }
  }
}
</style>
