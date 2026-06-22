<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-monitor" label="宿主/节点"
        :value="`${num0(d.hostOnline)} / ${num0(d.hostCount)}`"
        :sub="d.virtLabel || d.virtType || '-'" color="#7265e6" />
      <stat-card dense icon="el-icon-s-grid" :label="`${d.guestLabel || '虚机'}数`"
        :value="num0(d.guestTotal)" :sub="`运行 ${num0(d.guestRunning)} / 停止 ${num0(d.guestStopped)}`" color="#409eff" />
      <stat-card dense icon="el-icon-cpu" label="vCPU 超分"
        :value="`${num2(d.cpuOvercommit)}x`" :sub="`${num0(d.vcpuAllocated)} / ${num0(d.vcpuTotal)} 核`" :color="overColor(d.cpuOvercommit)" />
      <stat-card dense icon="el-icon-coin" label="内存超分"
        :value="`${num2(d.memOvercommit)}x`" :sub="`${num1(d.memAllocatedGb)} / ${num1(d.memTotalGb)} GB`" :color="overColor(d.memOvercommit)" />
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="320px" gap="8px">
        <section-card dense title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="isReal ? 'success' : 'info'">{{ isReal ? sourceLabel : "模拟数据" }}</el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </section-card>
        <section-card dense title="资源用量" icon="el-icon-data-line">
          <InfoTable :rows="resourceRows" />
        </section-card>
        <section-card dense title="负载与容量" icon="el-icon-odometer">
          <div class="bar-row">
            <span class="bar-row__label">宿主 CPU</span>
            <el-progress :percentage="clamp(d.hostCpuPct)" :stroke-width="14" :text-inside="true" :color="pctColor(d.hostCpuPct)" />
          </div>
          <div class="bar-row">
            <span class="bar-row__label">宿主内存</span>
            <el-progress :percentage="clamp(d.hostMemPct)" :stroke-width="14" :text-inside="true" :color="pctColor(d.hostMemPct)" />
          </div>
          <div class="bar-row">
            <span class="bar-row__label">存储使用</span>
            <el-progress :percentage="clamp(d.storageUsedPct)" :stroke-width="14" :text-inside="true" :color="pctColor(d.storageUsedPct)" />
          </div>
        </section-card>
      </card-grid>
    </div>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getVirtOverview } from "@/api/monitor-virt";

const REAL_SOURCES = { vsphere: "真实采集·vCenter", kvm: "真实采集·KVM", docker: "真实采集·Docker" };

export default {
  name: "VirtOverview",
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
    isReal() {
      return Object.keys(REAL_SOURCES).includes(this.d.source);
    },
    sourceLabel() {
      return REAL_SOURCES[this.d.source] || "真实采集";
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "平台", value: this.val(d.virtLabel || d.virtType) },
        { label: "版本", value: this.val(d.version) },
        { label: "地址", value: this.val(d.address) },
        { label: "宿主/节点数", value: this.val(d.hostCount) },
        { label: `${d.guestLabel || "虚机"}总数`, value: this.val(d.guestTotal) },
        { label: "运行/停止", value: `${this.num0(d.guestRunning)} / ${this.num0(d.guestStopped)}` },
        { label: "运行时长", value: this.val(d.uptime) },
      ];
    },
    resourceRows() {
      const d = this.d;
      return [
        { label: "物理核", value: this.val(d.vcpuTotal) },
        { label: "已分配 vCPU", value: this.val(d.vcpuAllocated) },
        { label: "CPU 超分比", value: d.cpuOvercommit != null ? `${d.cpuOvercommit}x` : "-" },
        { label: "内存总量", value: d.memTotalGb != null ? `${d.memTotalGb} GB` : "-" },
        { label: "内存已分配", value: d.memAllocatedGb != null ? `${d.memAllocatedGb} GB` : "-" },
        { label: "存储总量", value: d.storageTotalGb != null ? `${d.storageTotalGb} GB` : "-" },
        { label: "存储已用", value: d.storageUsedGb != null ? `${d.storageUsedGb} GB (${this.val(d.storageUsedPct)}%)` : "-" },
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
    num2(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    overColor(v) {
      const n = Number(v) || 0;
      if (n >= 3) return "#f56c6c";
      if (n >= 2) return "#e6a23c";
      return "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && Object.keys(this.d).length;
      if (!hasData) this.loading = true;
      try {
        const res = await getVirtOverview(this.deviceId);
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
  box-sizing: border-box;
  &__main {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}
.kpi-grid {
  flex-shrink: 0;
}
.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  &__label {
    width: 84px;
    flex-shrink: 0;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  /deep/ .el-progress {
    flex: 1;
  }
}
</style>
