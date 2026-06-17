<template>
  <screen-page title="系统分析" gap="8px">
    <template #header-extra>
      <el-button
        size="small"
        icon="el-icon-refresh"
        :loading="reAnalysisLoading"
        @click="reAnalysis"
      >
        重新分析
      </el-button>
    </template>

    <section-card dense title="清理配置" icon="el-icon-setting">
      <el-form :inline="true" class="clean-form">
        <el-form-item label="清理阈值(天)">
          <el-input
            v-model="fileCleanThreshold"
            class="clean-threshold-input"
            size="small"
            :disabled="fileCleanThresholdLoading"
          />
          <el-button
            type="primary"
            size="small"
            :loading="fileCleanThresholdLoading"
            style="margin-left: 8px"
            @click="saveCleanThreshold"
          >
            保存
          </el-button>
        </el-form-item>
        <el-form-item label="自动清理">
          <el-switch
            v-model="autoCleanFile"
            :disabled="autoCleanFileLoading"
            @change="changeAutoClean"
          />
        </el-form-item>
      </el-form>
      <div class="extra">
        清理阈值设置后清理文件时会删除当前时间减当前值之前修改的所有文件，设置为0则全部清理；自动清理开启后每天1:30会自动清理超过阈值的文件。
      </div>
    </section-card>

    <section-card dense scrollable class="fill" title="系统统计分析" icon="el-icon-data-analysis">
      <card-grid min="220px" gap="8px">
        <div v-for="item in analysisItems" :key="item.key" class="stat-tile">
          <div class="stat-tile__head">
            <span class="stat-tile__label">{{ item.label }}</span>
            <el-button
              v-if="visibleClean[item.key]"
              type="text"
              class="stat-tile__clean"
              @click="clear(item.clearType)"
            >
              清理
            </el-button>
          </div>
          <div class="stat-tile__count">{{ analysis[item.countField] }} 个</div>
          <div class="stat-tile__size">{{ analysis[item.sizeField] }}</div>
        </div>
      </card-grid>
    </section-card>
  </screen-page>
</template>

<script>
import {
  getSystemAnalysis,
  updateOption,
  cleanSystemFile,
  reAnalysisSystem,
} from "@/api/system";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";

// 系统配置项 (原 src/utils/index SYSTEM_OPTION_KEY)
const SYSTEM_OPTION_KEY = {
  FILE_CLEAN_THRESHOLD: { key: "fileCleanThreshold", value: 10 },
  ENABLE_AUTO_CLEAN_FILE: { key: "autoCleanFile", value: 20 },
};

// 系统清理类型 (原 src/utils/index SYSTEM_CLEAR_TYPE)
const SYSTEM_CLEAR_TYPE = {
  TEMP_FILE: { key: "tempFile", value: 10, label: "临时文件" },
  LOG_FILE: { key: "logFile", value: 20, label: "日志文件" },
  SWAP_FILE: { key: "swapFile", value: 30, label: "交换区文件" },
  DIST_FILE: { key: "distFile", value: 40, label: "旧版本构建产物" },
  REPO_FILE: { key: "repoFile", value: 50, label: "旧版本应用仓库" },
  SCREEN_FILE: { key: "screenFile", value: 60, label: "录屏文件" },
};

export default {
  name: "SystemAnalysis",
  components: { ScreenPage, SectionCard, CardGrid },
  data() {
    return {
      analysis: {
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
      },
      analysisItems: [
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
      ],
      visibleClean: {
        tempFile: true,
        logFile: true,
        swapFile: true,
        distFile: true,
        repoFile: true,
        screenFile: true,
      },
      reAnalysisLoading: false,
      fileCleanThreshold: undefined,
      fileCleanThresholdLoading: false,
      autoCleanFile: false,
      autoCleanFileLoading: false,
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    async loadData() {
      const res = await getSystemAnalysis();
      const data = res.content || {};
      this.analysis = data;
      this.fileCleanThreshold = data.fileCleanThreshold;
      this.autoCleanFile = !!data.autoCleanFile;
    },
    async saveCleanThreshold() {
      const threshold = parseInt(String(this.fileCleanThreshold), 10);
      if (threshold < 0) {
        this.$message.warning("自动清理阈值不能小于0");
        return;
      }
      this.fileCleanThresholdLoading = true;
      try {
        await updateOption({
          option: SYSTEM_OPTION_KEY.FILE_CLEAN_THRESHOLD.value,
          value: threshold,
        });
        this.$message.success("已保存");
      } catch (e) {
        this.$message.error("保存失败");
      } finally {
        this.fileCleanThresholdLoading = false;
      }
    },
    async changeAutoClean(checked) {
      this.autoCleanFileLoading = true;
      try {
        await updateOption({
          option: SYSTEM_OPTION_KEY.ENABLE_AUTO_CLEAN_FILE.value,
          value: checked,
        });
        this.autoCleanFile = checked;
        this.$message.success("已保存");
      } catch (e) {
        this.autoCleanFile = !checked;
        this.$message.error("保存失败");
      } finally {
        this.autoCleanFileLoading = false;
      }
    },
    clear(type) {
      this.$confirm(
        "确认后会清理超过清理阈值的所有文件, 请先确认数据是否已备份, 清理后数据无法回滚!",
        "确认清理",
        {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          confirmButtonClass: "el-button--danger",
          type: "warning",
        }
      )
        .then(async () => {
          this.$set(this.visibleClean, type.key, false);
          const pending = this.$message({
            message: `正在提交 ${type.label} 清理任务...`,
            duration: 0,
          });
          try {
            await cleanSystemFile({ cleanType: type.value });
            pending.close();
            this.$message.success(
              `正在清理 ${type.label}, 清理完成后需要手动点击重新分析`
            );
          } catch (e) {
            pending.close();
            this.$set(this.visibleClean, type.key, true);
          }
        })
        .catch(() => {});
    },
    async reAnalysis() {
      this.reAnalysisLoading = true;
      try {
        await reAnalysisSystem();
        Object.keys(this.visibleClean).forEach((key) => {
          this.$set(this.visibleClean, key, true);
        });
        await this.loadData();
      } catch (e) {
        this.$message.error("重新分析失败");
      } finally {
        this.reAnalysisLoading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.clean-form /deep/ .el-form-item {
  margin-bottom: 0;
}
.clean-threshold-input {
  width: 160px;
}
.extra {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 1.4;
  margin-top: 8px;
}

.stat-tile {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: @radius-base;
  padding: @space-md;
  background: var(--cm-bg-card, @bg-card);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }

  &__clean {
    padding: 0;
  }

  &__count {
    font-size: 22px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin-top: @space-sm;
  }

  &__size {
    font-size: 12px;
    color: #1890ff;
    margin-top: @space-xs;
  }
}
</style>
