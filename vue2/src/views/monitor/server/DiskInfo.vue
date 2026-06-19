<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '暂无数据'" :image-size="120" />
    <template v-else>
    <CardGrid min="180px" gap="8px" class="kpi-row">
      <StatCard dense icon="el-icon-download" label="读取速度" :value="d.readSpeed || '-'"
        sub="当前读取速度" color="#409eff" />
      <StatCard dense icon="el-icon-upload2" label="写入速度" :value="d.writeSpeed || '-'"
        sub="当前写入速度" color="#67c23a" />
      <StatCard dense icon="el-icon-coin" label="总容量" :value="d.totalCapacity || '-'"
        sub="磁盘总容量" color="#e6a23c" />
      <StatCard dense icon="el-icon-files" label="总写入" :value="d.totalWritten || '-'"
        sub="累计写入数据" color="#909399" />
      <StatCard dense icon="el-icon-timer" label="磁盘最大await" :value="maxAwait"
        sub="分区最大IO等待时延" color="#e6a23c" />
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="section-grid">
      <SectionCard v-for="(p, i) in partitions" :key="i" dense :title="p.mount || p.device || '分区'" icon="el-icon-folder-opened">
        <template #extra>
          <el-tag v-if="i === 0" size="mini" :type="isRealSource ? 'success' : 'info'" style="margin-right: 6px">
            获取方式：{{ d.collectViaLabel || "-" }} · 来源：{{ d.sourceLabel || "-" }}
          </el-tag>
          {{ p.used || '-' }} / {{ p.total || '-' }} · {{ num(p.usage) }}%
        </template>
        <div class="part-sub">磁盘空间</div>
        <el-progress :percentage="clamp(p.usage)" :stroke-width="10"
          :color="usageColor(p.usage)" class="block-progress" />
        <template v-if="p.inodeUsage != null">
          <div class="part-sub">inode 使用率</div>
          <el-progress :percentage="clamp(p.inodeUsage)" :stroke-width="10"
            :color="usageColor(p.inodeUsage)" class="block-progress" />
        </template>
        <InfoTable :rows="partitionRows(p)" :columns="2" />
      </SectionCard>

      <SectionCard dense title="读取统计" icon="el-icon-download">
        <InfoTable :rows="readRows" />
      </SectionCard>
      <SectionCard dense title="写入统计" icon="el-icon-upload2">
        <InfoTable :rows="writeRows" />
      </SectionCard>

      <SectionCard dense title="实时磁盘IO" icon="el-icon-time">
        <div class="rt-grid">
          <div class="rt-item">
            <div class="rt-item__label">读取速度</div>
            <div class="rt-item__value" style="color: #409eff">{{ realtimeRead }}</div>
            <div class="rt-item__sub">当前读取速度</div>
          </div>
          <div class="rt-item">
            <div class="rt-item__label">写入速度</div>
            <div class="rt-item__value" style="color: #67c23a">{{ realtimeWrite }}</div>
            <div class="rt-item__sub">当前写入速度</div>
          </div>
        </div>
      </SectionCard>
    </CardGrid>
    </template>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerDisk } from "@/api/monitor-server";

export default {
  name: "ServerDiskInfo",
  components: { StatCard, SectionCard, InfoTable, CardGrid },
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
    maxAwait() {
      const v = this.d.maxAwait;
      return v == null ? "-" : `${v} ms`;
    },
    readRows() {
      const r = (this.d.ioStats && this.d.ioStats.read) || {};
      return [
        { label: "读取速度", value: this.d.readSpeed, color: "#409eff" },
        { label: "读取次数", value: this.fmt(r.count) },
        { label: "读取字节", value: r.bytes },
        { label: "读取耗时", value: r.time },
        { label: "读 await", value: r.await == null ? "-" : `${r.await} ms`, color: "#e6a23c" },
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
        { label: "写 await", value: w.await == null ? "-" : `${w.await} ms`, color: "#e6a23c" },
      ];
    },
    realtimeRead() {
      return (this.d.realtime && this.d.realtime.readSpeed) || "-";
    },
    realtimeWrite() {
      return (this.d.realtime && this.d.realtime.writeSpeed) || "-";
    },
    isRealSource() {
      return !["simulated", "none"].includes(this.d.source);
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
      const has = (v) => v !== undefined && v !== null;
      const rows = [
        { label: "设备", value: p.device },
        { label: "挂载点", value: p.mount },
        { label: "文件系统", value: p.fs },
        { label: "使用率", value: `${this.num(p.usage)}%`, color: "#67c23a" },
        { label: "总容量", value: p.total },
        { label: "已使用", value: p.used, color: "#e6a23c" },
        { label: "可用空间", value: p.free, color: "#67c23a" },
      ];
      // 真实采集分区可能缺失以下模拟字段，缺失则不展示对应行
      if (has(p.inodeUsage)) {
        rows.push({ label: "inode 使用率", value: `${this.num(p.inodeUsage)}%`, color: "#67c23a" });
      }
      if (has(p.inodeTotal)) {
        rows.push({ label: "inode 总数", value: this.fmt(p.inodeTotal) });
      }
      if (has(p.await)) {
        rows.push({
          label: "await",
          value: `${p.await} ms`,
          color: p.slow ? "#f56c6c" : "#303133",
          tag: p.slow ? "慢盘" : "",
        });
      }
      if (has(p.avgQueue)) {
        rows.push({ label: "平均队列", value: p.avgQueue });
      }
      if (has(p.util)) {
        rows.push({ label: "利用率", value: `${this.num(p.util)}%`, color: "#e6a23c" });
      }
      return rows;
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
@import (reference) "@/styles/variables.less";
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kpi-row {
  flex-shrink: 0;
  margin-bottom: @dense-gap;
}
.section-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  align-content: start;
}
.part-sub {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
  margin-bottom: 6px;
}
.block-progress {
  margin-bottom: 10px;
}
.rt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: @space-sm;
}
.rt-item {
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  padding: 10px 12px;

  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 20px;
    font-weight: 600;
  }
  &__sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
</style>
