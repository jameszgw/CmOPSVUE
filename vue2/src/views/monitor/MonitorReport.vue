<template>
  <screen-page v-loading="loading" title="运维报告" gap="8px" class="report-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(天)</span>
        <el-input-number
          v-model="windowDays"
          :min="1"
          :max="90"
          size="small"
          :controls="false"
          class="ctrl-num"
        />
        <el-button type="primary" size="small" icon="el-icon-document" :loading="loading" @click="generate">生成报告</el-button>
        <el-button size="small" icon="el-icon-download" @click="download('md')">下载 MD</el-button>
        <el-button size="small" icon="el-icon-download" @click="download('csv')">下载 CSV</el-button>
      </div>
    </template>

    <!-- 关键指标卡 -->
    <card-grid min="200px" gap="8px" class="row-stats">
      <stat-card
        dense
        icon="el-icon-odometer"
        label="健康评分"
        :value="num(healthScore)"
        :sub="healthLevel || '—'"
        :color="scoreColor(healthScore)"
      />
      <stat-card
        dense
        icon="el-icon-bell"
        label="活跃告警"
        :value="num(alert.activeTotal)"
        :sub="`严重 ${num(alert.critical)} / 警告 ${num(alert.warning)}`"
        color="#409eff"
      />
      <stat-card
        dense
        icon="el-icon-warning"
        label="严重告警"
        :value="num(alert.critical)"
        :sub="`已确认 ${num(alert.acknowledged)} / 已恢复 ${num(alert.resolved)}`"
        color="#f56c6c"
      />
      <stat-card
        dense
        icon="el-icon-data-line"
        label="平均可用率"
        :value="`${pct(slo.avgAvailability)}%`"
        :sub="`达标 ${num(slo.metCount)} / 未达标 ${num(slo.breachedCount)}`"
        color="#67c23a"
      />
      <stat-card
        dense
        icon="el-icon-warning-outline"
        label="容量风险数"
        :value="num(capacity.riskCount)"
        color="#e6a23c"
      />
      <stat-card
        dense
        icon="el-icon-circle-check"
        label="拨测正常数"
        :value="num(dialtest.up)"
        :sub="`任务 ${num(dialtest.taskTotal)} / 异常 ${num(dialtest.down)}`"
        color="#67c23a"
      />
    </card-grid>

    <!-- 报告概要 -->
    <section-card dense title="报告概要" icon="el-icon-document" class="row-info">
      <div v-if="report.generatedAt" class="report-meta">
        <span class="meta-item">生成时间：{{ report.generatedAt }}</span>
        <span class="meta-item">统计窗口：{{ num(report.windowDays) }} 天</span>
        <span class="meta-item">
          设备：在线 {{ num(deviceStats.online) }} / 离线 {{ num(deviceStats.offline) }} / 总数 {{ num(deviceStats.total) }}
        </span>
      </div>
      <el-empty v-else description="点击「生成报告」获取数据" :image-size="60" />
    </section-card>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getReportSummary, reportExportUrl } from "@/api/monitor-ops";

export default {
  name: "MonitorReport",
  components: { ScreenPage, CardGrid, StatCard, SectionCard },
  data() {
    return {
      loading: false,
      windowDays: 7,
      report: {},
    };
  },
  computed: {
    overview() {
      return this.report.overview || {};
    },
    deviceStats() {
      return this.overview.deviceStats || {};
    },
    healthScore() {
      return this.overview.healthScore;
    },
    healthLevel() {
      return this.overview.healthLevel;
    },
    alert() {
      return this.report.alert || {};
    },
    slo() {
      return this.report.slo || {};
    },
    capacity() {
      return this.report.capacity || {};
    },
    dialtest() {
      return this.report.dialtest || {};
    },
  },
  mounted() {
    this.generate();
  },
  methods: {
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    pct(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    scoreColor(v) {
      const n = Number(v);
      if (Number.isNaN(n)) return "#409eff";
      if (n >= 90) return "#67c23a";
      if (n >= 70) return "#e6a23c";
      return "#f56c6c";
    },
    async generate() {
      this.loading = true;
      try {
        const res = await getReportSummary(this.windowDays);
        this.report = res.content || {};
      } finally {
        this.loading = false;
      }
    },
    download(format) {
      const url = reportExportUrl(format, this.windowDays);
      window.open(url, "_blank");
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats,
.row-info {
  flex-shrink: 0;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.ctrl-label {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.ctrl-num {
  width: 80px;
}
.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: @space-lg;
}
.meta-item {
  font-size: 13px;
  color: var(--cm-text-regular, @text-regular);
}
</style>
