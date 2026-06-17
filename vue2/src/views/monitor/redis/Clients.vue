<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-user" label="连接客户端" :value="d.connectedClients == null ? '-' : d.connectedClients"
        sub="当前连接数" color="#409eff" />
      <stat-card dense icon="el-icon-warning-outline" label="阻塞客户端" :value="d.blockedClients == null ? '-' : d.blockedClients"
        sub="阻塞中" color="#e6a23c" />
      <stat-card dense icon="el-icon-connection" label="总连接数" :value="fmt(d.totalConnections)"
        sub="累计连接" color="#67c23a" />
    </card-grid>

    <div class="content-area">
      <section-card dense scrollable class="fill" body-class="dense-table fill"
        title="客户端连接列表" icon="el-icon-s-data">
        <template #extra>共 {{ (d.clients && d.clients.length) || 0 }} 个连接</template>
        <el-table :data="d.clients || []" size="small" stripe class="dense-table" height="100%">
          <el-table-column prop="id" label="客户端ID" width="100" />
          <el-table-column prop="addr" label="地址" min-width="180" />
          <el-table-column label="名称" min-width="120">
            <template slot-scope="{ row }">{{ row.name || "-" }}</template>
          </el-table-column>
          <el-table-column prop="db" label="数据库" width="90" />
          <el-table-column label="状态" width="100">
            <template slot-scope="{ row }">
              <el-tag size="small" type="success" effect="plain">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="空闲时间" width="120">
            <template slot-scope="{ row }">{{ row.idleTime }}</template>
          </el-table-column>
          <el-table-column label="输出缓冲" width="120">
            <template slot-scope="{ row }">{{ row.outputBuffer }}</template>
          </el-table-column>
          <el-table-column label="最后命令" width="140">
            <template slot-scope="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ row.lastCmd }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </section-card>
    </div>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisClients } from "@/api/monitor-redis";

export default {
  name: "RedisClients",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
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
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v == null ? "-" : v;
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getRedisClients(this.deviceId);
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
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: @dense-gap;
}
.kpi-grid {
  flex-shrink: 0;
}
.content-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
