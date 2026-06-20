<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-user" label="消费组数"
        :value="num0(d.groupCount)" sub="Consumer Group" color="#409eff" />
      <stat-card dense icon="el-icon-warning-outline" label="总积压"
        :value="num0(d.totalLag)" sub="Total Lag" color="#e6a23c" />
      <stat-card dense icon="el-icon-top" label="最大积压"
        :value="num0(d.maxLag)" sub="Max Lag" :color="d.highLagCount > 0 ? '#f56c6c' : '#67c23a'" />
      <stat-card dense icon="el-icon-refresh" label="再平衡中"
        :value="num0(d.rebalancingCount)" :sub="`高积压组 ${num0(d.highLagCount)}`"
        :color="d.rebalancingCount > 0 ? '#e6a23c' : '#67c23a'" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="消费组列表" icon="el-icon-s-grid">
      <template #extra>共 {{ groups.length }} 个消费组</template>
      <el-table :data="groups" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="groupId" label="消费组" min-width="180" fixed />
        <el-table-column label="状态" width="130">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="stateColor(row.state)" style="border:none">{{ row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="members" label="成员数" width="90" align="center" />
        <el-table-column prop="topics" label="订阅主题" width="100" align="center" />
        <el-table-column label="积压" width="130" align="right">
          <template slot-scope="{ row }">
            <span :style="{ color: row.highLag ? '#f56c6c' : '#303133', fontWeight: row.highLag ? 600 : 400 }">{{ num0(row.lag) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="消费速率" width="130" align="right">
          <template slot-scope="{ row }">{{ num0(row.consumeRate) }} msg/s</template>
        </el-table-column>
        <el-table-column label="再平衡次数" width="120" align="center">
          <template slot-scope="{ row }">{{ num0(row.rebalanceCount) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!groups.length" description="暂无消费组数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getMqConsumers } from "@/api/monitor-mq";

const STATE_COLORS = {
  Stable: "#67c23a",
  Rebalancing: "#e6a23c",
  Empty: "#909399",
};

export default {
  name: "MqConsumers",
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
    groups() {
      return this.d.groups || [];
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
    stateColor(s) {
      return STATE_COLORS[s] || "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getMqConsumers(this.deviceId);
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
