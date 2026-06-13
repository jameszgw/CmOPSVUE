<template>
  <div v-loading="loading" class="tab-pane">
    <SectionCard title="推理" icon="el-icon-cpu">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-s-grid" label="模型数"
            :value="num0(inference.modelCount)" sub="部署模型" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-odometer" label="总 QPS"
            :value="num0(inference.totalQps)" sub="每秒查询" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-timer" label="P99 延迟"
            :value="`${num1(inference.avgLatencyP99)} ms`" :sub="`队列深度 ${num0(inference.queueDepth)}`" color="#e6a23c" />
        </el-col>
      </el-row>

      <el-table :data="models" size="small" stripe>
        <el-table-column prop="name" label="模型名称" min-width="180" />
        <el-table-column prop="replicas" label="副本数" width="90" align="center" />
        <el-table-column label="QPS" width="100" align="right">
          <template slot-scope="{ row }">{{ num0(row.qps) }}</template>
        </el-table-column>
        <el-table-column label="P99 延迟" width="120" align="right">
          <template slot-scope="{ row }">{{ num1(row.latencyP99Ms) }} ms</template>
        </el-table-column>
        <el-table-column label="显存" width="120" align="right">
          <template slot-scope="{ row }">{{ num0(row.gpuMemMB) }} MB</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="statusColor(row.status)" style="border:none">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!models.length" description="暂无推理模型数据" />
    </SectionCard>

    <SectionCard v-if="showEdge" title="边缘" icon="el-icon-connection">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12">
          <StatCard icon="el-icon-success" label="在线节点"
            :value="num0(edge.online)" sub="Online" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="12">
          <StatCard icon="el-icon-circle-close" label="离线节点"
            :value="num0(edge.offline)" sub="Offline" color="#f56c6c" />
        </el-col>
      </el-row>

      <el-table :data="nodes" size="small" stripe>
        <el-table-column prop="name" label="节点名称" min-width="160" />
        <el-table-column prop="location" label="位置" min-width="140" />
        <el-table-column label="状态" width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="statusColor(row.status)" style="border:none">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="延迟" width="110" align="right">
          <template slot-scope="{ row }">{{ num1(row.latencyMs) }} ms</template>
        </el-table-column>
        <el-table-column label="GPU 利用率" min-width="180">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.gpuUtil)" :stroke-width="12" :text-inside="true" color="#e6a23c" />
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="180" />
      </el-table>
      <el-empty v-if="!nodes.length" description="暂无边缘节点数据" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getGpuWorkloads } from "@/api/monitor-gpu";

const STATUS_COLORS = {
  online: "#67c23a", Online: "#67c23a", Running: "#67c23a", Ready: "#67c23a", Healthy: "#67c23a",
  Warning: "#e6a23c", Pending: "#e6a23c", Degraded: "#e6a23c",
  offline: "#f56c6c", Offline: "#f56c6c", Failed: "#f56c6c", Unhealthy: "#f56c6c",
};

export default {
  name: "GpuWorkloads",
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
    inference() {
      return this.d.inference || {};
    },
    models() {
      return this.inference.models || [];
    },
    edge() {
      return this.d.edge || {};
    },
    nodes() {
      return this.edge.nodes || [];
    },
    showEdge() {
      return !!this.d.isEdge || Number(this.edge.nodeTotal) > 0;
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
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getGpuWorkloads(this.deviceId);
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
