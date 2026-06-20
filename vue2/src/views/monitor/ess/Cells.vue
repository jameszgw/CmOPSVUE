<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid min="200px" gap="8px">
      <StatCard dense icon="el-icon-files" label="电池簇"
        :value="num0(d.packs)" :sub="`电芯总数 ${num0(d.cellTotal)}`" color="#409eff" />
      <StatCard dense icon="el-icon-cpu" label="电芯总数"
        :value="num0(d.cellTotal)" :sub="`每簇 ${num0(d.cellsPerPack)} 节`" color="#67c23a" />
      <StatCard dense icon="el-icon-lightning" label="压差"
        :value="`${num0(d.cellVoltDiff)} mV`" :sub="`${num1(d.cellVoltMin)} ~ ${num1(d.cellVoltMax)} V`"
        color="#e6a23c" />
      <StatCard dense icon="el-icon-warning-outline" label="温差"
        :value="`${num1(d.cellTempDiff)} ℃`" :sub="`${num1(d.cellTempMin)} ~ ${num1(d.cellTempMax)} ℃`"
        color="#f56c6c" />
    </card-grid>

    <card-grid class="fill" min="420px" gap="8px">
      <SectionCard dense scrollable title="电芯汇总" icon="el-icon-info" class="fill">
        <InfoTable :rows="summaryRows" :columns="2" />
      </SectionCard>

      <SectionCard dense scrollable title="电池簇列表" icon="el-icon-menu"
        body-class="dense-table fill" class="fill">
        <template #extra>共 {{ items.length }} 个电池簇</template>
        <el-empty v-if="!items.length" description="暂无数据" />
        <el-table v-else :data="items" class="dense-table" height="100%" size="small" stripe>
          <el-table-column prop="packId" label="电池簇" min-width="140" fixed>
            <template slot-scope="{ row }">
              <span class="mono">{{ row.packId || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="电压" width="120">
            <template slot-scope="{ row }">{{ num1(row.voltage) }} V</template>
          </el-table-column>
          <el-table-column label="最高温度" width="120">
            <template slot-scope="{ row }">{{ num1(row.tempMax) }} ℃</template>
          </el-table-column>
          <el-table-column label="SOC" min-width="200">
            <template slot-scope="{ row }">
              <el-progress :percentage="clamp(row.socPct)" :stroke-width="10"
                :color="pctColor(row.socPct)" />
            </template>
          </el-table-column>
          <el-table-column label="均衡" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="row.balancing ? 'warning' : 'info'" effect="plain">
                {{ row.balancing ? "均衡中" : "正常" }}
              </el-tag>
            </template>
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
import { getEssCells } from "@/api/monitor-ess";

export default {
  name: "EssCells",
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
    summaryRows() {
      const d = this.d;
      return [
        { label: "每簇电芯数", value: this.num0(d.cellsPerPack) },
        { label: "均衡状态", value: d.balancing ? "均衡中" : "正常",
          color: d.balancing ? "#e6a23c" : "#67c23a" },
        { label: "最低电压", value: this.unit3(d.cellVoltMin, "V"), color: "#409eff" },
        { label: "最高电压", value: this.unit3(d.cellVoltMax, "V"), color: "#f56c6c" },
        { label: "压差", value: this.unit0(d.cellVoltDiff, "mV"), color: "#e6a23c" },
        { label: "温差", value: this.unit1(d.cellTempDiff, "℃"), color: "#e6a23c" },
        { label: "最低温度", value: this.unit1(d.cellTempMin, "℃"), color: "#409eff" },
        { label: "最高温度", value: this.unit1(d.cellTempMax, "℃"), color: "#f56c6c" },
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
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    unit0(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(0)} ${u}`;
    },
    unit1(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(1)} ${u}`;
    },
    unit3(v, u) {
      return v === undefined || v === null ? "-" : `${Number(v).toFixed(3)} ${u}`;
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    pctColor(v) {
      const n = Number(v) || 0;
      if (n >= 90) return "#67c23a";
      if (n >= 30) return "#409eff";
      return "#e6a23c";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getEssCells(this.deviceId);
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
</style>
