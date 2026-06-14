<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="el-icon-bell" label="事件总数" :value="num0(d.total)"
          sub="累计事件数" color="#409eff" />
      </el-col>
    </el-row>

    <SectionCard title="事件列表" icon="el-icon-warning-outline">
      <template #extra>共 {{ items.length }} 条事件</template>
      <el-empty v-if="!items.length" description="暂无数据" />
      <el-table v-else :data="items" size="small" stripe>
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
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getIotEvents } from "@/api/monitor-iot";

export default {
  name: "IotEvents",
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card, @bg-card);
}
</style>
