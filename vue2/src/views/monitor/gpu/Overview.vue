<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-cpu" label="GPU"
          :value="`${num0(d.gpuActive)} / ${num0(d.gpuTotal)}`"
          :sub="`激活 ${num0(d.gpuActive)} / 总数 ${num0(d.gpuTotal)}`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="平均利用率"
          :value="`${num1(d.avgUtilization)}%`" :percent="d.avgUtilization" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="显存使用率"
          :value="`${num1(d.avgMemUsage)}%`" :percent="d.avgMemUsage" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-warning-outline" label="最高温度"
          :value="`${num0(d.maxTemperature)}℃`" :sub="`总功耗 ${num0(d.totalPower)} W`" color="#f56c6c" />
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" :columns="2" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="任务" icon="el-icon-s-operation">
          <el-row :gutter="12">
            <el-col v-for="(j, i) in jobCards" :key="i" :xs="12">
              <div class="count-card">
                <div class="count-card__value" :style="{ color: j.color }">{{ j.value }}</div>
                <div class="count-card__label">{{ j.label }}</div>
              </div>
            </el-col>
          </el-row>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getGpuOverview } from "@/api/monitor-gpu";

const STATUS_COLORS = {
  Healthy: "#67c23a", Ready: "#67c23a", Normal: "#67c23a", Online: "#67c23a",
  Warning: "#e6a23c", Degraded: "#e6a23c",
  Unhealthy: "#f56c6c", Failed: "#f56c6c", Offline: "#f56c6c",
};

export default {
  name: "GpuOverview",
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
    basicRows() {
      const d = this.d;
      return [
        { label: "厂商", value: this.val(d.vendor) },
        { label: "型号", value: this.val(d.model) },
        { label: "驱动版本", value: this.val(d.driverVersion) },
        { label: "CUDA 版本", value: this.val(d.cudaVersion) },
        { label: "总功耗", value: this.unit(d.totalPower, "W") },
        { label: "ECC 错误", value: this.num0(d.eccErrors) },
        { label: "总显存", value: this.val(d.totalMemory) },
        { label: "已用显存", value: this.val(d.usedMemory) },
        { label: "健康状态", value: this.val(d.health), color: this.statusColor(d.health) },
      ];
    },
    jobCards() {
      const d = this.d;
      return [
        { label: "运行中任务", value: this.num0(d.runningJobs), color: "#67c23a" },
        { label: "等待中任务", value: this.num0(d.pendingJobs), color: "#e6a23c" },
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
    unit(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(0)} ${u}`;
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getGpuOverview(this.deviceId);
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
</style>
