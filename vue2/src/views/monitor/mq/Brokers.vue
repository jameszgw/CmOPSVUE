<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-cpu" label="Broker 总数"
        :value="num0(d.total)" sub="集群 Broker 数" color="#409eff" />
      <stat-card dense icon="el-icon-circle-check" label="在线"
        :value="num0(d.online)" sub="Online" color="#67c23a" />
      <stat-card dense icon="el-icon-circle-close" label="离线"
        :value="num0(d.offline)" sub="Offline" :color="d.offline > 0 ? '#f56c6c' : '#67c23a'" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="Broker 列表" icon="el-icon-s-grid">
      <template #extra>共 {{ brokers.length }} 个 Broker</template>
      <el-table :data="brokers" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="id" label="ID" width="80" align="center" fixed />
        <el-table-column prop="host" label="主机" min-width="150" />
        <el-table-column prop="ip" label="IP" min-width="140" />
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="statusColor(row.status)" style="border:none">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="row.controller" size="mini" type="warning" effect="dark">Controller</el-tag>
            <span v-else style="color:#909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="CPU%" width="150">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12" :text-inside="true" color="#e6a23c" />
          </template>
        </el-table-column>
        <el-table-column label="内存%" width="150">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.memPct)" :stroke-width="12" :text-inside="true" color="#67c23a" />
          </template>
        </el-table-column>
        <el-table-column label="磁盘%" width="150">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.diskPct)" :stroke-width="12" :text-inside="true" :color="diskColor(row.diskPct)" />
          </template>
        </el-table-column>
        <el-table-column prop="leaderPartitions" label="Leader 分区" width="120" align="center" />
        <el-table-column prop="isrShrinks" label="ISR 收缩" width="100" align="center" />
        <el-table-column label="副本不足" width="100" align="center">
          <template slot-scope="{ row }">
            <span :style="{ color: row.underReplicated > 0 ? '#f56c6c' : '#67c23a' }">{{ num0(row.underReplicated) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="刷盘延迟" width="110" align="right">
          <template slot-scope="{ row }">{{ num1(row.flushLatencyMs) }} ms</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!brokers.length" description="暂无 Broker 数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getMqBrokers } from "@/api/monitor-mq";

const STATUS_COLORS = {
  online: "#67c23a",
  up: "#67c23a",
  offline: "#f56c6c",
  down: "#f56c6c",
};

export default {
  name: "MqBrokers",
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
    brokers() {
      return this.d.brokers || [];
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
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    diskColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getMqBrokers(this.deviceId);
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
  box-sizing: border-box;
}
.kpi-grid {
  flex-shrink: 0;
}
</style>
