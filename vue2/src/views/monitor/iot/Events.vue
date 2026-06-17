<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-bell" label="事件总数" :value="num0(d.total)"
        sub="累计事件数" color="#409eff" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable title="事件列表" icon="el-icon-warning-outline"
        body-class="dense-table fill" class="fill">
        <template #extra>共 {{ items.length }} 条事件</template>
        <el-empty v-if="!items.length" description="暂无数据" />
        <el-table v-else :data="items" class="dense-table" height="100%" size="small" stripe>
          <el-table-column label="时间" min-width="170" fixed>
            <template slot-scope="{ row }">{{ val(row.time) }}</template>
          </el-table-column>
          <el-table-column label="传感器" min-width="140">
            <template slot-scope="{ row }">{{ val(row.sensor) }}</template>
          </el-table-column>
          <el-table-column label="类型" width="140">
            <template slot-scope="{ row }">{{ val(row.type) }}</template>
          </el-table-column>
          <el-table-column label="级别" width="110">
            <template slot-scope="{ row }">
              <el-tag size="small" :color="levelColor(row.level)" effect="dark" class="plain-tag">
                {{ row.level || "-" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="220">
            <template slot-scope="{ row }">{{ val(row.desc) }}</template>
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
import { getIotEvents } from "@/api/monitor-iot";

export default {
  name: "IotEvents",
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
    levelColor(level) {
      const s = (level || "").toString().toLowerCase();
      if (["critical", "high", "fatal", "error"].includes(s)) return "#f56c6c";
      if (["warning", "warn", "medium"].includes(s)) return "#e6a23c";
      if (["info", "low", "normal"].includes(s)) return "#67c23a";
      return "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getIotEvents(this.deviceId);
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
.plain-tag {
  border: none;
  color: var(--cm-bg-card, @bg-card);
}
</style>
