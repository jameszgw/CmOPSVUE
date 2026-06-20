<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-cpu" label="传感器总数" :value="num0(d.total)"
        sub="接入传感器数" color="#409eff" />
      <StatCard dense icon="el-icon-circle-check" label="在线" :value="num0(onlineCount)"
        sub="在线传感器" color="#67c23a" />
      <StatCard dense icon="el-icon-circle-close" label="离线" :value="num0(offlineCount)"
        sub="离线传感器" color="#f56c6c" />
    </card-grid>

    <card-grid class="fill" min="420px" gap="8px">
      <SectionCard dense scrollable title="传感器列表" icon="el-icon-menu"
        body-class="dense-table fill" class="fill">
        <template #extra>共 {{ items.length }} 个传感器</template>
        <el-empty v-if="!items.length" description="暂无数据" />
        <el-table v-else :data="items" class="dense-table" height="100%" size="small" stripe>
          <el-table-column prop="id" label="ID" min-width="120" fixed>
          <template slot-scope="{ row }">
            <span class="mono">{{ row.id || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140">
          <template slot-scope="{ row }">{{ row.name || "-" }}</template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template slot-scope="{ row }">{{ row.type || "-" }}</template>
        </el-table-column>
        <el-table-column label="协议" width="110">
          <template slot-scope="{ row }">{{ row.protocol || "-" }}</template>
        </el-table-column>
        <el-table-column label="信号" width="110" align="center">
          <template slot-scope="{ row }">{{ num0(row.rssi) }} dBm</template>
        </el-table-column>
        <el-table-column label="电量" width="170">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.battery)" :stroke-width="10"
              :color="batteryColor(row.battery)" />
          </template>
        </el-table-column>
        <el-table-column label="读数" min-width="120">
          <template slot-scope="{ row }">{{ val(row.value) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
          <el-table-column label="最后通信" min-width="160">
            <template slot-scope="{ row }">{{ val(row.lastSeen) }}</template>
          </el-table-column>
        </el-table>
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getIotSensors } from "@/api/monitor-iot";

export default {
  name: "IotSensors",
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
    items() {
      return this.d.items || [];
    },
    onlineCount() {
      return this.items.filter((it) => this.isOnline(it.status)).length;
    },
    offlineCount() {
      return this.items.filter((it) => !this.isOnline(it.status)).length;
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
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    isOnline(s) {
      return ["online", "normal", "active", "Online", "Normal", "ok", "OK"].includes(s);
    },
    batteryColor(v) {
      const n = Number(v) || 0;
      if (n <= 20) return "#f56c6c";
      if (n <= 50) return "#e6a23c";
      return "#67c23a";
    },
    statusColor(s) {
      if (["online", "normal", "active", "ok", "Online", "Normal", "OK"].includes(s)) return "#67c23a";
      if (["warning", "degraded", "low", "Warning"].includes(s)) return "#e6a23c";
      if (["offline", "failed", "down", "Offline", "Failed", "Down"].includes(s)) return "#f56c6c";
      return "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getIotSensors(this.deviceId);
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
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  overflow: hidden;
}
.mono {
  font-family: monospace;
  color: var(--cm-text-primary, @text-primary);
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card, @bg-card);
}
</style>
