<template>
  <screen-page v-loading="loading" title="SLO / 可用率" gap="8px" class="slo-page">
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
          @change="reload"
        />
        <span class="ctrl-label">目标(%)</span>
        <el-input-number
          v-model="target"
          :min="0"
          :max="100"
          :step="0.1"
          :precision="2"
          size="small"
          :controls="false"
          class="ctrl-num-wide"
          @change="reload"
        />
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="reload">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <card-grid min="200px" gap="8px" class="row-stats">
      <stat-card
        dense
        icon="el-icon-monitor"
        label="设备数"
        :value="num(summary.deviceCount)"
        :sub="`窗口 ${num(summary.windowDays)} 天`"
        color="#409eff"
      />
      <stat-card
        dense
        icon="el-icon-data-line"
        label="平均可用率"
        :value="`${pct(summary.avgAvailability)}%`"
        :sub="`目标 ${pct(summary.target)}%`"
        color="#67c23a"
      />
      <stat-card
        dense
        icon="el-icon-circle-check"
        label="达标数"
        :value="num(summary.metCount)"
        color="#67c23a"
      />
      <stat-card
        dense
        icon="el-icon-circle-close"
        label="未达标数"
        :value="num(summary.breachedCount)"
        color="#f56c6c"
      />
    </card-grid>

    <!-- 最差设备表 -->
    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="可用率最差设备"
      icon="el-icon-warning"
    >
      <template #extra>共 {{ worst.length }} 台</template>
      <el-table class="dense-table" height="100%" :data="worst" size="small" stripe>
        <el-table-column prop="deviceName" label="名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="可用率" width="120">
          <template slot-scope="{ row }">
            <span class="val-strong" :style="{ color: availColor(row.availability) }">
              {{ pct(row.availability) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="达标" width="90">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="row.met ? 'success' : 'danger'" effect="dark">
              {{ row.met ? "达标" : "未达标" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="不可用分钟" width="120">
          <template slot-scope="{ row }">{{ num1(row.downMinutes) }}</template>
        </el-table-column>
        <el-table-column label="故障次数" width="100">
          <template slot-scope="{ row }">{{ num(row.incidents) }}</template>
        </el-table-column>
        <el-table-column label="MTTR(分钟)" width="120">
          <template slot-scope="{ row }">{{ num1(row.mttrMinutes) }}</template>
        </el-table-column>
        <el-table-column label="剩余错误预算" min-width="140">
          <template slot-scope="{ row }">
            <el-progress
              :percentage="clamp(row.errorBudgetRemainingPct)"
              :stroke-width="8"
              :color="budgetColor(row.errorBudgetRemainingPct)"
            />
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty description="暂无数据" :image-size="60" />
        </template>
      </el-table>
    </section-card>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getSloSummary } from "@/api/monitor-ops";

const TYPE_LABEL = {
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

export default {
  name: "MonitorSlo",
  components: { ScreenPage, CardGrid, StatCard, SectionCard },
  data() {
    return {
      loading: false,
      windowDays: 7,
      target: 99.9,
      data: {},
    };
  },
  computed: {
    summary() {
      return this.data || {};
    },
    worst() {
      return this.summary.worst || [];
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    pct(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    availColor(v) {
      const n = Number(v);
      if (n >= 99.9) return "#67c23a";
      if (n >= 99) return "#e6a23c";
      return "#f56c6c";
    },
    budgetColor(v) {
      const n = Number(v) || 0;
      if (n < 20) return "#f56c6c";
      if (n < 50) return "#e6a23c";
      return "#67c23a";
    },
    async reload() {
      this.loading = true;
      try {
        const res = await getSloSummary(this.windowDays, this.target);
        this.data = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats {
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
.ctrl-num-wide {
  width: 100px;
}
.val-strong {
  font-weight: 600;
}
</style>
