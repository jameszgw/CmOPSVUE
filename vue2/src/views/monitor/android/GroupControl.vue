<template>
  <div v-loading="loading" class="tab-pane">
    <el-alert
      title="群控批量为模拟结果"
      type="warning"
      :closable="false"
      show-icon
      class="sim-alert"
    >
      <template #default>
        {{ d.note || "以下群控任务为演示数据，仅用于界面展示。" }}
      </template>
    </el-alert>

    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-set-up" label="运行中任务"
          :value="num0(d.runningTasks)" sub="进行中的群控任务" color="#409eff" />
      </el-col>
    </el-row>

    <SectionCard title="下发批量任务" icon="el-icon-position" class="dispatch-card">
      <el-form inline class="dispatch-form" @submit.native.prevent>
        <el-form-item label="任务类型">
          <el-select v-model="form.taskType" size="small" style="width: 150px">
            <el-option label="批量安装APK" value="install" />
            <el-option label="批量重启" value="reboot" />
            <el-option label="Shell命令" value="shell" />
            <el-option label="清理缓存" value="clearcache" />
          </el-select>
        </el-form-item>
        <el-form-item label="作用范围">
          <el-input v-model="form.scope" size="small" style="width: 220px"
            placeholder="作用范围，如 在线实例 / 全部 / 标签:电商" />
        </el-form-item>
        <el-form-item v-if="form.taskType === 'install'" label="APK 路径">
          <el-input v-model="form.payload" size="small" style="width: 240px"
            placeholder="APK 本地路径，如 /data/app.apk" />
        </el-form-item>
        <el-form-item v-else-if="form.taskType === 'shell'" label="命令">
          <el-input v-model="form.payload" size="small" style="width: 240px"
            placeholder="shell 命令，如 input keyevent 3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" :loading="submitting" @click="onDispatch">下发</el-button>
        </el-form-item>
      </el-form>
    </SectionCard>

    <SectionCard title="群控任务" icon="el-icon-set-up">
      <template #extra>共 {{ items.length }} 个任务</template>
      <el-table :data="items" size="small" stripe>
        <el-table-column prop="name" label="任务名称" min-width="160" />
        <el-table-column prop="scope" label="范围" min-width="140">
          <template slot-scope="{ row }">{{ val(row.scope) }}</template>
        </el-table-column>
        <el-table-column label="进度" min-width="180">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.progressPct)" :stroke-width="12" :text-inside="true" color="#67c23a" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusTag(row.status)" effect="dark">{{ val(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="影响实例" width="100" align="center">
          <template slot-scope="{ row }">{{ num0(row.affected) }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="创建时间" min-width="160">
          <template slot-scope="{ row }">{{ val(row.gmtCreate) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!items.length" description="暂无群控任务" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAndroidGroupControl, dispatchGroupControl } from "@/api/monitor-android";

const STATUS_TAG = {
  Running: "primary", Pending: "warning", Queued: "warning",
  Done: "success", Success: "success", Completed: "success",
  Failed: "danger", Error: "danger", Canceled: "info",
};

export default {
  name: "AndroidGroupControl",
  components: { StatCard, SectionCard },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return {
      loading: false,
      submitting: false,
      d: {},
      form: { taskType: "install", scope: "", payload: "" },
    };
  },
  computed: {
    items() {
      return this.d.items || [];
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    statusTag(s) {
      return STATUS_TAG[s] || "info";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getAndroidGroupControl(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
    async onDispatch() {
      if (!this.deviceId) {
        this.$message.warning("缺少设备ID，无法下发");
        return;
      }
      this.submitting = true;
      try {
        const res = await dispatchGroupControl({
          deviceId: this.deviceId,
          taskType: this.form.taskType,
          scope: this.form.scope,
          payload: this.form.payload,
        });
        const c = (res && res.content) || {};
        if (c.source === "agent") {
          this.$message.success(
            `已真实下发：影响 ${c.affected == null ? 0 : c.affected} 台，成功 ${
              c.okCount == null ? 0 : c.okCount
            }，失败 ${c.failCount == null ? 0 : c.failCount}`
          );
        } else {
          this.$message.success(`已受理(模拟)：${c.note || c.taskId || "-"}`);
        }
        await this.load();
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.sim-alert {
  margin-bottom: 12px;
}
.dispatch-card {
  margin-bottom: 12px;
}
.dispatch-form ::v-deep .el-form-item {
  margin-bottom: 0;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
