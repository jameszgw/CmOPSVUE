<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-share" label="BGP 邻居" :value="num0(bgp.total)"
        :sub="`Established ${num0(bgp.established)} / Down ${num0(bgp.down)}`" color="#409eff" />
      <StatCard dense icon="el-icon-connection" label="OSPF 邻居" :value="num0(ospf.neighbors)"
        :sub="`区域 ${num0(ospf.areas)}`" color="#67c23a" />
      <StatCard dense icon="el-icon-c-scale-to-original" label="链路聚合" :value="num0(lag.total)"
        :sub="`降级 ${num0(lag.degraded)}`" :color="lag.degraded > 0 ? '#e6a23c' : '#9254de'" />
      <StatCard dense icon="el-icon-discover" label="LLDP 邻居" :value="num0(lldp.neighbors)"
        :sub="`发现设备 ${num0(lldp.discoveredDevices)}`" color="#e6a23c" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable body-class="dense-table fill" title="BGP 邻居" icon="el-icon-share">
        <template #extra>共 {{ bgpNeighbors.length }} 个邻居</template>
        <el-empty v-if="!bgpNeighbors.length" description="暂无 BGP 邻居" />
        <el-table v-else :data="bgpNeighbors" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="neighbor" label="邻居地址" min-width="160">
          <template slot-scope="{ row }">
            <span class="mono">{{ row.neighbor || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="AS" width="120" align="center">
          <template slot-scope="{ row }">{{ val(row.as) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template slot-scope="{ row }">
            <el-tag size="small" :color="bgpStateColor(row.state)" effect="dark" class="plain-tag">
              {{ row.state || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="运行时长" min-width="140">
          <template slot-scope="{ row }">{{ val(row.uptime) }}</template>
        </el-table-column>
        <el-table-column label="收到前缀" width="120" align="center">
          <template slot-scope="{ row }">{{ num0(row.prefixReceived) }}</template>
        </el-table-column>
      </el-table>
      </SectionCard>

      <SectionCard dense scrollable title="OSPF" icon="el-icon-connection">
        <InfoTable :rows="ospfRows" />
      </SectionCard>
      <SectionCard dense scrollable title="LLDP" icon="el-icon-discover">
        <InfoTable :rows="lldpRows" />
      </SectionCard>

      <SectionCard dense scrollable body-class="dense-table fill" title="链路聚合 (LAG)" icon="el-icon-c-scale-to-original">
        <template #extra>共 {{ lagChannels.length }} 个聚合组</template>
        <el-empty v-if="!lagChannels.length" description="暂无链路聚合" />
        <el-table v-else :data="lagChannels" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="聚合组" min-width="140">
          <template slot-scope="{ row }">
            <span class="mono">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成员数" width="110" align="center">
          <template slot-scope="{ row }">{{ num0(row.members) }}</template>
        </el-table-column>
        <el-table-column label="活动成员" width="120" align="center">
          <template slot-scope="{ row }">
            <span :class="{ 'warn-val': isDegraded(row) }">{{ num0(row.activeMembers) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140">
          <template slot-scope="{ row }">
            <el-tag size="small" :color="lagStatusColor(row.status)" effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总带宽" min-width="120">
          <template slot-scope="{ row }">{{ val(row.totalSpeed) }}</template>
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
import { getNetDevProtocols } from "@/api/monitor-netdev";

export default {
  name: "NetDevProtocols",
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
    bgp() {
      return this.d.bgp || {};
    },
    ospf() {
      return this.d.ospf || {};
    },
    lag() {
      return this.d.lag || {};
    },
    lldp() {
      return this.d.lldp || {};
    },
    bgpNeighbors() {
      return this.bgp.neighbors || [];
    },
    lagChannels() {
      return this.lag.channels || [];
    },
    ospfRows() {
      const v = this.ospf;
      return [
        { label: "邻居数", value: this.val(v.neighbors) },
        { label: "区域数", value: this.val(v.areas) },
        { label: "状态", value: this.val(v.state), color: this.ospfStateColor(v.state) },
      ];
    },
    lldpRows() {
      const v = this.lldp;
      return [
        { label: "邻居数", value: this.val(v.neighbors) },
        { label: "发现设备数", value: this.val(v.discoveredDevices) },
      ];
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
      return v === undefined || v === null ? "0" : Number(v).toFixed(0);
    },
    isDegraded(row) {
      return (row.status || "").toLowerCase() === "degraded";
    },
    bgpStateColor(s) {
      return s === "Established" ? "#67c23a" : "#e6a23c";
    },
    lagStatusColor(s) {
      const v = (s || "").toLowerCase();
      if (v === "up" || v === "active" || v === "normal") return "#67c23a";
      if (v === "degraded") return "#e6a23c";
      if (v === "down" || v === "failed") return "#f56c6c";
      return "#909399";
    },
    ospfStateColor(s) {
      const v = (s || "").toLowerCase();
      if (v === "full" || v === "normal" || v === "up") return "#67c23a";
      if (v === "down" || v === "failed") return "#f56c6c";
      return "#303133";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getNetDevProtocols(this.deviceId);
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
.warn-val {
  color: #e6a23c;
  font-weight: 600;
}
</style>
