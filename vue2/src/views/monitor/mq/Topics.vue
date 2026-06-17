<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-collection" label="主题数"
        :value="num0(d.topicCount)" sub="Topic 总数" color="#409eff" />
      <stat-card dense icon="el-icon-s-grid" label="分区数"
        :value="num0(d.partitionCount)" sub="Partition 总数" color="#67c23a" />
      <stat-card dense icon="el-icon-warning-outline" label="倾斜主题"
        :value="num0(d.skewedCount)" sub="分区倾斜" :color="d.skewedCount > 0 ? '#f56c6c' : '#67c23a'" />
    </card-grid>

    <section-card dense scrollable class="fill" body-class="dense-table fill" title="主题列表" icon="el-icon-s-grid">
      <template #extra>共 {{ topics.length }} 个主题</template>
      <el-table :data="topics" size="small" stripe class="dense-table" height="100%">
        <el-table-column prop="name" label="名称" min-width="180" fixed />
        <el-table-column prop="partitions" label="分区" width="90" align="center" />
        <el-table-column prop="replicas" label="副本" width="90" align="center" />
        <el-table-column label="消息数" width="120" align="right">
          <template slot-scope="{ row }">{{ num0(row.messages) }}</template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="110" align="right" />
        <el-table-column label="生产速率" width="120" align="right">
          <template slot-scope="{ row }">{{ num0(row.inRate) }} msg/s</template>
        </el-table-column>
        <el-table-column label="消费速率" width="120" align="right">
          <template slot-scope="{ row }">{{ num0(row.outRate) }} msg/s</template>
        </el-table-column>
        <el-table-column label="分区倾斜" min-width="160">
          <template slot-scope="{ row }">
            <span v-if="row.skewed" :style="{ color: '#f56c6c', fontWeight: 600 }">{{ num1(row.partitionSkewPct) }}%</span>
            <span v-else style="color:#67c23a">{{ num1(row.partitionSkewPct) }}%</span>
            <el-tag v-if="row.skewed" size="mini" type="danger" effect="dark" style="margin-left:8px">倾斜</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!topics.length" description="暂无主题数据" />
    </section-card>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getMqTopics } from "@/api/monitor-mq";

export default {
  name: "MqTopics",
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
    topics() {
      return this.d.topics || [];
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
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getMqTopics(this.deviceId);
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
}
.kpi-grid {
  flex-shrink: 0;
}
</style>
