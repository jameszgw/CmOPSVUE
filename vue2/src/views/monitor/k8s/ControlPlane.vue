<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="API Server" icon="el-icon-cpu">
          <template #extra>
            <el-tag size="small" :color="statusColor(apiserver.health)"
              effect="dark" class="status-tag">{{ apiserver.health || "-" }}</el-tag>
          </template>
          <InfoTable :rows="apiserverRows" />
        </SectionCard>
      </el-col>

      <el-col :xs="24" :lg="12">
        <SectionCard title="etcd" icon="el-icon-coin">
          <template #extra>
            <el-tag size="small" :color="statusColor(etcd.health)"
              effect="dark" class="status-tag">{{ etcd.health || "-" }}</el-tag>
          </template>
          <InfoTable :rows="etcdRows" />
          <div class="bar-block">
            <div class="bar-block__head">
              <span class="bar-block__title">DB 容量使用率</span>
              <span class="bar-block__val">{{ num(etcd.dbSizeUsagePct) }}%</span>
            </div>
            <el-progress :percentage="clamp(etcd.dbSizeUsagePct)" :stroke-width="12"
              :color="usageColor(etcd.dbSizeUsagePct)" :show-text="false" />
          </div>
        </SectionCard>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="Scheduler" icon="el-icon-set-up">
          <template #extra>
            <el-tag size="small" :color="statusColor(scheduler.health)"
              effect="dark" class="status-tag">{{ scheduler.health || "-" }}</el-tag>
          </template>
          <InfoTable :rows="schedulerRows" />
        </SectionCard>
      </el-col>

      <el-col :xs="24" :lg="12">
        <SectionCard title="Controller Manager" icon="el-icon-s-operation">
          <template #extra>
            <el-tag size="small" :color="statusColor(controllerManager.health)"
              effect="dark" class="status-tag">{{ controllerManager.health || "-" }}</el-tag>
          </template>
          <InfoTable :rows="controllerManagerRows" />
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sControlPlane } from "@/api/monitor-k8s";

export default {
  name: "K8sControlPlane",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    apiserver() {
      return this.d.apiserver || {};
    },
    etcd() {
      return this.d.etcd || {};
    },
    scheduler() {
      return this.d.scheduler || {};
    },
    controllerManager() {
      return this.d.controllerManager || {};
    },
    apiserverRows() {
      const a = this.apiserver;
      return [
        { label: "P50 延迟", value: `${this.num(a.latencyP50)} ms` },
        { label: "P99 延迟", value: `${this.num(a.latencyP99)} ms` },
        { label: "QPS", value: this.num(a.qps) },
        { label: "错误率", value: `${this.num(a.errorRate)}%`, color: this.rateColor(a.errorRate) },
        { label: "处理中请求", value: a.inflightRequests == null ? "-" : a.inflightRequests },
      ];
    },
    etcdRows() {
      const e = this.etcd;
      return [
        { label: "是否有 Leader", value: e.hasLeader ? "是" : "否",
          color: e.hasLeader ? "#67c23a" : "#f56c6c" },
        { label: "DB 大小", value: e.dbSize == null ? "-" : e.dbSize },
        { label: "fsync P99", value: `${this.num(e.fsyncP99)} ms` },
        { label: "commit P99", value: `${this.num(e.commitP99)} ms` },
        { label: "Leader 切换次数", value: e.leaderChanges == null ? "-" : e.leaderChanges },
      ];
    },
    schedulerRows() {
      const s = this.scheduler;
      return [
        { label: "调度延迟 P99", value: `${this.num(s.schedulingLatencyP99)} ms` },
        { label: "Pending Pod", value: s.pendingPods == null ? "-" : s.pendingPods },
        { label: "调度速率", value: this.num(s.scheduleRate) },
      ];
    },
    controllerManagerRows() {
      const c = this.controllerManager;
      return [
        { label: "工作队列深度", value: c.workqueueDepth == null ? "-" : c.workqueueDepth },
        { label: "队列延迟 P99", value: `${this.num(c.workqueueLatencyP99)} ms` },
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
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    statusColor(s) {
      if (s === "Healthy" || s === "Bound" || s === "Normal") return "#67c23a";
      if (s === "Warning" || s === "Pending") return "#e6a23c";
      if (s === "Unhealthy" || s === "Failed") return "#f56c6c";
      return "#909399";
    },
    usageColor(v) {
      const n = Number(v) || 0;
      return n >= 90 ? "#f56c6c" : n >= 70 ? "#e6a23c" : "#67c23a";
    },
    rateColor(v) {
      const n = Number(v) || 0;
      return n >= 5 ? "#f56c6c" : n >= 1 ? "#e6a23c" : "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getK8sControlPlane(this.deviceId);
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
.tab-pane {
  /deep/ .status-tag {
    border: none;
    color: var(--cm-bg-card, @bg-card);
  }
}
.bar-block {
  margin-top: 16px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__title {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__val {
    margin-left: auto;
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
}
</style>
