<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-connection" label="端口总数" :value="num0(d.total)"
        sub="物理端口数" color="#409eff" />
      <StatCard dense icon="el-icon-circle-check" label="在线端口" :value="num0(d.up)"
        sub="Up 端口" color="#67c23a" />
      <StatCard dense icon="el-icon-warning" label="错误端口" :value="num0(d.errorPorts)"
        sub="存在错误的端口" color="#f56c6c" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable body-class="dense-table fill" title="端口列表" icon="el-icon-menu">
        <template #extra>共 {{ ports.length }} 个端口</template>
        <el-empty v-if="!ports.length" description="暂无数据" />
        <el-table v-else :data="ports" size="small" stripe :row-class-name="rowClass" class="dense-table" height="100%">
        <el-table-column prop="name" label="端口" min-width="140" fixed>
          <template slot-scope="{ row }">
            <span class="mono">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="速率" width="110">
          <template slot-scope="{ row }">{{ row.speed || "-" }}</template>
        </el-table-column>
        <el-table-column label="双工" width="100">
          <template slot-scope="{ row }">{{ row.duplex || "-" }}</template>
        </el-table-column>
        <el-table-column label="利用率" width="180">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.utilizationPct)" :stroke-width="10"
              :color="pctColor(row.utilizationPct)" />
          </template>
        </el-table-column>
        <el-table-column label="入速率" width="110">
          <template slot-scope="{ row }">{{ row.inRate || "-" }}</template>
        </el-table-column>
        <el-table-column label="出速率" width="110">
          <template slot-scope="{ row }">{{ row.outRate || "-" }}</template>
        </el-table-column>
        <el-table-column label="入错误" width="90" align="center">
          <template slot-scope="{ row }">
            <span :class="{ 'err-val': (row.inErrors || 0) > 0 }">{{ num0(row.inErrors) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出错误" width="90" align="center">
          <template slot-scope="{ row }">
            <span :class="{ 'err-val': (row.outErrors || 0) > 0 }">{{ num0(row.outErrors) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="CRC 错误" width="100" align="center">
          <template slot-scope="{ row }">
            <span :class="{ 'err-val': (row.crcErrors || 0) > 0 }">{{ num0(row.crcErrors) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="丢包率" width="100" align="center">
          <template slot-scope="{ row }">{{ num1(row.dropsPct) }}%</template>
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
import { getNetDevPorts } from "@/api/monitor-netdev";

export default {
  name: "NetDevPorts",
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
    ports() {
      return this.d.ports || [];
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
      return v === undefined || v === null ? "0" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    statusColor(s) {
      if (["up", "online", "normal", "active", "Up", "Online"].includes(s)) return "#67c23a";
      if (["near-full", "degraded", "warning", "Warning"].includes(s)) return "#e6a23c";
      if (["down", "offline", "failed", "Down", "Offline", "Failed"].includes(s)) return "#f56c6c";
      return "#909399";
    },
    rowClass({ row }) {
      return row.hasError ? "row-error" : "";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getNetDevPorts(this.deviceId);
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
.err-val {
  color: #f56c6c;
  font-weight: 600;
}
/deep/ .el-table .row-error td {
  background: #fef0f0;
  color: #f56c6c;
}
/deep/ .el-table .row-error:hover > td {
  background: #fde2e2 !important;
}
</style>
