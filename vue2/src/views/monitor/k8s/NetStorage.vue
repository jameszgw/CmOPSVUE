<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-connection" label="CNI 丢包率"
        :value="`${num(network.packetLossPct)}%`"
        :color="rateColor(network.packetLossPct)" />
      <stat-card dense icon="el-icon-picture-outline" label="镜像拉取失败率"
        :value="`${num(imagePull.failureRatePct)}%`"
        :color="rateColor(imagePull.failureRatePct)" />
      <stat-card dense icon="el-icon-files" label="PV"
        :value="`${val(storage.pvBound)} / ${val(storage.pvTotal)}`"
        sub="已绑定 / 总数" color="#409eff" />
      <stat-card dense icon="el-icon-folder-opened" label="PVC"
        :value="`${val(storage.pvcBound)} / ${val(storage.pvcTotal)}`"
        sub="已绑定 / 总数" color="#67c23a" />
    </card-grid>

    <card-grid min="320px" gap="8px" class="sub-grid">
      <section-card dense title="网络" icon="el-icon-connection">
        <InfoTable :rows="networkRows" />
      </section-card>
      <section-card dense title="镜像拉取" icon="el-icon-picture-outline">
        <InfoTable :rows="imagePullRows" />
      </section-card>
      <section-card dense title="存储概况" icon="el-icon-files">
        <InfoTable :rows="storageRows" :columns="2" />
      </section-card>
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="卷列表" icon="el-icon-folder">
      <el-table :data="storage.volumes || []" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="namespace" label="命名空间" width="140" />
        <el-table-column label="状态" width="110">
          <template slot-scope="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark"
              class="status-tag">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" width="110" />
        <el-table-column prop="storageClass" label="存储类" min-width="140" />
        <el-table-column label="延迟" width="110">
          <template slot-scope="{ row }">{{ num(row.latencyMs) }} ms</template>
        </el-table-column>
      </el-table>
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sNetStorage } from "@/api/monitor-k8s";

export default {
  name: "K8sNetStorage",
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
    network() {
      return this.d.network || {};
    },
    imagePull() {
      return this.d.imagePull || {};
    },
    storage() {
      return this.d.storage || {};
    },
    networkRows() {
      const n = this.network;
      return [
        { label: "CNI 插件", value: n.cniPlugin || "-" },
        { label: "CNI 健康", value: n.cniHealth || "-", color: this.statusColor(n.cniHealth) },
        { label: "丢包率", value: `${this.num(n.packetLossPct)}%`, color: this.rateColor(n.packetLossPct) },
        { label: "Pod 网络延迟", value: `${this.num(n.podNetworkLatencyMs)} ms` },
        { label: "Service 数", value: n.serviceCount == null ? "-" : n.serviceCount },
        { label: "Endpoint 数", value: n.endpointCount == null ? "-" : n.endpointCount },
        { label: "NetworkPolicy", value: n.networkPolicies == null ? "-" : n.networkPolicies },
      ];
    },
    imagePullRows() {
      const i = this.imagePull;
      return [
        { label: "失败率", value: `${this.num(i.failureRatePct)}%`, color: this.rateColor(i.failureRatePct) },
        { label: "平均拉取耗时", value: `${this.num(i.avgPullSec)} s` },
        { label: "拉取总次数", value: i.totalPulls == null ? "-" : i.totalPulls },
        { label: "失败次数", value: i.failedPulls == null ? "-" : i.failedPulls },
      ];
    },
    storageRows() {
      const s = this.storage;
      return [
        { label: "CSI 驱动", value: s.csiDriver || "-" },
        { label: "卷挂载延迟", value: `${this.num(s.volumeAttachLatencyMs)} ms` },
        { label: "PV 总数", value: s.pvTotal == null ? "-" : s.pvTotal },
        { label: "PV 已绑定", value: s.pvBound == null ? "-" : s.pvBound, color: "#67c23a" },
        { label: "PV 可用", value: s.pvAvailable == null ? "-" : s.pvAvailable },
        { label: "PVC 总数", value: s.pvcTotal == null ? "-" : s.pvcTotal },
        { label: "PVC 已绑定", value: s.pvcBound == null ? "-" : s.pvcBound, color: "#67c23a" },
        { label: "PVC Pending", value: s.pvcPending == null ? "-" : s.pvcPending, color: "#e6a23c" },
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
    val(v) {
      return v === undefined || v === null ? "-" : v;
    },
    statusColor(s) {
      if (s === "Healthy" || s === "Bound" || s === "Normal") return "#67c23a";
      if (s === "Warning" || s === "Pending") return "#e6a23c";
      if (s === "Unhealthy" || s === "Failed") return "#f56c6c";
      return "#909399";
    },
    rateColor(v) {
      const n = Number(v) || 0;
      return n >= 5 ? "#f56c6c" : n >= 1 ? "#e6a23c" : "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getK8sNetStorage(this.deviceId);
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
  /deep/ .status-tag {
    border: none;
    color: var(--cm-bg-card, @bg-card);
  }
}
.kpi-grid,
.sub-grid {
  flex-shrink: 0;
}
</style>
