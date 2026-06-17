<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '暂无数据'" :image-size="120" />
    <template v-else>
    <el-alert v-if="limited" type="warning" :closable="false" :title="limitNote"
      show-icon class="limit-alert" />

    <CardGrid min="180px" gap="8px" class="kpi-row">
      <StatCard dense icon="el-icon-s-order" label="总进程数" :value="num(d.total)"
        sub="系统进程总数" color="#409eff" />
      <StatCard dense icon="el-icon-video-play" label="运行中" :value="num(d.running)"
        sub="正在运行的进程" color="#67c23a" />
      <StatCard dense icon="el-icon-moon" label="休眠中" :value="num(d.sleeping)"
        sub="休眠状态的进程" color="#909399" />
      <StatCard dense icon="el-icon-warning-outline" label="其他状态" :value="num(d.other)"
        sub="停止/僵尸等状态" color="#e6a23c" />
    </CardGrid>

    <div class="body-grid">
      <SectionCard dense title="Top 进程（按CPU使用率排序）" icon="el-icon-s-order"
        class="fill proc-card" body-class="dense-table fill" scrollable>
        <el-table class="dense-table" :data="d.topProcess || []" height="100%" size="small" stripe>
          <el-table-column prop="pid" label="PID" width="90" />
          <el-table-column prop="name" label="进程名" />
          <el-table-column label="CPU %" width="100">
            <template slot-scope="{ row }">
              <span style="color: #67c23a">{{ pct(row.cpu) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="内存 %" width="100">
            <template slot-scope="{ row }">
              <span style="color: #e6a23c">{{ pct(row.mem) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template slot-scope="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
        </el-table>
      </SectionCard>

      <div class="side-col">
        <SectionCard dense title="进程状态分布" icon="el-icon-pie-chart">
          <div v-for="item in statusItems" :key="item.key" class="dist-row">
            <span class="dist-row__dot" :style="{ background: item.color }"></span>
            <span class="dist-row__label">{{ item.label }}</span>
            <span class="dist-row__count">{{ num(item.value) }}</span>
            <span class="dist-row__pct">{{ num(item.pct) }}%</span>
          </div>
          <div class="dist-total">
            <span class="dist-total__label">总计</span>
            <span class="dist-total__value">{{ num(statusTotal) }}</span>
          </div>
        </SectionCard>

        <SectionCard dense title="资源使用排行" icon="el-icon-s-data" class="fill rank-card" scrollable>
          <div v-for="item in resourceRank" :key="item.pid" class="rank-item">
            <div class="rank-item__head">
              <span class="rank-item__badge" :class="'rank-item__badge--' + item.rank">{{ item.rank }}</span>
              <span class="rank-item__name">{{ item.name }}</span>
              <span class="rank-item__pid">PID: {{ item.pid }}</span>
            </div>
            <div class="rank-item__metric">
              <span class="rank-item__metric-label">CPU:</span>
              <span class="rank-item__metric-value" style="color: #67c23a">{{ pct(item.cpu) }}</span>
            </div>
            <div class="rank-item__metric">
              <span class="rank-item__metric-label">内存:</span>
              <span class="rank-item__metric-value" style="color: #e6a23c">{{ pct(item.mem) }}</span>
            </div>
          </div>
          <el-empty v-if="!resourceRank.length" description="暂无数据" :image-size="80" />
        </SectionCard>
      </div>
    </div>
    </template>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getServerProcess } from "@/api/monitor-server";

export default {
  name: "ServerProcessInfo",
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
    limited() {
      return !!this.d.limited;
    },
    limitNote() {
      return this.d.limitNote || "当前设备未安装 Agent，部分进程数据受限";
    },
    statusTotal() {
      const s = this.d.statusDist || {};
      return s.total != null ? s.total : this.d.total;
    },
    statusItems() {
      const s = this.d.statusDist || {};
      const total = this.statusTotal || 0;
      const items = [
        { key: "running", label: "运行中", value: s.running, color: "#67c23a" },
        { key: "sleeping", label: "休眠中", value: s.sleeping, color: "#409eff" },
        { key: "other", label: "其他状态", value: s.other, color: "#909399" },
      ];
      return items.map((it) => ({
        ...it,
        pct: total ? ((Number(it.value) || 0) / total) * 100 : 0,
      }));
    },
    resourceRank() {
      return this.d.resourceRank || [];
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
      return v === undefined || v === null ? "-" : v;
    },
    pct(v) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)}%`;
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerProcess(this.deviceId);
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
.limit-alert {
  margin-bottom: @dense-gap;
  flex-shrink: 0;
}
.body-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: @dense-gap;
}
.side-col {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: @dense-gap;
}
.proc-card {
  min-height: 0;
}
.rank-card {
  min-height: 0;
}
@media (max-width: 1100px) {
  .body-grid {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}
.dist-row {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--cm-bg-page, @bg-page);

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 10px;
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  &__count {
    margin-left: auto;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
  &__pct {
    width: 64px;
    text-align: right;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.dist-total {
  display: flex;
  align-items: center;
  padding-top: 12px;

  &__label {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
  &__value {
    margin-left: auto;
    font-size: 16px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
}
.rank-item {
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;

  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  &__badge {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #409eff;
    color: var(--cm-bg-card, @bg-card);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;

    &--1 {
      background: #f56c6c;
    }
    &--2 {
      background: #e6a23c;
    }
    &--3 {
      background: #409eff;
    }
  }
  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
  &__pid {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__metric {
    display: flex;
    align-items: center;
    font-size: 13px;
    margin-top: 4px;
  }
  &__metric-label {
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__metric-value {
    margin-left: auto;
    font-weight: 600;
  }
}
</style>
