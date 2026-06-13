<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-cpu" label="GPU 总数"
          :value="num0(d.total)" sub="GPU 卡数量" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-warning-outline" label="高温卡数"
          :value="num0(d.hotCount)" sub="温度过高" color="#f56c6c" />
      </el-col>
    </el-row>

    <SectionCard title="GPU 卡列表" icon="el-icon-cpu">
      <template #extra>共 {{ gpus.length }} 张卡</template>
      <el-table :data="gpus" size="small" stripe>
        <el-table-column prop="index" label="#" width="60" align="center" />
        <el-table-column prop="model" label="型号" min-width="180" />
        <el-table-column label="利用率" min-width="200">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.utilizationPct)" :stroke-width="12" :text-inside="true" color="#e6a23c" />
          </template>
        </el-table-column>
        <el-table-column label="显存" min-width="200">
          <template slot-scope="{ row }">
            <el-progress :percentage="clamp(row.memUsagePct)" :stroke-width="12" :text-inside="true" color="#67c23a" />
            <div class="mem-text">{{ val(row.memUsed) }} / {{ val(row.memTotal) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="温度" width="90" align="center">
          <template slot-scope="{ row }">
            <span :style="{ color: row.hot ? '#f56c6c' : '#303133', fontWeight: row.hot ? 600 : 400 }">
              {{ num0(row.temperature) }}℃
            </span>
          </template>
        </el-table-column>
        <el-table-column label="功耗" width="100" align="right">
          <template slot-scope="{ row }">{{ num0(row.powerW) }} W</template>
        </el-table-column>
        <el-table-column label="风扇" width="80" align="right">
          <template slot-scope="{ row }">{{ num0(row.fanPct) }}%</template>
        </el-table-column>
        <el-table-column prop="processes" label="进程数" width="90" align="center" />
        <el-table-column label="ECC 错误" width="100" align="center">
          <template slot-scope="{ row }">
            <span :style="{ color: Number(row.eccErrors) > 0 ? '#f56c6c' : '#303133' }">{{ num0(row.eccErrors) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!gpus.length" description="暂无 GPU 数据" />
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getGpuCards } from "@/api/monitor-gpu";

export default {
  name: "GpuGpus",
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
    gpus() {
      return this.d.gpus || [];
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
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getGpuCards(this.deviceId);
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
.mem-text {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}
</style>
