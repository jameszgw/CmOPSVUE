<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-mobile-phone" label="实例总数"
        :value="num0(d.total)" :sub="`展示 ${num0(d.shown)}`" color="#409eff" />
    </card-grid>

    <card-grid class="fill" min="420px" gap="8px">
      <SectionCard dense scrollable title="实例列表" icon="el-icon-mobile-phone"
        body-class="dense-table fill" class="fill">
        <template #extra>共 {{ items.length }} 个实例</template>
        <el-table :data="items" class="dense-table" height="100%" size="small" stripe>
          <el-table-column prop="name" label="实例" min-width="140" />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="statusTag(row.status)" effect="dark">{{ val(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="androidVer" label="版本" width="90" align="center">
          <template slot-scope="{ row }">{{ val(row.androidVer) }}</template>
        </el-table-column>
        <el-table-column prop="resolution" label="分辨率" width="120" align="center">
          <template slot-scope="{ row }">{{ val(row.resolution) }}</template>
        </el-table-column>
        <el-table-column label="CPU" min-width="150">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.cpuPct)" :stroke-width="12" :text-inside="true" color="#409eff" />
          </template>
        </el-table-column>
        <el-table-column label="内存" width="100" align="right">
          <template slot-scope="{ row }">{{ num0(row.memMb) }} MB</template>
        </el-table-column>
        <el-table-column label="FPS" width="80" align="center">
          <template slot-scope="{ row }">{{ num0(row.fps) }}</template>
        </el-table-column>
        <el-table-column label="网络" width="100" align="right">
          <template slot-scope="{ row }">{{ num0(row.netKbps) }} Kbps</template>
        </el-table-column>
        <el-table-column label="电量" width="80" align="center">
          <template slot-scope="{ row }">{{ battery(row.batteryPct) }}</template>
        </el-table-column>
        <el-table-column prop="app" label="应用" min-width="140">
          <template slot-scope="{ row }">{{ val(row.app) }}</template>
        </el-table-column>
        <el-table-column label="ROOT" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.rooted ? 'warning' : 'info'">{{ row.rooted ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="ADB" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.adb ? 'success' : 'info'">{{ row.adb ? "已连接" : "未连接" }}</el-tag>
          </template>
        </el-table-column>
          <el-table-column prop="uptime" label="运行时间" min-width="120">
            <template slot-scope="{ row }">{{ val(row.uptime) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!items.length" description="暂无实例数据" />
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getAndroidInstances } from "@/api/monitor-android";

const STATUS_TAG = {
  Online: "success", Running: "success", Healthy: "success",
  Warning: "warning", Busy: "warning", Starting: "warning",
  Offline: "danger", Crashed: "danger", Error: "danger",
};

export default {
  name: "AndroidInstances",
  components: { StatCard, SectionCard, CardGrid },
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
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    statusTag(s) {
      return STATUS_TAG[s] || "info";
    },
    battery(v) {
      if (v === undefined || v === null || v === "" || v === "NA") return "NA";
      const n = Number(v);
      return Number.isNaN(n) ? this.val(v) : `${n.toFixed(0)}%`;
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getAndroidInstances(this.deviceId);
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
