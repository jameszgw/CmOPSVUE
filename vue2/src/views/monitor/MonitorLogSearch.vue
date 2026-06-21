<template>
  <screen-page v-loading="loading" title="日志检索" gap="8px" class="logsearch-page">
    <template #header-extra>
      <div class="ctrl-row">
        <span class="ctrl-label">统计窗口(分)</span>
        <el-input-number
          v-model="windowMin"
          :min="5"
          :max="1440"
          size="small"
          :controls="false"
          class="ctrl-num"
          @change="loadStats"
        />
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <card-grid min="200px" gap="8px" class="row-stats">
      <stat-card
        dense
        icon="el-icon-tickets"
        label="总数"
        :value="num(stats.total)"
        :sub="`窗口 ${num(stats.windowMin)} 分钟`"
        color="#409eff"
      />
      <stat-card
        dense
        icon="el-icon-circle-close"
        label="错误"
        :value="num(stats.error)"
        color="#f56c6c"
      />
      <stat-card
        dense
        icon="el-icon-warning"
        label="警告"
        :value="num(stats.warn)"
        color="#e6a23c"
      />
      <stat-card
        dense
        icon="el-icon-info"
        label="信息"
        :value="num(stats.info)"
        color="#909399"
      />
    </card-grid>

    <!-- 日志表 -->
    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="日志检索"
      icon="el-icon-document"
    >
      <template #extra>
        <div class="filter-row">
          <el-input
            v-model="filterDeviceId"
            placeholder="设备ID"
            size="small"
            clearable
            class="filter-input"
            @keyup.enter.native="load"
          />
          <el-select v-model="filterLevel" size="small" class="filter-select" @change="load">
            <el-option label="全部" value="" />
            <el-option label="ERROR" value="ERROR" />
            <el-option label="WARN" value="WARN" />
            <el-option label="INFO" value="INFO" />
            <el-option label="DEBUG" value="DEBUG" />
          </el-select>
          <el-input
            v-model="filterKeyword"
            placeholder="关键字"
            size="small"
            clearable
            class="filter-input-wide"
            @keyup.enter.native="load"
          />
          <el-button type="primary" size="small" @click="load">查询</el-button>
          <span class="total-tag">共 {{ total }} 条</span>
        </div>
      </template>
      <el-table class="dense-table" height="100%" :data="items" size="small" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="deviceName" label="设备" min-width="140" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" min-width="120" show-overflow-tooltip />
        <el-table-column label="级别" width="90">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="levelType(row.level)" effect="dark">
              {{ row.level || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="log-content">{{ row.content }}</span>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty description="暂无日志记录" :image-size="60" />
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
import { getLogSearch, getLogStats } from "@/api/monitor-ops";

export default {
  name: "MonitorLogSearch",
  components: { ScreenPage, CardGrid, StatCard, SectionCard },
  data() {
    return {
      loading: false,
      windowMin: 60,
      stats: {},
      data: {},
      filterDeviceId: "",
      filterLevel: "",
      filterKeyword: "",
    };
  },
  computed: {
    items() {
      return this.data.items || [];
    },
    total() {
      return this.data.total != null ? this.data.total : this.items.length;
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    levelType(l) {
      const k = String(l || "").toUpperCase();
      if (k === "ERROR") return "danger";
      if (k === "WARN" || k === "WARNING") return "warning";
      if (k === "INFO") return "primary";
      return "info";
    },
    async loadStats() {
      try {
        const res = await getLogStats(this.windowMin);
        this.stats = res.content || {};
      } catch (e) {
        this.stats = {};
      }
    },
    async loadSearch() {
      this.loading = true;
      try {
        const res = await getLogSearch({
          deviceId: this.filterDeviceId || undefined,
          level: this.filterLevel || undefined,
          keyword: this.filterKeyword || undefined,
          limit: 200,
        });
        this.data = res.content || {};
      } finally {
        this.loading = false;
      }
    },
    async load() {
      await Promise.all([this.loadStats(), this.loadSearch()]);
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
.ctrl-num {
  width: 90px;
}
.ctrl-label {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.filter-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.filter-input {
  width: 140px;
}
.filter-input-wide {
  width: 160px;
}
.filter-select {
  width: 110px;
}
.total-tag {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
.log-content {
  white-space: normal;
  word-break: break-all;
}
</style>
