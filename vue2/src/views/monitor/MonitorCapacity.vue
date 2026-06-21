<template>
  <screen-page v-loading="loading" title="容量规划" gap="8px" class="capacity-page">
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
          @change="loadSummary"
        />
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="loadSummary">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <card-grid min="200px" gap="8px" class="row-stats">
      <stat-card
        dense
        icon="el-icon-warning-outline"
        label="风险项数"
        :value="num(summary.riskCount)"
        :sub="`窗口 ${num(summary.windowDays)} 天`"
        color="#f56c6c"
      />
      <stat-card
        dense
        icon="el-icon-odometer"
        label="阈值"
        :value="`${num(summary.threshold)}%`"
        color="#e6a23c"
      />
    </card-grid>

    <!-- 容量风险表 -->
    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="容量风险（最近触达优先）"
      icon="el-icon-data-line"
    >
      <template #extra>共 {{ risks.length }} 项</template>
      <el-table class="dense-table" height="100%" :data="risks" size="small" stripe>
        <el-table-column prop="deviceName" label="设备" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="metricKey" label="指标" min-width="120" show-overflow-tooltip />
        <el-table-column label="当前值" width="110">
          <template slot-scope="{ row }">
            <span class="val-strong">{{ num1(row.current) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="日增长" width="110">
          <template slot-scope="{ row }">{{ num2(row.slopePerDay) }}</template>
        </el-table-column>
        <el-table-column label="预计触达" width="150">
          <template slot-scope="{ row }">
            <span :style="{ color: daysColor(row.daysToThreshold) }">
              {{ daysLabel(row.daysToThreshold) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="projectedDate" label="预计日期" width="160" />
        <template slot="empty">
          <el-empty description="暂无容量风险" :image-size="60" />
        </template>
      </el-table>
    </section-card>

    <!-- 容量预测查询 -->
    <section-card dense title="容量预测查询" icon="el-icon-data-analysis" class="row-forecast">
      <div class="forecast-form">
        <el-input v-model="fDeviceId" placeholder="设备ID" size="small" class="f-id" />
        <el-input v-model="fMetricKey" placeholder="指标键（如 diskUsage）" size="small" class="f-key" />
        <el-input-number
          v-model="fThreshold"
          :min="1"
          :max="100"
          size="small"
          :controls="false"
          class="f-th"
        />
        <el-button
          type="primary"
          size="small"
          :loading="forecastLoading"
          :disabled="!fDeviceId"
          @click="loadForecast"
        >预测</el-button>
        <span v-if="forecast.note" class="forecast-note" :class="{ breach: forecast.willBreachThreshold }">
          {{ forecast.note }}
        </span>
      </div>
    </section-card>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getCapacitySummary, getCapacityForecast } from "@/api/monitor-ops";

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
  name: "MonitorCapacity",
  components: { ScreenPage, CardGrid, StatCard, SectionCard },
  data() {
    return {
      loading: false,
      windowDays: 7,
      data: {},
      fDeviceId: "",
      fMetricKey: "diskUsage",
      fThreshold: 90,
      forecastLoading: false,
      forecast: {},
    };
  },
  computed: {
    summary() {
      return this.data || {};
    },
    risks() {
      return this.summary.risks || [];
    },
  },
  mounted() {
    this.loadSummary();
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
    num2(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    daysLabel(d) {
      if (d === undefined || d === null) return "-";
      const n = Number(d);
      if (n < 0) return "已超限";
      return `约 ${this.num1(n)} 天后`;
    },
    daysColor(d) {
      const n = Number(d);
      if (Number.isNaN(n)) return "var(--cm-text-primary)";
      if (n < 0 || n <= 7) return "#f56c6c";
      if (n <= 30) return "#e6a23c";
      return "#67c23a";
    },
    async loadSummary() {
      this.loading = true;
      try {
        const res = await getCapacitySummary(this.windowDays);
        this.data = res.content || {};
      } finally {
        this.loading = false;
      }
    },
    async loadForecast() {
      if (!this.fDeviceId) return;
      this.forecastLoading = true;
      try {
        const res = await getCapacityForecast(
          this.fDeviceId,
          this.fMetricKey || "diskUsage",
          this.windowDays,
          this.fThreshold
        );
        this.forecast = res.content || {};
        if (!this.forecast.hasData) this.$message.info("该指标暂无足够数据");
      } finally {
        this.forecastLoading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats,
.row-forecast {
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
.val-strong {
  font-weight: 600;
  color: var(--cm-text-primary, @text-primary);
}
.forecast-form {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;
}
.f-id {
  width: 180px;
}
.f-key {
  width: 200px;
}
.f-th {
  width: 100px;
}
.forecast-note {
  font-size: 13px;
  color: var(--cm-text-regular, @text-regular);
  &.breach {
    color: #f56c6c;
    font-weight: 600;
  }
}
</style>
