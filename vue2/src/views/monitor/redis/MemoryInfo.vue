<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-coin" label="内存使用率" :value="`${num(d.usage)}%`"
          :percent="d.usage" :sub="usageSub" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-odometer" label="内存峰值" :value="d.peak || '-'"
          sub="历史最高使用量" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-files" label="内存碎片率" :value="d.fragRatio == null ? '-' : d.fragRatio"
          :tag="fragTag" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard title="内存使用详情" icon="el-icon-coin">
      <InfoTable :rows="detailRows" :columns="2" />
    </SectionCard>

    <SectionCard title="内存策略配置" icon="el-icon-set-up">
      <InfoTable :rows="policyRows" :columns="2" />
      <div class="policy-desc">
        <div class="policy-desc__title"><i class="el-icon-info"></i> 内存淘汰策略说明</div>
        <div class="policy-desc__item"><b>noeviction:</b> 不淘汰，内存满时返回错误</div>
        <div class="policy-desc__item"><b>allkeys-lru:</b> 从所有键中淘汰最近最少使用的键</div>
        <div class="policy-desc__item"><b>volatile-lru:</b> 从设置了过期时间的键中淘汰最近最少使用的键</div>
        <div class="policy-desc__item"><b>allkeys-random:</b> 从所有键中随机淘汰</div>
        <div class="policy-desc__item"><b>volatile-random:</b> 从设置了过期时间的键中随机淘汰</div>
        <div class="policy-desc__item"><b>volatile-ttl:</b> 淘汰即将过期的键（TTL最小）</div>
      </div>
    </SectionCard>

    <SectionCard title="内存使用趋势" icon="el-icon-data-line">
      <template #extra>最近 {{ trendCount }} 个数据点</template>
      <div ref="chartRef" class="trend-chart"></div>
    </SectionCard>
  </div>
</template>

<script>
import * as echarts from "echarts";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisMemory } from "@/api/monitor-redis";

export default {
  name: "RedisMemoryInfo",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, chart: null };
  },
  computed: {
    usageSub() {
      const dt = this.d.detail || {};
      return dt.usedMemory && dt.totalSystemMemory ? `${dt.usedMemory} / ${dt.totalSystemMemory}` : "";
    },
    fragTag() {
      const r = Number(this.d.fragRatio);
      if (!r) return "";
      return r > 1.5 ? "偏高" : "普通";
    },
    detailRows() {
      const dt = this.d.detail || {};
      return [
        { label: "已使用内存", value: dt.usedMemory, color: "#409eff" },
        { label: "数据集内存", value: dt.datasetMemory },
        { label: "RSS内存", value: dt.rssMemory, tag: "物理内存" },
        { label: "分配器已分配", value: dt.allocatorAllocated, tag: "Allocator" },
        { label: "内存峰值", value: dt.peakMemory, color: "#e6a23c" },
        { label: "分配器活跃", value: dt.allocatorActive, tag: "Active" },
        { label: "系统总内存", value: dt.totalSystemMemory, tag: "系统" },
        { label: "内存碎片率", value: dt.fragRatio },
      ];
    },
    policyRows() {
      const p = this.d.policy || {};
      return [
        { label: "最大内存限制", value: p.maxMemory, tag: p.maxMemoryDesc },
        { label: "内存淘汰策略", value: p.evictionPolicy, color: "#409eff" },
      ];
    },
    trendCount() {
      const t = this.d.trend || {};
      return (t.times && t.times.length) || 0;
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
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    renderChart() {
      if (!this.$refs.chartRef) return;
      if (!this.chart) this.chart = echarts.init(this.$refs.chartRef);
      const t = this.d.trend || {};
      this.chart.setOption({
        tooltip: { trigger: "axis", formatter: "{b}<br/>内存使用率: {c}%" },
        grid: { left: 50, right: 20, top: 30, bottom: 30 },
        xAxis: { type: "category", boundaryGap: false, data: t.times || [] },
        yAxis: { type: "value", min: 0, max: 100, axisLabel: { formatter: "{value}%" } },
        series: [
          {
            name: "内存使用率",
            type: "line",
            smooth: true,
            areaStyle: { opacity: 0.15 },
            showSymbol: false,
            lineStyle: { color: "#409eff" },
            itemStyle: { color: "#409eff" },
            data: t.values || [],
          },
        ],
      });
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getRedisMemory(this.deviceId);
        this.d = res.content || {};
        await this.$nextTick();
        this.renderChart();
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
.policy-desc {
  margin-top: 16px;
  padding: 14px 16px;
  background: #fafafa;
  border-radius: 6px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 10px;
    i {
      color: #e6a23c;
      margin-right: 6px;
    }
  }
  &__item {
    font-size: 12px;
    color: #606266;
    line-height: 1.9;
    b {
      color: #303133;
    }
  }
}
.trend-chart {
  height: 320px;
  width: 100%;
}
</style>
