<template>
  <screen-page title="韧性中心" gap="8px" class="resilience">
    <template #header-extra>
      <el-tag size="mini" type="success" effect="plain">真实采集</el-tag>
    </template>

    <el-tabs v-model="activeTab" class="resilience-tabs fill" @tab-click="onTabClick">
      <!-- 韧性评分 -->
      <el-tab-pane label="韧性评分" name="resilience">
        <div class="tab-pane">
          <card-grid min="300px" gap="8px" class="row-top">
            <section-card dense title="韧性维度评分" icon="el-icon-aim" class="radar-card">
              <template #extra>满分 100</template>
              <div ref="radarRef" class="radar-chart"></div>
            </section-card>
            <section-card dense title="总体评分" icon="el-icon-medal">
              <div class="score-box">
                <div class="score-num" :style="{ color: gradeColor }">{{ overallScore }}</div>
                <el-tag :type="gradeTagType" effect="dark" size="medium">等级 {{ grade }}</el-tag>
              </div>
              <card-grid min="130px" gap="8px">
                <stat-card
                  dense
                  icon="el-icon-circle-check"
                  label="演练通过"
                  :value="drillPassed"
                  :sub="`共 ${drillTotal} 项`"
                  color="#67c23a"
                />
                <stat-card
                  dense
                  icon="el-icon-circle-close"
                  label="演练未通过"
                  :value="drillFailed"
                  :sub="`共 ${drillTotal} 项`"
                  color="#f56c6c"
                />
              </card-grid>
            </section-card>
          </card-grid>

          <div class="row-bottom fill">
            <section-card dense scrollable body-class="dense-table fill" class="drills-card fill"
              title="混沌演练" icon="el-icon-cpu">
              <template #extra>共 {{ drillTotal }} 项</template>
              <el-table class="dense-table" height="100%" :data="drills" size="small" stripe>
                <el-table-column prop="name" label="场景" min-width="150" />
                <el-table-column prop="desc" label="说明" min-width="220" show-overflow-tooltip />
                <el-table-column label="结果" width="100">
                  <template slot-scope="{ row }">
                    <el-tag
                      size="small"
                      effect="dark"
                      :type="row.status === 'passed' ? 'success' : 'danger'"
                    >{{ row.statusText || (row.status === 'passed' ? '通过' : '未通过') }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastRun" label="最近" width="180" />
                <el-table-column label="检测耗时" width="110">
                  <template slot-scope="{ row }">{{ num(row.detectionTimeSec) }} s</template>
                </el-table-column>
                <el-table-column label="恢复耗时" width="110">
                  <template slot-scope="{ row }">{{ num(row.recoveryTimeSec) }} s</template>
                </el-table-column>
                <el-table-column label="告警准确率" width="120">
                  <template slot-scope="{ row }">{{ num(row.alertAccuracy) }}%</template>
                </el-table-column>
                <template slot="empty">
                  <el-empty description="暂无演练记录" :image-size="60" />
                </template>
              </el-table>
            </section-card>

            <section-card dense scrollable body-class="fill" class="improve-card fill"
              title="改进建议" icon="el-icon-magic-stick">
              <ul v-if="improvements.length" class="improve-list">
                <li v-for="(item, i) in improvements" :key="i">
                  <i class="el-icon-arrow-right"></i>
                  <span>{{ item }}</span>
                </li>
              </ul>
              <el-empty v-else description="暂无改进建议" :image-size="60" />
            </section-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 安全基线 -->
      <el-tab-pane label="安全基线" name="security">
        <div class="tab-pane">
          <card-grid min="180px" gap="8px" class="row-stats">
            <stat-card dense icon="el-icon-warning-outline" label="漂移总数" :value="driftTotal" color="#409eff" />
            <stat-card dense icon="el-icon-error" label="高危" :value="highRisk" color="#f56c6c" />
            <stat-card dense icon="el-icon-warning" label="中危" :value="mediumRisk" color="#e6a23c" />
            <stat-card dense icon="el-icon-info" label="低危" :value="lowRisk" color="#67c23a" />
          </card-grid>

          <section-card dense scrollable body-class="dense-table fill" class="fill"
            title="安全基线漂移" icon="el-icon-lock">
            <template slot="extra">
              <el-tag size="small" effect="plain" :type="drift.source === 'real' ? 'success' : 'info'">
                {{ drift.source === 'real' ? '真实信号' : '模拟数据' }}
              </el-tag>
            </template>
            <el-table class="dense-table" height="100%" :data="drifts" size="small" stripe>
              <el-table-column prop="deviceName" label="设备" min-width="150" />
              <el-table-column label="类型" width="110">
                <template slot-scope="{ row }">
                  <el-tag size="small" type="info" effect="plain">{{ deviceTypeLabel(row.deviceType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="类别" width="130" />
              <el-table-column prop="target" label="项" min-width="140" />
              <el-table-column prop="baseline" label="基线" min-width="140" show-overflow-tooltip />
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
              <el-table-column prop="detectedTime" label="时间" width="180" />
              <el-table-column label="来源" width="80">
                <template slot-scope="{ row }">
                  <el-tag size="small" effect="plain" :type="row.source === 'real' ? 'success' : 'info'">
                    {{ row.source === 'real' ? '真实' : '模拟' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="recommendation" label="建议" min-width="220" show-overflow-tooltip />
              <template slot="empty">
                <el-empty description="暂无基线漂移" :image-size="60" />
              </template>
            </el-table>
          </section-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </screen-page>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
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
  mixins: [chartSkin],
  components: { ScreenPage, CardGrid, StatCard, SectionCard, InfoTable },
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
    window.addEventListener("resize", this.resizeRadar);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener("resize", this.resizeRadar);
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
    resizeRadar() {
      if (this.chart) this.chart.resize();
    },
    onTabClick() {
      if (this.activeTab === "resilience") {
        this.$nextTick(() => {
          this.renderRadar();
          this.resizeRadar();
        });
      }
    },
    reinitChartsForSkin() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      this.renderRadar();
    },
    renderRadar() {
      if (!this.$refs.radarRef) return;
      if (!this.chart) {
        applyChartTheme(echarts);
        this.chart = echarts.init(this.$refs.radarRef, currentChartTheme());
      }
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
@import (reference) "@/styles/variables.less";

// el-tabs 填满 ScreenPage 主体
.resilience-tabs {
  display: flex;
  flex-direction: column;
  min-height: 0;

  /deep/ .el-tabs__header {
    margin: 0 0 8px;
    flex-shrink: 0;
  }

  /deep/ .el-tabs__content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  /deep/ .el-tab-pane {
    height: 100%;
  }
}

.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  min-height: 0;
}

.row-top,
.row-stats {
  flex-shrink: 0;
}

// 演练表 + 改进建议并排，填满剩余高度
.row-bottom {
  display: flex;
  gap: @space-sm;
  flex: 1;
  min-height: 0;
}
.drills-card {
  flex: 2;
  min-width: 0;
}
.improve-card {
  flex: 1;
  min-width: 260px;
}

.radar-card /deep/ .section-card__body {
  display: flex;
}
.radar-chart {
  height: @chart-h-md;
  width: 100%;
}

.score-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: @space-md;
  padding: 6px 0 @space-md;

  .score-num {
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
  }
}

.improve-list {
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: flex-start;
    padding: 6px 0;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);

    i {
      color: #409eff;
      margin-right: 8px;
      margin-top: 3px;
    }
  }
}
</style>
