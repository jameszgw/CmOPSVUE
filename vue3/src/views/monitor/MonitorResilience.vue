<template>
  <ScreenPage v-loading="loading" title="韧性中心" gap="8px" class="resilience">
    <el-tabs v-model="activeTab" class="resilience-tabs fill" @tab-change="onTabChange">
      <!-- 韧性评分 -->
      <el-tab-pane label="韧性评分" name="score">
        <div class="tab-pane">
          <CardGrid min="300px" gap="8px" class="row-top">
            <SectionCard dense title="韧性维度评分" icon="DataAnalysis" class="radar-card">
              <template #extra>满分 100</template>
              <div ref="radarRef" class="radar-chart"></div>
            </SectionCard>
            <SectionCard dense title="总体评分" icon="Medal">
              <div class="overall">
                <div class="overall__score" :style="{ color: gradeColor(score.grade) }">
                  {{ num(score.overallScore) }}
                </div>
                <el-tag
                  size="large"
                  effect="dark"
                  :color="gradeColor(score.grade)"
                  style="border: none; color: #fff"
                >
                  等级 {{ score.grade || "-" }}
                </el-tag>
              </div>
              <CardGrid min="130px" gap="8px">
                <StatCard
                  dense
                  icon="CircleCheck"
                  label="演练通过"
                  :value="num(score.drillPassed)"
                  :sub="`共 ${num(score.drillTotal)} 项`"
                  color="#67c23a"
                />
                <StatCard
                  dense
                  icon="CircleClose"
                  label="演练未通过"
                  :value="num(score.drillFailed)"
                  :sub="`共 ${num(score.drillTotal)} 项`"
                  color="#f56c6c"
                />
              </CardGrid>
            </SectionCard>
          </CardGrid>

          <div class="row-bottom fill">
            <SectionCard dense scrollable bodyClass="dense-table fill" class="drills-card fill"
              title="混沌演练" icon="Lightning">
              <el-table class="dense-table" height="100%" :data="score.drills || []" size="small" stripe>
                <el-table-column prop="name" label="场景" min-width="150" />
                <el-table-column prop="desc" label="说明" min-width="220" show-overflow-tooltip />
                <el-table-column label="结果" width="100">
                  <template #default="{ row }">
                    <el-tag
                      size="small"
                      effect="dark"
                      :color="drillColor(row.status)"
                      style="border: none; color: #fff"
                    >
                      {{ row.statusText || drillText(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastRun" label="最近运行" width="180" />
                <el-table-column label="检测耗时" width="110">
                  <template #default="{ row }">{{ secs(row.detectionTimeSec) }}</template>
                </el-table-column>
                <el-table-column label="恢复耗时" width="110">
                  <template #default="{ row }">{{ secs(row.recoveryTimeSec) }}</template>
                </el-table-column>
                <el-table-column label="告警准确率" width="120">
                  <template #default="{ row }">{{ pct(row.alertAccuracy) }}</template>
                </el-table-column>
                <template #empty>
                  <el-empty description="暂无演练记录" :image-size="60" />
                </template>
              </el-table>
            </SectionCard>

            <SectionCard dense scrollable bodyClass="fill" class="improve-card fill"
              title="改进建议" icon="Opportunity">
              <ul v-if="(score.improvements || []).length" class="improve-list">
                <li v-for="(tip, i) in score.improvements || []" :key="i">{{ tip }}</li>
              </ul>
              <el-empty v-else description="暂无改进建议" :image-size="60" />
            </SectionCard>
          </div>
        </div>
      </el-tab-pane>

      <!-- 安全基线 -->
      <el-tab-pane label="安全基线" name="drift">
        <div class="tab-pane">
          <CardGrid min="180px" gap="8px" class="row-stats">
            <StatCard dense icon="DataBoard" label="漂移总数" :value="num(drift.total)" color="#409eff" />
            <StatCard dense icon="Warning" label="高危" :value="num(drift.highRisk)" color="#f56c6c" />
            <StatCard dense icon="WarningFilled" label="中危" :value="num(drift.mediumRisk)" color="#e6a23c" />
            <StatCard dense icon="InfoFilled" label="低危" :value="num(drift.lowRisk)" color="#67c23a" />
          </CardGrid>

          <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
            title="安全基线漂移" icon="Lock">
            <el-table class="dense-table" height="100%" :data="drift.drifts || []" size="small" stripe>
              <el-table-column prop="deviceName" label="设备" min-width="150" />
              <el-table-column label="类型" width="110">
                <template #default="{ row }">
                  <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.deviceType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="类别" width="130" />
              <el-table-column prop="target" label="项" min-width="140" />
              <el-table-column prop="baseline" label="基线" min-width="140" show-overflow-tooltip />
              <el-table-column label="当前" min-width="140">
                <template #default="{ row }">
                  <span style="color: #f56c6c">{{ row.current }}</span>
                </template>
              </el-table-column>
              <el-table-column label="风险" width="90">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    effect="dark"
                    :color="riskColor(row.risk)"
                    style="border: none; color: #fff"
                  >
                    {{ row.riskText || riskText(row.risk) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="detectedTime" label="时间" width="180" />
              <el-table-column prop="recommendation" label="建议" min-width="220" show-overflow-tooltip />
              <template #empty>
                <el-empty description="暂无基线漂移" :image-size="60" />
              </template>
            </el-table>
          </SectionCard>
        </div>
      </el-tab-pane>
    </el-tabs>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";
applyChartTheme(echarts);
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getResilienceScore, getSecurityDrift } from "@/api/monitor-resilience";

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "容器",
  MQ: "消息队列", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
};

const loading = ref(false);
const activeTab = ref("score");
const scoreData = ref({});
const driftData = ref({});
const score = computed(() => scoreData.value || {});
const drift = computed(() => driftData.value || {});

const radarRef = ref(null);
let radarChart = null;
let timer = null;

const num = (v) => (v === undefined || v === null ? "-" : v);
const secs = (v) => (v === undefined || v === null ? "-" : `${v} s`);
const pct = (v) => (v === undefined || v === null ? "-" : `${v}%`);
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const gradeColor = (g) => {
  if (g === "A") return "#67c23a";
  if (g === "B" || g === "C") return "#e6a23c";
  if (g === "D") return "#f56c6c";
  return "#909399";
};
const drillColor = (s) => (s === "passed" ? "#67c23a" : "#f56c6c");
const drillText = (s) => (s === "passed" ? "通过" : "未通过");
const riskColor = (r) => {
  if (r === "high") return "#f56c6c";
  if (r === "medium") return "#e6a23c";
  return "#67c23a";
};
const riskText = (r) => (r === "high" ? "高危" : r === "medium" ? "中危" : "低危");

const renderRadar = () => {
  if (!radarRef.value) return;
  if (!radarChart) radarChart = echarts.init(radarRef.value, currentChartTheme());
  const dims = score.value.dimensions || [];
  radarChart.setOption({
    tooltip: { trigger: "item" },
    radar: {
      indicator: dims.map((it) => ({ name: it.name, max: 100 })),
      radius: "62%",
      center: ["50%", "55%"],
      splitNumber: 4,
      axisName: { color: "#606266", fontSize: 12 },
      splitLine: { lineStyle: { color: "#ebeef5" } },
      splitArea: { areaStyle: { color: ["#fff", "#fafafa"] } },
    },
    series: [
      {
        type: "radar",
        areaStyle: { opacity: 0.2, color: "#409eff" },
        lineStyle: { color: "#409eff" },
        itemStyle: { color: "#409eff" },
        data: [{ value: dims.map((it) => it.score), name: "韧性评分" }],
      },
    ],
  });
};

const resizeRadar = () => {
  radarChart && radarChart.resize();
};

const onTabChange = async () => {
  if (activeTab.value === "score") {
    await nextTick();
    renderRadar();
    resizeRadar();
  }
};

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const [s, dr] = await Promise.all([getResilienceScore(), getSecurityDrift()]);
    scoreData.value = s.content || {};
    driftData.value = dr.content || {};
    await nextTick();
    renderRadar();
  } finally {
    loading.value = false;
  }
};

const rerenderAllCharts = () => {
  if (radarChart) {
    radarChart.dispose();
    radarChart = null;
  }
  renderRadar();
};

useChartSkin(rerenderAllCharts);

onMounted(() => {
  load();
  timer = setInterval(() => load(true), 5000);
  window.addEventListener("resize", resizeRadar);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  timer = null;
  window.removeEventListener("resize", resizeRadar);
  radarChart && radarChart.dispose();
  radarChart = null;
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

// el-tabs 填满 ScreenPage 主体
.resilience-tabs {
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__header) {
    margin: 0 0 8px;
    flex-shrink: 0;
  }

  :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
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

.radar-card :deep(.section-card__body) {
  display: flex;
}
.radar-chart {
  height: @chart-h-md;
  width: 100%;
}

.overall {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: @space-md;
  padding: 6px 0 @space-md;

  &__score {
    font-size: 40px;
    font-weight: 700;
    line-height: 1;
  }
}

.improve-list {
  margin: 0;
  padding-left: 18px;

  li {
    font-size: 13px;
    color: var(--cm-text-regular);
    line-height: 1.8;
  }
}
</style>
