<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="260px" gap="8px" class="kpi-grid">
      <section-card dense title="CPU" icon="el-icon-cpu">
        <InfoTable :rows="cpuRows" />
        <el-progress :percentage="clamp(cpu.usedPct)" :stroke-width="12" :text-inside="true" :color="pctColor(cpu.usedPct)" style="margin-top:6px" />
      </section-card>
      <section-card dense title="内存" icon="el-icon-coin">
        <InfoTable :rows="memRows" />
        <el-progress :percentage="clamp(memory.usedPct)" :stroke-width="12" :text-inside="true" :color="pctColor(memory.usedPct)" style="margin-top:6px" />
      </section-card>
      <section-card dense title="存储" icon="el-icon-folder-opened">
        <InfoTable :rows="storageRows" />
        <el-progress :percentage="clamp(storage.usedPct)" :stroke-width="12" :text-inside="true" :color="pctColor(storage.usedPct)" style="margin-top:6px" />
      </section-card>
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="360px" gap="8px">
        <section-card dense scrollable body-class="dense-table fill" class="fill" title="每宿主容量" icon="el-icon-s-grid">
          <el-table :data="d.hosts || []" size="small" stripe class="dense-table" height="100%">
            <el-table-column prop="name" label="宿主" min-width="120" />
            <el-table-column prop="cpuCores" label="物理核" width="90" align="center" />
            <el-table-column prop="vcpuAllocated" label="已分 vCPU" width="100" align="center" />
            <el-table-column prop="memGb" label="内存 GB" width="100" align="center" />
            <el-table-column label="内存分配%" min-width="150">
              <template slot-scope="{ row }">
                <el-progress :percentage="clamp(row.memAllocPct)" :stroke-width="12" :text-inside="true" :color="pctColor(row.memAllocPct)" />
              </template>
            </el-table-column>
            <el-table-column prop="guestCount" label="承载数" width="90" align="center" />
          </el-table>
          <el-empty v-if="!(d.hosts || []).length" description="暂无数据" />
        </section-card>

        <section-card dense scrollable body-class="dense-table fill" class="fill" title="Top 资源消耗" icon="el-icon-data-line">
          <el-table :data="d.topGuests || []" size="small" stripe class="dense-table" height="100%">
            <el-table-column prop="name" label="名称" min-width="120" />
            <el-table-column prop="vcpu" label="vCPU" width="80" align="center" />
            <el-table-column prop="memGb" label="内存 GB" width="100" align="center" />
            <el-table-column label="CPU%" min-width="150">
              <template slot-scope="{ row }">
                <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12" :text-inside="true" :color="pctColor(row.cpuPct)" />
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!(d.topGuests || []).length" description="暂无数据" />
        </section-card>
      </card-grid>
    </div>
  </div>
</template>

<script>
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getVirtCapacity } from "@/api/monitor-virt";

export default {
  name: "VirtCapacity",
  components: { SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    cpu() {
      return this.d.cpu || {};
    },
    memory() {
      return this.d.memory || {};
    },
    storage() {
      return this.d.storage || {};
    },
    cpuRows() {
      const c = this.cpu;
      return [
        { label: "物理核", value: this.val(c.physicalCores) },
        { label: "已分配 vCPU", value: this.val(c.allocatedVcpu) },
        { label: "超分比", value: c.overcommitRatio != null ? `${c.overcommitRatio}x` : "-" },
        { label: "使用率", value: c.usedPct != null ? `${c.usedPct}%` : "-" },
      ];
    },
    memRows() {
      const m = this.memory;
      return [
        { label: "总量", value: m.totalGb != null ? `${m.totalGb} GB` : "-" },
        { label: "已分配", value: m.allocatedGb != null ? `${m.allocatedGb} GB` : "-" },
        { label: "超分比", value: m.overcommitRatio != null ? `${m.overcommitRatio}x` : "-" },
        { label: "使用率", value: m.usedPct != null ? `${m.usedPct}%` : "-" },
      ];
    },
    storageRows() {
      const s = this.storage;
      return [
        { label: "总量", value: s.totalGb != null ? `${s.totalGb} GB` : "-" },
        { label: "已分配(精简)", value: s.provisionedGb != null ? `${s.provisionedGb} GB` : "-" },
        { label: "已用", value: s.usedGb != null ? `${s.usedGb} GB` : "-" },
        { label: "精简超配比", value: s.thinProvisionRatio != null ? `${s.thinProvisionRatio}x` : "-" },
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
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#f56c6c";
      if (n >= 75) return "#e6a23c";
      return "#67c23a";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && Object.keys(this.d).length;
      if (!hasData) this.loading = true;
      try {
        const res = await getVirtCapacity(this.deviceId);
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
  &__main {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}
.kpi-grid {
  flex-shrink: 0;
}
</style>
