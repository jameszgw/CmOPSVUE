<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-video-play" label="运行中"
        :value="num0(d.running)" sub="Running Pod" color="#67c23a" />
      <stat-card dense icon="el-icon-loading" label="Pending"
        :value="num0(d.pending)" sub="待调度 Pod" color="#e6a23c" />
      <stat-card dense icon="el-icon-circle-close" label="失败"
        :value="num0(d.failed)" sub="Failed Pod" color="#f56c6c" />
      <stat-card dense icon="el-icon-warning-outline" label="CrashLoopBackOff"
        :value="num0(d.crashLoop)" :sub="`OOMKilled ${num0(d.oomKilledTotal)}`" color="#f56c6c" />
    </card-grid>

    <card-grid min="320px" gap="8px" class="sub-grid">
      <section-card dense title="工作负载类型计数" icon="el-icon-s-grid">
        <el-row :gutter="12">
          <el-col v-for="(w, i) in workloadCards" :key="i" :xs="12" :sm="8" :lg="4">
            <div class="count-card">
              <div class="count-card__value" :style="{ color: w.color }">{{ w.value }}</div>
              <div class="count-card__label">{{ w.label }}</div>
            </div>
          </el-col>
        </el-row>
      </section-card>

      <section-card dense title="重启 Top" icon="el-icon-refresh">
        <el-table :data="d.topRestart || []" size="small" stripe class="dense-table">
          <el-table-column prop="name" label="名称" min-width="200" />
          <el-table-column prop="namespace" label="命名空间" width="160" />
          <el-table-column label="重启次数" width="120" align="right">
            <template slot-scope="{ row }">
              <span style="color:#f56c6c">{{ num0(row.restarts) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="170">
            <template slot-scope="{ row }">
              <el-tag size="small" effect="dark" :color="statusColor(row.status)" style="border:none">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!(d.topRestart && d.topRestart.length)" description="暂无重启数据" />
      </section-card>
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="Pod 列表" icon="el-icon-box">
      <template #extra>共 {{ (d.pods && d.pods.length) || 0 }} 个 Pod</template>
      <el-table :data="d.pods || []" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="200" fixed />
        <el-table-column prop="namespace" label="命名空间" width="150" />
        <el-table-column prop="node" label="节点" min-width="150" />
        <el-table-column label="状态" width="170">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="statusColor(row.status)" style="border:none">{{ row.status }}</el-tag>
            <el-tag v-if="row.oomKilled" size="mini" type="danger" effect="dark" class="oom-tag">OOMKilled</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ready" label="就绪" width="80" align="center" />
        <el-table-column label="重启" width="80" align="center">
          <template slot-scope="{ row }">
            <span :style="{ color: Number(row.restarts) > 0 ? '#f56c6c' : '#303133' }">{{ num0(row.restarts) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="cpu" label="CPU" width="100" align="right" />
        <el-table-column prop="mem" label="内存" width="100" align="right" />
        <el-table-column prop="age" label="age" width="100" />
      </el-table>
      <el-empty v-if="!(d.pods && d.pods.length)" description="暂无 Pod 数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sPods } from "@/api/monitor-k8s";

const STATUS_COLORS = {
  Ready: "#67c23a", Healthy: "#67c23a", Bound: "#67c23a", Running: "#67c23a",
  Warning: "#e6a23c", Pending: "#e6a23c",
  NotReady: "#f56c6c", Failed: "#f56c6c", CrashLoopBackOff: "#f56c6c", Unhealthy: "#f56c6c",
};

export default {
  name: "K8sPods",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    workloadCards() {
      const w = this.d.workloads || {};
      return [
        { label: "Deployment", value: this.val(w.deployments), color: "#409eff" },
        { label: "StatefulSet", value: this.val(w.statefulSets), color: "#67c23a" },
        { label: "DaemonSet", value: this.val(w.daemonSets), color: "#e6a23c" },
        { label: "Job", value: this.val(w.jobs), color: "#909399" },
        { label: "CronJob", value: this.val(w.cronJobs), color: "#b88230" },
      ];
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
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getK8sPods(this.deviceId);
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
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: 8px;
}
.kpi-grid,
.sub-grid {
  flex-shrink: 0;
}
.count-card {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 14px 12px;
  text-align: center;
  margin-bottom: 12px;
  &__value {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }
  &__label {
    margin-top: 6px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.oom-tag {
  margin-left: 6px;
}
</style>
