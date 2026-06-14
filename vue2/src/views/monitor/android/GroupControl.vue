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
import { getAndroidGroupControl } from "@/api/monitor-android";

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
    return { loading: false, d: {} };
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
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.sim-alert {
  margin-bottom: 12px;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
