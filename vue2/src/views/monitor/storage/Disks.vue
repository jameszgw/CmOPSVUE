<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-cpu" label="磁盘总数"
        :value="d.total == null ? '-' : d.total" :sub="d.type || '存储磁盘'" color="#409eff" />
      <StatCard dense icon="el-icon-circle-check" label="健康磁盘"
        :value="d.healthy == null ? '-' : d.healthy" sub="状态正常" color="#67c23a" />
      <StatCard dense icon="el-icon-circle-close" label="故障磁盘"
        :value="d.failed == null ? '-' : d.failed" sub="需要更换"
        :color="d.failed ? '#f56c6c' : '#67c23a'" />
      <StatCard dense icon="el-icon-warning-outline" label="慢盘"
        :value="d.slowCount == null ? '-' : d.slowCount" sub="时延偏高"
        :color="d.slowCount ? '#e6a23c' : '#67c23a'" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable body-class="dense-table fill" title="磁盘列表" icon="el-icon-cpu">
        <template #extra>共 {{ (d.disks && d.disks.length) || 0 }} 块磁盘</template>
        <el-table class="dense-table" height="100%" :data="d.disks || []" size="small" stripe>
        <el-table-column prop="id" label="磁盘 ID" width="120" />
        <el-table-column prop="host" label="主机" min-width="140" />
        <el-table-column label="状态" width="110">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="容量" width="110" />
        <el-table-column prop="used" label="已用" width="110" />
        <el-table-column label="使用率" min-width="160">
          <template slot-scope="{ row }">
            <el-progress :percentage="pct(row.usagePct)" :stroke-width="10"
              :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column label="延迟" width="110" align="right">
          <template slot-scope="{ row }">
            <span :style="{ color: row.slow ? '#f56c6c' : '#303133' }">{{ num(row.latencyMs) }} ms</span>
          </template>
        </el-table-column>
        <el-table-column label="SMART" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="smartType(row.smartStatus)" effect="plain">{{ row.smartStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="温度" width="90" align="right">
          <template slot-scope="{ row }">
            <span>{{ row.temperature == null ? '-' : row.temperature + '°C' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="重映射扇区" width="110" align="right">
          <template slot-scope="{ row }">
            <span :style="{ color: row.reallocatedSectors ? '#e6a23c' : '#303133' }">{{ row.reallocatedSectors == null ? '-' : row.reallocatedSectors }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!(d.disks && d.disks.length)" description="暂无磁盘数据" />
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStorageDisks } from "@/api/monitor-storage";

export default {
  name: "StorageDisks",
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
    num(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    pct(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    statusType(status) {
      const s = String(status || "").toLowerCase();
      if (s === "failed" || s === "error" || s === "offline" || s === "down") return "danger";
      if (s === "warning" || s === "degraded") return "warning";
      return "success";
    },
    smartType(smart) {
      const s = String(smart || "").toLowerCase();
      if (s === "failed" || s === "error" || s === "critical") return "danger";
      if (s === "warning" || s === "warn") return "warning";
      return "success";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getStorageDisks(this.deviceId);
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
</style>
