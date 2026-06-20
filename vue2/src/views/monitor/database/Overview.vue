<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-share" label="连接使用率" :value="`${num(d.connUsage)}%`"
        :percent="d.connUsage" color="#409eff" />
      <stat-card dense icon="el-icon-coin" label="数据库大小" :value="dbSizeText"
        :sub="storageSub" color="#909399" />
      <stat-card dense icon="el-icon-data-analysis" label="缓存命中率" :value="`${num(d.hitRate)}%`"
        :percent="d.hitRate" color="#67c23a" />
      <stat-card dense icon="el-icon-odometer" label="活动连接"
        :value="d.activeConnections == null ? '-' : d.activeConnections"
        sub="当前活动连接数" color="#e6a23c" />
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="320px" gap="8px">
        <section-card dense title="基本信息" icon="el-icon-info">
          <template #extra>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </section-card>
        <section-card dense title="连接信息" icon="el-icon-share">
          <InfoTable :rows="connectionRows" />
          <el-progress :percentage="clamp(connUsage)" :stroke-width="10"
            :color="usageColor(connUsage)" class="usage-bar" />
        </section-card>
        <section-card dense title="存储信息" icon="el-icon-coin">
          <InfoTable :rows="storageRows" />
        </section-card>
        <section-card dense title="性能统计" icon="el-icon-data-line">
          <InfoTable :rows="performanceRows" />
          <el-progress :percentage="clamp(perfHitRate)" :stroke-width="10"
            :color="usageColor(perfHitRate)" class="usage-bar" />
        </section-card>
      </card-grid>
    </div>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getDatabaseOverview } from "@/api/monitor-database";

export default {
  name: "DatabaseOverview",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    dbSizeText() {
      return this.d.dbSize == null ? "-" : this.d.dbSize;
    },
    storageSub() {
      const s = this.d.storage || {};
      return s.sizeMb == null ? "" : s.sizeMb;
    },
    connUsage() {
      const c = this.d.connection || {};
      return c.usage != null ? c.usage : this.d.connUsage;
    },
    perfHitRate() {
      const p = this.d.performance || {};
      return p.hitRate != null ? p.hitRate : this.d.hitRate;
    },
    basicRows() {
      const b = this.d.basic || {};
      return [
        { label: "数据库类型", value: b.dbType, color: "#67c23a" },
        { label: "主机地址", value: b.host },
        { label: "数据库名", value: b.dbName },
        { label: "版本", value: b.version },
        { label: "运行时间", value: b.uptime },
        { label: "时区", value: b.timezone },
        { label: "字符集", value: b.charset },
      ];
    },
    connectionRows() {
      const c = this.d.connection || {};
      return [
        { label: "总连接数", value: c.total },
        { label: "最大连接数", value: c.max },
        { label: "活动连接", value: c.active, color: "#67c23a" },
        { label: "空闲连接", value: c.idle },
      ];
    },
    storageRows() {
      const s = this.d.storage || {};
      return [
        { label: "数据库大小(GB)", value: s.sizeGb == null ? "-" : `${s.sizeGb} GB`, color: "#409eff" },
        { label: "数据库大小(MB)", value: s.sizeMb },
        { label: "数据库大小(字节)", value: s.sizeBytes },
      ];
    },
    performanceRows() {
      const p = this.d.performance || {};
      return [
        { label: "缓存命中率", value: `${this.num(p.hitRate)}%`, color: "#67c23a" },
        { label: "事务提交", value: p.commits },
        { label: "事务回滚", value: p.rollbacks },
        { label: "元组返回", value: p.tuplesReturned },
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
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    usageColor(v) {
      const n = Number(v) || 0;
      return n >= 90 ? "#f56c6c" : n >= 70 ? "#e6a23c" : "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getDatabaseOverview(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: 8px;
}
.kpi-grid {
  flex-shrink: 0;
}
.screen-tab__main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.usage-bar {
  margin-top: 14px;
}
</style>
