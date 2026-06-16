<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-mobile-phone" label="实例总数"
          :value="num0(d.instanceTotal)" :sub="`容量上限 ${num0(d.instanceCap)}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-success" label="在线实例"
          :value="num0(d.online)" :sub="`离线 ${num0(d.offline)}`" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="多开密度"
          :value="`${num1(d.densityPct)}%`" :percent="d.densityPct" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-video-camera" label="平均 FPS"
          :value="num1(d.avgFps)" :sub="`单实例 CPU ${num1(d.avgCpuPerInst)}%`" color="#f56c6c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
            <el-tag size="mini" :type="statusTag" effect="dark">{{ val(d.status) }}</el-tag>
          </template>
          <InfoTable :rows="basicRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="宿主资源" icon="el-icon-monitor">
          <div v-for="it in hostItems" :key="it.key" class="host-item">
            <div class="host-item__head">
              <span class="host-item__label">{{ it.label }}</span>
              <span class="host-item__val">{{ num1(it.value) }}%</span>
            </div>
            <el-progress :percentage="clamp(it.value)" :stroke-width="10" :color="it.color" :show-text="false" />
          </div>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getAndroidOverview } from "@/api/monitor-android";

const STATUS_TAG = {
  Online: "success", Healthy: "success", Normal: "success", Running: "success",
  Warning: "warning", Degraded: "warning",
  Offline: "danger", Unhealthy: "danger", Failed: "danger",
};

export default {
  name: "AndroidOverview",
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
    statusTag() {
      return STATUS_TAG[this.d.status] || "info";
    },
    hostItems() {
      const d = this.d;
      return [
        { key: "cpu", label: "宿主 CPU", value: d.hostCpuPct, color: "#409eff" },
        { key: "mem", label: "宿主内存", value: d.hostMemPct, color: "#67c23a" },
        { key: "gpu", label: "宿主 GPU", value: d.hostGpuPct, color: "#e6a23c" },
      ];
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "系统类型", value: this.val(d.androidType) },
        { label: "安卓版本", value: this.val(d.androidVersion) },
        { label: "实例容量", value: this.num0(d.instanceCap) },
        { label: "宿主 CPU", value: this.pct(d.hostCpuPct) },
        { label: "宿主内存", value: this.pct(d.hostMemPct) },
        { label: "宿主 GPU", value: this.pct(d.hostGpuPct) },
        { label: "ADB 在线", value: this.num0(d.adbOnline) },
        { label: "ROOT 数", value: this.num0(d.rootedCount) },
        { label: "上行带宽", value: this.unit(d.netUpMbps, "Mbps", 1) },
        { label: "下行带宽", value: this.unit(d.netDownMbps, "Mbps", 1) },
        { label: "单实例内存", value: this.unit(d.avgMemPerInstMb, "MB") },
        { label: "平均电量", value: this.battery(d.batteryAvgPct) },
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
    pct(v) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)}%`;
    },
    unit(v, u, p = 0) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(p)} ${u}`;
    },
    battery(v) {
      if (v === undefined || v === null || v === "" || v === "NA") return "NA";
      const n = Number(v);
      return Number.isNaN(n) ? this.val(v) : `${n.toFixed(0)}%`;
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getAndroidOverview(this.deviceId);
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
.host-item {
  margin-bottom: 16px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__label {
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
