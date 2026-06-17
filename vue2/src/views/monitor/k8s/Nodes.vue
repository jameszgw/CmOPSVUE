<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-cpu" label="节点总数"
        :value="num0(d.total)" sub="集群节点数" color="#409eff" />
      <stat-card dense icon="el-icon-circle-check" label="就绪"
        :value="num0(d.ready)" sub="Ready 节点" color="#67c23a" />
      <stat-card dense icon="el-icon-circle-close" label="未就绪"
        :value="num0(d.notReady)" sub="NotReady 节点" color="#f56c6c" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="节点列表" icon="el-icon-s-grid">
      <template #extra>共 {{ (d.nodes && d.nodes.length) || 0 }} 个节点</template>
      <el-table :data="d.nodes || []" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="160" fixed />
        <el-table-column label="角色" width="130">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="row.role === 'control-plane' ? 'warning' : 'info'" effect="plain">{{ row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template slot-scope="{ row }">
            <el-tag size="small" effect="dark" :color="statusColor(row.status)" style="border:none">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CPU%" width="160">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12" :text-inside="true" color="#e6a23c" />
          </template>
        </el-table-column>
        <el-table-column label="内存%" width="160">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.memPct)" :stroke-width="12" :text-inside="true" color="#67c23a" />
          </template>
        </el-table-column>
        <el-table-column label="Pod" width="100" align="center">
          <template slot-scope="{ row }">
            {{ num0(row.podCount) }} / {{ num0(row.podCapacity) }}
          </template>
        </el-table-column>
        <el-table-column label="重启" width="80" align="center">
          <template slot-scope="{ row }">{{ num0(row.restarts) }}</template>
        </el-table-column>
        <el-table-column label="压力" min-width="180">
          <template slot-scope="{ row }">
            <template v-if="hasPressure(row)">
              <el-tag v-if="row.memoryPressure" size="mini" type="danger" effect="dark" class="pressure-tag">MemoryPressure</el-tag>
              <el-tag v-if="row.diskPressure" size="mini" type="danger" effect="dark" class="pressure-tag">DiskPressure</el-tag>
              <el-tag v-if="row.pidPressure" size="mini" type="danger" effect="dark" class="pressure-tag">PIDPressure</el-tag>
            </template>
            <span v-else style="color:#67c23a">正常</span>
          </template>
        </el-table-column>
        <el-table-column prop="kubeletVersion" label="kubelet" width="130" />
        <el-table-column prop="os" label="OS" min-width="150" />
        <el-table-column prop="age" label="age" width="100" />
      </el-table>
      <el-empty v-if="!(d.nodes && d.nodes.length)" description="暂无节点数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sNodes } from "@/api/monitor-k8s";

const STATUS_COLORS = {
  Ready: "#67c23a", Healthy: "#67c23a", Bound: "#67c23a", Running: "#67c23a",
  Warning: "#e6a23c", Pending: "#e6a23c",
  NotReady: "#f56c6c", Failed: "#f56c6c", CrashLoopBackOff: "#f56c6c", Unhealthy: "#f56c6c",
};

export default {
  name: "K8sNodes",
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
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    statusColor(s) {
      return STATUS_COLORS[s] || "#909399";
    },
    hasPressure(row) {
      return !!(row.memoryPressure || row.diskPressure || row.pidPressure);
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getK8sNodes(this.deviceId);
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
.pressure-tag {
  margin: 2px 4px 2px 0;
}
</style>
