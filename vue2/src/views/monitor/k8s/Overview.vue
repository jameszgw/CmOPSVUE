<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-cpu" label="节点" :value="`${num0(d.nodeReady)} / ${num0(d.nodeTotal)}`"
          :sub="`就绪 ${num0(d.nodeReady)} / 未就绪 ${num0(d.nodeNotReady)}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-box" label="Pod" :value="num0(d.podRunning)"
          :sub="`Pending ${num0(d.podPending)} / Failed ${num0(d.podFailed)}`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-data-line" label="CPU 使用率" :value="`${num1(cpu.usedPct)}%`"
          :percent="cpu.usedPct" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="内存使用率" :value="`${num1(memory.usedPct)}%`"
          :percent="memory.usedPct" color="#909399" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="集群基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="工作负载汇总" icon="el-icon-s-grid">
          <el-row :gutter="12">
            <el-col v-for="(w, i) in workloadCards" :key="i" :xs="12" :sm="6">
              <div class="count-card">
                <div class="count-card__value" :style="{ color: w.color }">{{ w.value }}</div>
                <div class="count-card__label">{{ w.label }}</div>
              </div>
            </el-col>
          </el-row>
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="控制平面健康" icon="el-icon-set-up">
      <el-row :gutter="12">
        <el-col v-for="(c, i) in controlPlaneItems" :key="i" :xs="12" :sm="6">
          <div class="cp-card">
            <span class="cp-card__name">{{ c.label }}</span>
            <el-tag size="small" effect="dark" :color="statusColor(c.value)" style="border:none">{{ c.value }}</el-tag>
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <SectionCard title="CPU / 内存 请求 vs 使用" icon="el-icon-odometer">
      <div class="bar-row">
        <span class="bar-row__label">CPU 请求</span>
        <el-progress :percentage="clamp(cpu.requestedPct)" :stroke-width="14" :text-inside="true" color="#409eff" />
      </div>
      <div class="bar-row">
        <span class="bar-row__label">CPU 使用</span>
        <el-progress :percentage="clamp(cpu.usedPct)" :stroke-width="14" :text-inside="true" color="#e6a23c" />
      </div>
      <div class="bar-row">
        <span class="bar-row__label">内存 请求</span>
        <el-progress :percentage="clamp(memory.requestedPct)" :stroke-width="14" :text-inside="true" color="#67c23a" />
      </div>
      <div class="bar-row">
        <span class="bar-row__label">内存 使用</span>
        <el-progress :percentage="clamp(memory.usedPct)" :stroke-width="14" :text-inside="true" color="#909399" />
      </div>
    </SectionCard>

    <SectionCard title="Top 节点" icon="el-icon-s-data">
      <el-table :data="d.topNodes || []" size="small" stripe>
        <el-table-column prop="name" label="节点名称" min-width="160" />
        <el-table-column label="CPU 使用率" min-width="220">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12" :text-inside="true" color="#e6a23c" />
          </template>
        </el-table-column>
        <el-table-column label="内存使用率" min-width="220">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.memPct)" :stroke-width="12" :text-inside="true" color="#67c23a" />
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!(d.topNodes && d.topNodes.length)" description="暂无节点数据" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sOverview } from "@/api/monitor-k8s";

const STATUS_COLORS = {
  Ready: "#67c23a", Healthy: "#67c23a", Bound: "#67c23a", Running: "#67c23a",
  Warning: "#e6a23c", Pending: "#e6a23c",
  NotReady: "#f56c6c", Failed: "#f56c6c", CrashLoopBackOff: "#f56c6c", Unhealthy: "#f56c6c",
};

export default {
  name: "K8sOverview",
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
    cpu() {
      return this.d.cpu || {};
    },
    memory() {
      return this.d.memory || {};
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "集群名称", value: this.val(d.clusterName) },
        { label: "版本", value: this.val(d.version) },
        { label: "发行版", value: this.val(d.distro) },
        { label: "运行时", value: this.val(d.runtime) },
        { label: "CNI", value: this.val(d.cni) },
        { label: "apiServer", value: this.val(d.apiServer) },
        { label: "命名空间数", value: this.val(d.namespaceCount) },
        { label: "Service 数", value: this.val(d.serviceCount) },
      ];
    },
    workloadCards() {
      const d = this.d;
      return [
        { label: "Deployment", value: this.val(d.deploymentCount), color: "#409eff" },
        { label: "StatefulSet", value: this.val(d.statefulSetCount), color: "#67c23a" },
        { label: "DaemonSet", value: this.val(d.daemonSetCount), color: "#e6a23c" },
        { label: "Service", value: this.val(d.serviceCount), color: "#909399" },
      ];
    },
    controlPlaneItems() {
      const c = this.d.controlPlane || {};
      return [
        { label: "API Server", value: this.val(c.apiserver) },
        { label: "etcd", value: this.val(c.etcd) },
        { label: "Scheduler", value: this.val(c.scheduler) },
        { label: "Controller Manager", value: this.val(c.controllerManager) },
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
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getK8sOverview(this.deviceId);
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
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
.cp-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  &__name {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
}
.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  &__label {
    width: 80px;
    flex-shrink: 0;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  /deep/ .el-progress {
    flex: 1;
  }
}
</style>
