<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12">
        <StatCard icon="el-icon-files" label="存储池数量"
          :value="d.poolCount == null ? '-' : d.poolCount" sub="存储池总数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12">
        <StatCard icon="el-icon-warning-outline" label="接近满载"
          :value="d.nearFullCount == null ? '-' : d.nearFullCount" sub="使用率偏高的池"
          :color="d.nearFullCount ? '#e6a23c' : '#67c23a'" />
      </el-col>
    </el-row>

    <SectionCard title="存储池列表" icon="el-icon-files">
      <template #extra>共 {{ (d.pools && d.pools.length) || 0 }} 个池</template>
      <el-table :data="d.pools || []" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="capacity" label="容量" width="120" />
        <el-table-column prop="used" label="已用" width="120" />
        <el-table-column label="使用率" min-width="180">
          <template slot-scope="{ row }">
            <el-progress :percentage="pct(row.usagePct)" :stroke-width="10"
              :color="usageColor(row)" :text-inside="true" />
          </template>
        </el-table-column>
        <el-table-column label="对象数" width="120" align="right">
          <template slot-scope="{ row }">
            <span>{{ row.objects == null ? '-' : row.objects }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="replicas" label="副本数" width="90" align="center" />
        <el-table-column label="IOPS" width="100" align="right">
          <template slot-scope="{ row }">
            <span style="color: #67c23a">{{ row.iops == null ? '-' : row.iops }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="plain">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!(d.pools && d.pools.length)" description="暂无存储池数据" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getStoragePools } from "@/api/monitor-storage";

export default {
  name: "StoragePools",
  components: { StatCard, SectionCard, InfoTable },
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
    pct(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    isNearFull(row) {
      const s = String((row && row.status) || "").toLowerCase();
      return s === "near-full" || s === "nearfull" || this.pct(row && row.usagePct) >= 85;
    },
    usageColor(row) {
      if (this.isNearFull(row)) return "#e6a23c";
      return "#409eff";
    },
    statusType(status) {
      const s = String(status || "").toLowerCase();
      if (s === "near-full" || s === "nearfull") return "warning";
      if (s === "full" || s === "error" || s === "failed") return "danger";
      return "success";
    },
    statusText(status) {
      const s = String(status || "").toLowerCase();
      if (s === "near-full" || s === "nearfull") return "接近满载";
      return status || "正常";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getStoragePools(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
</style>
