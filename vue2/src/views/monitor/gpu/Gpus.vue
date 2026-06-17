<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-cpu" label="GPU 总数"
        :value="num0(d.total)" sub="GPU 卡数量" color="#409eff" />
      <StatCard dense icon="el-icon-warning-outline" label="高温卡数"
        :value="num0(d.hotCount)" sub="温度过高" color="#f56c6c" />
    </card-grid>

    <card-grid class="fill" min="300px" gap="8px">
      <SectionCard dense scrollable title="GPU 卡列表" icon="el-icon-cpu" body-class="dense-table fill">
        <template #extra>共 {{ gpus.length }} 张卡</template>
        <el-table :data="gpus" size="small" stripe class="dense-table" height="100%">
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
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getGpuCards } from "@/api/monitor-gpu";

export default {
  name: "GpuGpus",
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
@import (reference) "@/styles/variables.less";
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  overflow: hidden;
}
.mem-text {
  margin-top: 2px;
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
</style>
