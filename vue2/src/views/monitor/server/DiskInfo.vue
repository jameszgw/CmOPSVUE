<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-download" label="读取速度" :value="d.readSpeed || '-'"
          sub="当前读取速度" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-upload2" label="写入速度" :value="d.writeSpeed || '-'"
          sub="当前写入速度" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="总容量" :value="d.totalCapacity || '-'"
          sub="磁盘总容量" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-files" label="总写入" :value="d.totalWritten || '-'"
          sub="累计写入数据" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard v-for="(p, i) in partitions" :key="i" :title="p.mount || p.device || '分区'" icon="el-icon-folder-opened">
      <template #extra>{{ p.used || '-' }} / {{ p.total || '-' }} · {{ num(p.usage) }}%</template>
      <div class="part-sub">磁盘空间</div>
      <el-progress :percentage="clamp(p.usage)" :stroke-width="12"
        :color="usageColor(p.usage)" class="block-progress" />
      <InfoTable :rows="partitionRows(p)" :columns="2" />
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="读取统计" icon="el-icon-download">
          <InfoTable :rows="readRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="写入统计" icon="el-icon-upload2">
          <InfoTable :rows="writeRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="实时磁盘IO" icon="el-icon-time">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <div class="rt-item">
            <div class="rt-item__label">读取速度</div>
            <div class="rt-item__value" style="color: #409eff">{{ realtimeRead }}</div>
            <div class="rt-item__sub">当前读取速度</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12">
          <div class="rt-item">
            <div class="rt-item__label">写入速度</div>
            <div class="rt-item__value" style="color: #67c23a">{{ realtimeWrite }}</div>
            <div class="rt-item__sub">当前写入速度</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getServerDisk } from "@/api/monitor-server";

export default {
  name: "ServerDiskInfo",
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
    partitions() {
      return this.d.partitions || [];
    },
    readRows() {
      const r = (this.d.ioStats && this.d.ioStats.read) || {};
      return [
        { label: "读取速度", value: this.d.readSpeed, color: "#409eff" },
        { label: "读取次数", value: this.fmt(r.count) },
        { label: "读取字节", value: r.bytes },
        { label: "读取耗时", value: r.time },
      ];
    },
    writeRows() {
      const w = (this.d.ioStats && this.d.ioStats.write) || {};
      return [
        { label: "写入速度", value: this.d.writeSpeed, color: "#67c23a" },
        { label: "总写入", value: this.d.totalWritten },
        { label: "写入次数", value: this.fmt(w.count) },
        { label: "写入字节", value: w.bytes },
        { label: "写入耗时", value: w.time },
      ];
    },
    realtimeRead() {
      return (this.d.realtime && this.d.realtime.readSpeed) || "-";
    },
    realtimeWrite() {
      return (this.d.realtime && this.d.realtime.writeSpeed) || "-";
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
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : (v == null ? "-" : v);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    usageColor(v) {
      return v > 80 ? "#f56c6c" : v > 50 ? "#e6a23c" : "#409eff";
    },
    partitionRows(p) {
      return [
        { label: "设备", value: p.device },
        { label: "挂载点", value: p.mount },
        { label: "文件系统", value: p.fs },
        { label: "使用率", value: `${this.num(p.usage)}%`, color: "#67c23a" },
        { label: "总容量", value: p.total },
        { label: "已使用", value: p.used, color: "#e6a23c" },
        { label: "可用空间", value: p.free, color: "#67c23a" },
      ];
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerDisk(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.part-sub {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.block-progress {
  margin-bottom: 16px;
}
.rt-item {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;

  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
  }
  &__sub {
    margin-top: 6px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
