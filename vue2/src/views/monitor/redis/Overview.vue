<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-coin" label="内存使用率" :value="`${num(d.memoryUsage)}%`"
          :percent="d.memoryUsage" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-user" label="连接客户端" :value="d.connectedClients == null ? '-' : d.connectedClients"
          sub="当前连接数" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-warning-outline" label="阻塞客户端" :value="d.blockedClients == null ? '-' : d.blockedClients"
          sub="阻塞中" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-aim" label="命中率" :value="`${num(d.hitRate)}%`"
          :percent="d.hitRate" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard title="Redis 基础信息" icon="el-icon-info">
      <template #extra>
        <el-tag size="mini" :type="['agent','ssh','snmp'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
          {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP"}[d.source] || "模拟数据" }}
        </el-tag>
      </template>
      <InfoTable :rows="basicRows" :columns="3" />
    </SectionCard>

    <SectionCard title="内存信息" icon="el-icon-coin">
      <InfoTable :rows="memoryRows" :columns="2" />
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="连接统计" icon="el-icon-connection">
          <InfoTable :rows="connRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="命令统计" icon="el-icon-data-line">
          <InfoTable :rows="cmdRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="键空间信息" icon="el-icon-key">
      <el-row :gutter="12">
        <el-col v-for="ks in d.keyspace || []" :key="ks.name" :xs="24" :sm="12" :lg="8">
          <div class="keyspace-item">
            <div class="keyspace-item__head">
              <span class="keyspace-item__name">{{ ks.name }}</span>
              <span class="keyspace-item__index">DB {{ ks.index }}</span>
            </div>
            <InfoTable :rows="keyspaceRows(ks)" />
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="网络输入" icon="el-icon-download">
          <InfoTable :rows="netInRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="网络输出" icon="el-icon-upload2">
          <InfoTable :rows="netOutRows" />
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisOverview } from "@/api/monitor-redis";

export default {
  name: "RedisOverview",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    basicRows() {
      const b = this.d.basic || {};
      return [
        { label: "Redis版本", value: b.version },
        { label: "运行模式", value: b.mode, tag: b.role },
        { label: "角色", value: b.role },
        { label: "Redis地址", value: b.address },
        { label: "架构", value: b.arch },
        { label: "TCP端口", value: b.tcpPort },
        { label: "运行时间", value: b.uptime },
        { label: "运行天数", value: b.uptimeDays == null ? "-" : `${b.uptimeDays} 天` },
        { label: "连接状态", value: b.connStatus, color: "#67c23a" },
      ];
    },
    memoryRows() {
      const m = this.d.memory || {};
      return [
        { label: "已使用内存", value: m.usedMemory },
        { label: "数据集内存", value: m.datasetMemory },
        { label: "RSS内存", value: m.rssMemory },
        { label: "最大内存限制", value: m.maxMemory },
        { label: "内存峰值", value: m.peakMemory },
        { label: "内存碎片率", value: m.fragmentation, tag: m.fragRatio },
        { label: "系统总内存", value: m.totalSystemMemory },
        { label: "碎片率", value: m.fragRatio },
      ];
    },
    connRows() {
      const c = this.d.connStats || {};
      return [
        { label: "总连接数", value: c.total },
        { label: "拒绝连接数", value: c.rejected, color: "#f56c6c" },
        { label: "阻塞客户端", value: c.blocked },
        { label: "监视器数量", value: c.monitor },
      ];
    },
    cmdRows() {
      const c = this.d.cmdStats || {};
      return [
        { label: "总处理命令数", value: this.fmt(c.totalProcessed) },
        { label: "每秒操作数", value: c.opsPerSec, color: "#409eff" },
        { label: "键空间命中", value: this.fmt(c.keyspaceHits), color: "#67c23a" },
        { label: "键空间未命中", value: this.fmt(c.keyspaceMisses), color: "#e6a23c" },
      ];
    },
    netInRows() {
      const n = this.d.netInput || {};
      return [
        { label: "总输入字节", value: n.totalBytes },
        { label: "每秒输入", value: n.perSec, color: "#409eff" },
      ];
    },
    netOutRows() {
      const n = this.d.netOutput || {};
      return [
        { label: "总输出字节", value: n.totalBytes },
        { label: "每秒输出", value: n.perSec, color: "#67c23a" },
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
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v == null ? "-" : v;
    },
    keyspaceRows(ks) {
      return [
        { label: "键数量", value: ks.keys, color: "#409eff" },
        { label: "过期键", value: ks.expires },
        { label: "平均TTL", value: ks.avgTtl },
      ];
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getRedisOverview(this.deviceId);
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.keyspace-item {
  margin-bottom: 12px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  &__name {
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
  }
  &__index {
    margin-left: auto;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
</style>
