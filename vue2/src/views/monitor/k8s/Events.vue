<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-bell" label="事件总数"
        :value="val(d.total)" color="#409eff" />
      <stat-card dense icon="el-icon-warning-outline" label="警告"
        :value="val(d.warningCount)" color="#e6a23c" />
      <stat-card dense icon="el-icon-success" label="正常"
        :value="val(d.normalCount)" color="#67c23a" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="事件列表" icon="el-icon-tickets">
      <template #extra>
        <el-select v-model="eventFilter" size="mini" placeholder="全部" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="Warning" value="Warning" />
          <el-option label="Normal" value="Normal" />
        </el-select>
      </template>

      <el-table v-if="filteredEvents.length" :data="filteredEvents" size="small" stripe class="dense-table" height="100%">
        <el-table-column label="类型" width="110">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="row.type === 'Warning' ? 'warning' : 'info'"
              effect="plain">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" width="160" />
        <el-table-column prop="object" label="对象" min-width="180" />
        <el-table-column prop="namespace" label="命名空间" width="140" />
        <el-table-column prop="message" label="消息" min-width="240" show-overflow-tooltip />
        <el-table-column prop="count" label="次数" width="90" />
        <el-table-column prop="lastTime" label="最近时间" width="180" />
      </el-table>
      <el-empty v-else description="暂无事件" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getK8sEvents } from "@/api/monitor-k8s";

export default {
  name: "K8sEvents",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, eventFilter: "" };
  },
  computed: {
    filteredEvents() {
      const list = this.d.events || [];
      if (!this.eventFilter) return list;
      return list.filter((e) => e.type === this.eventFilter);
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
      return v === undefined || v === null ? "-" : v;
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getK8sEvents(this.deviceId);
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
</style>
