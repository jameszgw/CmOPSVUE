<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-cpu" label="上游总数"
          :value="d.total == null ? '-' : d.total" sub="上游集群数量" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-circle-check" label="健康上游"
          :value="d.healthy == null ? '-' : d.healthy" sub="健康节点集群数"
          color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-warning-outline" label="异常上游"
          :value="unhealthyCount" sub="存在异常节点的集群"
          :color="unhealthyCount > 0 ? '#f56c6c' : '#67c23a'" />
      </el-col>
    </el-row>

    <el-empty v-if="!upstreams.length && !loading" description="暂无上游数据" />

    <SectionCard v-for="(up, i) in upstreams" :key="i"
      :title="up.name || `上游 ${i + 1}`" icon="el-icon-cpu">
      <template #extra>
        {{ up.healthy == null ? '-' : up.healthy }} 健康 /
        {{ up.serverCount == null ? '-' : up.serverCount }} 节点
      </template>

      <el-row :gutter="12" class="overview-row">
        <el-col :xs="12" :sm="6">
          <div class="ov-item">
            <div class="ov-item__label">节点数</div>
            <div class="ov-item__val">{{ up.serverCount == null ? '-' : up.serverCount }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="ov-item">
            <div class="ov-item__label">健康 / 异常</div>
            <div class="ov-item__val">
              <span style="color:#67c23a">{{ up.healthy == null ? '-' : up.healthy }}</span>
              /
              <span :style="{ color: up.unhealthy ? '#f56c6c' : '#909399' }">{{ up.unhealthy == null ? '-' : up.unhealthy }}</span>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="ov-item">
            <div class="ov-item__label">活动连接</div>
            <div class="ov-item__val">{{ up.activeConn == null ? '-' : up.activeConn }}</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="ov-item">
            <div class="ov-item__label">平均响应</div>
            <div class="ov-item__val">{{ up.avgResponseMs == null ? '-' : `${num(up.avgResponseMs)} ms` }}</div>
          </div>
        </el-col>
      </el-row>

      <el-table :data="up.members || []" size="small" stripe>
        <el-table-column prop="server" label="节点地址" min-width="160" />
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="statusTag(row.status)" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="80" />
        <el-table-column label="活动连接" width="100">
          <template slot-scope="{ row }">
            {{ row.activeConn == null ? '-' : row.activeConn }}
          </template>
        </el-table-column>
        <el-table-column label="失败次数" width="100">
          <template slot-scope="{ row }">
            <span :style="{ color: Number(row.fails) > 0 ? '#f56c6c' : '#909399' }">
              {{ row.fails == null ? '-' : row.fails }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="响应时间" width="120">
          <template slot-scope="{ row }">
            {{ row.responseMs == null ? '-' : `${num(row.responseMs)} ms` }}
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getLbUpstreams } from "@/api/monitor-lb";

export default {
  name: "LbUpstreams",
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
    upstreams() {
      return this.d.upstreams || [];
    },
    unhealthyCount() {
      const total = Number(this.d.total);
      const healthy = Number(this.d.healthy);
      if (!isNaN(total) && !isNaN(healthy)) return Math.max(0, total - healthy);
      return "-";
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
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    statusTag(s) {
      const v = String(s || "").toLowerCase();
      if (["up", "online", "healthy", "active", "正常"].some((k) => v.includes(k))) return "success";
      if (["down", "offline", "unhealthy", "failed", "异常"].some((k) => v.includes(k))) return "danger";
      if (["degraded", "warning"].some((k) => v.includes(k))) return "warning";
      return "info";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getLbUpstreams(this.deviceId);
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
.overview-row {
  margin-bottom: 14px;
}
.ov-item {
  background: #fafafa;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }
  &__val {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}
/deep/ .el-table {
  margin-top: 4px;
}
</style>
