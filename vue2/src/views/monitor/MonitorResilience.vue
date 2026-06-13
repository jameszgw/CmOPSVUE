<template>
  <div class="page-container">
    <el-tabs v-model="activeTab" class="resilience-tabs">
      <!-- 韧性评分 -->
      <el-tab-pane label="韧性评分" name="resilience">
        <el-row :gutter="12">
          <el-col :xs="24" :lg="12">
            <SectionCard title="韧性维度评分" icon="el-icon-aim">
              <template #extra>满分 100</template>
              <div ref="radarRef" class="radar-chart"></div>
            </SectionCard>
          </el-col>
          <el-col :xs="24" :lg="12">
            <SectionCard title="总体评分" icon="el-icon-medal">
              <div class="score-box">
                <div class="score-num" :style="{ color: gradeColor }">{{ overallScore }}</div>
                <el-tag :type="gradeTagType" effect="dark" size="medium">等级 {{ grade }}</el-tag>
              </div>
              <el-row :gutter="12" class="drill-stat-row">
                <el-col :xs="24" :sm="12">
                  <StatCard
                    icon="el-icon-circle-check"
                    label="演练通过"
                    :value="drillPassed"
                    color="#67c23a"
                  />
                </el-col>
                <el-col :xs="24" :sm="12">
                  <StatCard
                    icon="el-icon-circle-close"
                    label="演练未通过"
                    :value="drillFailed"
                    color="#f56c6c"
                  />
                </el-col>
              </el-row>
            </SectionCard>
          </el-col>
        </el-row>

        <SectionCard title="混沌演练" icon="el-icon-cpu">
          <template #extra>共 {{ drillTotal }} 项</template>
          <el-table :data="drills" size="small" stripe>
            <el-table-column prop="name" label="场景" min-width="160" />
            <el-table-column prop="desc" label="说明" min-width="200" />
            <el-table-column label="结果" width="100">
              <template slot-scope="{ row }">
                <el-tag
                  size="small"
                  effect="dark"
                  :type="row.status === 'passed' ? 'success' : 'danger'"
                >{{ row.statusText || (row.status === 'passed' ? '通过' : '未通过') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastRun" label="最近" width="170" />
            <el-table-column label="检测耗时" width="110">
              <template slot-scope="{ row }">{{ num(row.detectionTimeSec) }} s</template>
            </el-table-column>
            <el-table-column label="恢复耗时" width="110">
              <template slot-scope="{ row }">{{ num(row.recoveryTimeSec) }} s</template>
            </el-table-column>
            <el-table-column label="告警准确率" width="120">
              <template slot-scope="{ row }">{{ num(row.alertAccuracy) }}%</template>
            </el-table-column>
          </el-table>
        </SectionCard>

        <SectionCard title="改进建议" icon="el-icon-magic-stick">
          <el-empty v-if="!improvements.length" description="暂无改进建议" />
          <ul v-else class="improve-list">
            <li v-for="(item, i) in improvements" :key="i">
              <i class="el-icon-arrow-right"></i>
              <span>{{ item }}</span>
            </li>
          </ul>
        </SectionCard>
      </el-tab-pane>

      <!-- 安全基线 -->
      <el-tab-pane label="安全基线" name="security">
        <el-row :gutter="12" class="stat-row">
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-warning-outline" label="漂移总数" :value="driftTotal" color="#409eff" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-error" label="高危" :value="highRisk" color="#f56c6c" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-warning" label="中危" :value="mediumRisk" color="#e6a23c" />
          </el-col>
          <el-col :xs="24" :sm="12" :lg="6">
            <StatCard icon="el-icon-info" label="低危" :value="lowRisk" color="#67c23a" />
          </el-col>
        </el-row>

        <SectionCard title="安全基线漂移" icon="el-icon-lock">
          <el-empty v-if="driftTotal === 0" description="暂无基线漂移" />
          <el-table v-else :data="drifts" size="small" stripe>
            <el-table-column prop="deviceName" label="设备" min-width="140" />
            <el-table-column label="类型" width="110">
              <template slot-scope="{ row }">{{ deviceTypeLabel(row.deviceType) }}</template>
            </el-table-column>
            <el-table-column prop="category" label="类别" width="120" />
            <el-table-column prop="target" label="项" min-width="160" />
            <el-table-column prop="baseline" label="基线" min-width="140" />
            <el-table-column label="当前" min-width="140">
              <template slot-scope="{ row }">
                <span style="color: #f56c6c">{{ row.current }}</span>
              </template>
            </el-table-column>
            <el-table-column label="风险" width="90">
              <template slot-scope="{ row }">
                <el-tag size="small" effect="dark" :type="riskTagType(row.risk)">{{
                  row.riskText || riskTextOf(row.risk)
                }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="detectedTime" label="时间" width="170" />
            <el-table-column prop="recommendation" label="建议" min-width="220" />
          </el-table>
        </SectionCard>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import * as echarts from "echarts";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getResilienceScore, getSecurityDrift } from "@/api/monitor-resilience";

const DEVICE_TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息队列",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
};

const GRADE_COLOR = { A: "#67c23a", B: "#67c23a", C: "#e6a23c", D: "#f56c6c" };
const GRADE_TAG = { A: "success", B: "success", C: "warning", D: "danger" };

export default {
  name: "MonitorResilience",
  components: { StatCard, SectionCard, InfoTable },
  data() {
    return {
      activeTab: "resilience",
      score: {},
      drift: {},
      chart: null,
      timer: null,
    };
  },
  computed: {
    overallScore() {
      const v = this.score.overallScore;
      return v === undefined || v === null ? "-" : v;
    },
    grade() {
      return this.score.grade || "-";
    },
    gradeColor() {
      return GRADE_COLOR[this.score.grade] || "#303133";
    },
    gradeTagType() {
      return GRADE_TAG[this.score.grade] || "info";
    },
    dimensions() {
      return this.score.dimensions || [];
    },
    drillTotal() {
      return this.score.drillTotal || 0;
    },
    drillPassed() {
      return this.score.drillPassed || 0;
    },
    drillFailed() {
      return this.score.drillFailed || 0;
    },
    drills() {
      return this.score.drills || [];
    },
    improvements() {
      return this.score.improvements || [];
    },
    driftTotal() {
      return this.drift.total || 0;
    },
    highRisk() {
      return this.drift.highRisk || 0;
    },
    mediumRisk() {
      return this.drift.mediumRisk || 0;
    },
    lowRisk() {
      return this.drift.lowRisk || 0;
    },
    drifts() {
      return this.drift.drifts || [];
    },
  },
  mounted() {
    this.loadAll();
    this.timer = setInterval(this.loadAll, 5000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? "-" : v;
    },
    deviceTypeLabel(t) {
      return DEVICE_TYPE_LABEL[t] || t || "-";
    },
    riskTagType(risk) {
      if (risk === "high") return "danger";
      if (risk === "medium") return "warning";
      return "success";
    },
    riskTextOf(risk) {
      if (risk === "high") return "高危";
      if (risk === "medium") return "中危";
      return "低危";
    },
    renderRadar() {
      if (!this.$refs.radarRef) return;
      if (!this.chart) this.chart = echarts.init(this.$refs.radarRef);
      const dims = this.dimensions;
      this.chart.setOption({
        tooltip: {},
        radar: {
          radius: "65%",
          indicator: dims.map((it) => ({ name: it.name, max: 100 })),
        },
        series: [
          {
            type: "radar",
            areaStyle: { opacity: 0.2 },
            lineStyle: { color: "#409eff" },
            itemStyle: { color: "#409eff" },
            data: [{ value: dims.map((it) => it.score), name: "韧性评分" }],
          },
        ],
      });
    },
    async loadScore() {
      const res = await getResilienceScore();
      this.score = res.content || {};
      await this.$nextTick();
      this.renderRadar();
    },
    async loadDrift() {
      const res = await getSecurityDrift();
      this.drift = res.content || {};
    },
    loadAll() {
      this.loadScore();
      this.loadDrift();
    },
  },
};
</script>

<style lang="less" scoped>
.page-container {
  padding: 16px;
}
.resilience-tabs /deep/ .el-tabs__content {
  overflow: visible;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.radar-chart {
  height: 320px;
  width: 100%;
}
.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0 24px;

  .score-num {
    font-size: 56px;
    font-weight: 700;
    line-height: 1.1;
    margin-bottom: 12px;
  }
}
.drill-stat-row .el-col {
  margin-bottom: 12px;
}
.improve-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: flex-start;
    padding: 8px 0;
    font-size: 13px;
    color: #606266;
    border-bottom: 1px solid #f0f2f5;

    &:last-child {
      border-bottom: none;
    }

    i {
      color: #409eff;
      margin-right: 8px;
      margin-top: 3px;
    }
  }
}
</style>
