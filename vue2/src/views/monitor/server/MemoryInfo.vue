<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="总内存" :value="d.total || '-'"
          sub="物理内存总量" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-pie-chart" label="已使用" :value="d.used || '-'"
          :sub="`占总内存 ${num(d.usage)}%`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-files" label="可用内存" :value="d.available || '-'"
          sub="可立即使用" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="内存使用率" :value="`${num(d.usage)}%`"
          :percent="d.usage" color="#409eff" />
      </el-col>
    </el-row>

    <SectionCard title="虚拟内存 (RAM)" icon="el-icon-coin">
      <template #extra>内存使用进度 {{ num(ramUsage) }}%</template>
      <el-progress :percentage="clamp(ramUsage)" :stroke-width="12"
        :color="usageColor(ramUsage)" class="block-progress" />
      <InfoTable :rows="ramRows" :columns="2" />
    </SectionCard>

    <SectionCard title="交换分区 (Swap)" icon="el-icon-set-up">
      <template #extra>交换分区使用进度 {{ num(swapUsage) }}%</template>
      <el-progress :percentage="clamp(swapUsage)" :stroke-width="12"
        :color="usageColor(swapUsage)" class="block-progress" />
      <InfoTable :rows="swapRows" :columns="2" />
    </SectionCard>

    <SectionCard title="内存分布" icon="el-icon-data-analysis">
      <el-row :gutter="12">
        <el-col v-for="item in distribution" :key="item.key" :xs="24" :sm="12" :lg="8">
          <div class="dist-item">
            <div class="dist-item__head">
              <span class="dist-item__label">{{ item.label }}</span>
              <span class="dist-item__pct">{{ num(item.pct) }}%</span>
            </div>
            <div class="dist-item__value">{{ item.value }}</div>
            <el-progress :percentage="clamp(item.pct)" :stroke-width="8"
              :color="item.color" :show-text="false" />
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <SectionCard title="实时内存详情" icon="el-icon-time">
      <InfoTable :rows="realtimeRows" :columns="4" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getServerMemory } from "@/api/monitor-server";

export default {
  name: "ServerMemoryInfo",
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
    ramUsage() {
      const r = this.d.ram || {};
      return r.usage != null ? r.usage : this.d.usage;
    },
    swapUsage() {
      return (this.d.swap && this.d.swap.usage) || 0;
    },
    ramRows() {
      const r = this.d.ram || {};
      return [
        { label: "总内存", value: r.total },
        { label: "可用内存", value: r.available, color: "#409eff" },
        { label: "已使用", value: r.used, color: "#e6a23c" },
        { label: "空闲内存", value: r.free },
        { label: "缓存内存", value: r.cached },
        { label: "缓冲内存", value: r.buffers },
        { label: "共享内存", value: r.shared },
        { label: "内存使用率", value: `${this.num(r.usage)}%`, color: "#67c23a" },
      ];
    },
    swapRows() {
      const s = this.d.swap || {};
      return [
        { label: "交换分区总量", value: s.total },
        { label: "已使用", value: s.used, color: "#e6a23c" },
        { label: "可用交换分区", value: s.free, color: "#67c23a" },
        { label: "交换分区使用率", value: `${this.num(s.usage)}%`, color: "#409eff" },
      ];
    },
    distribution() {
      const dist = this.d.distribution || {};
      const items = [
        { key: "used", label: "已使用", value: dist.used, color: "#e6a23c" },
        { key: "cached", label: "缓存", value: dist.cached, color: "#909399" },
        { key: "buffers", label: "缓冲", value: dist.buffers, color: "#409eff" },
        { key: "free", label: "空闲内存", value: dist.free, color: "#67c23a" },
        { key: "shared", label: "共享内存", value: dist.shared, color: "#9254de" },
        { key: "available", label: "可用内存", value: dist.available, color: "#13c2c2" },
      ];
      const total = this.parseSize(this.d.total) || this.parseSize((this.d.ram || {}).total);
      return items.map((it) => ({
        ...it,
        pct: total ? (this.parseSize(it.value) / total) * 100 : 0,
      }));
    },
    realtimeRows() {
      const rt = this.d.realtime || {};
      return [
        { label: "总内存", value: rt.total },
        { label: "可用内存", value: rt.available },
        { label: "缓存", value: rt.cached },
        { label: "空闲内存", value: rt.free },
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
    usageColor(v) {
      return v > 80 ? "#f56c6c" : v > 50 ? "#e6a23c" : "#409eff";
    },
    parseSize(v) {
      if (v == null) return 0;
      const m = String(v).match(/([\d.]+)\s*([KMGT]?B)?/i);
      if (!m) return 0;
      const n = parseFloat(m[1]) || 0;
      const unit = (m[2] || "B").toUpperCase();
      const mul = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
      return n * (mul[unit] || 1);
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerMemory(this.deviceId);
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
.block-progress {
  margin-bottom: 16px;
}
.dist-item {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  &__label {
    font-size: 12px;
    color: #909399;
  }
  &__pct {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
  }
  &__value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }
}
</style>
