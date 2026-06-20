<template>
  <div v-loading="loading" class="tab-screen">
    <!-- 插座回路 (PDU) -->
    <template v-if="d.type === 'outlet'">
      <card-grid min="200px" gap="8px">
        <StatCard dense icon="el-icon-menu" label="插座总数" :value="num0(d.outletTotal)"
          sub="物理插座数" color="#409eff" />
        <StatCard dense icon="el-icon-circle-check" label="使用中" :value="num0(d.outletActive)"
          sub="已上电插座" color="#67c23a" />
        <StatCard dense icon="el-icon-lightning" label="总功率"
          :value="`${num1(d.totalPowerW)} W`" sub="实时总功率" color="#e6a23c" />
      </card-grid>

      <card-grid class="fill" min="420px" gap="8px">
        <SectionCard dense scrollable title="插座列表" icon="el-icon-menu"
          body-class="dense-table fill" class="fill">
          <template #extra>共 {{ items.length }} 个插座</template>
          <el-empty v-if="!items.length" description="暂无数据" />
          <el-table v-else :data="items" class="dense-table" height="100%" size="small" stripe>
            <el-table-column prop="name" label="名称" min-width="140" fixed show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span class="mono">{{ row.name || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="电流" width="120" align="right">
              <template slot-scope="{ row }">{{ num1(row.current) }} A</template>
            </el-table-column>
            <el-table-column label="功率" width="120" align="right">
              <template slot-scope="{ row }">{{ num1(row.powerW) }} W</template>
            </el-table-column>
            <el-table-column label="电压" width="120" align="right">
              <template slot-scope="{ row }">{{ num1(row.voltage) }} V</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template slot-scope="{ row }">
                <el-tag size="small" :color="statusColor(row.status)" effect="dark" class="plain-tag">
                  {{ row.status || "-" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </SectionCard>
      </card-grid>
    </template>

    <!-- 相位回路 (UPS / METER) -->
    <template v-else-if="d.type === 'phase'">
      <card-grid min="200px" gap="8px">
        <StatCard dense icon="el-icon-share" label="相数" :value="num0(d.phaseCount)"
          sub="供电相位数" color="#409eff" />
        <StatCard dense icon="el-icon-lightning" label="总功率"
          :value="`${num1(d.totalPowerKw)} kW`" sub="三相合计" color="#67c23a" />
        <StatCard dense icon="el-icon-warning-outline" label="不平衡度"
          :value="`${num1(d.imbalancePct)}%`" :percent="d.imbalancePct" color="#e6a23c" />
      </card-grid>

      <card-grid class="fill" min="420px" gap="8px">
        <SectionCard dense scrollable title="相位列表" icon="el-icon-share"
          body-class="dense-table fill" class="fill">
          <template #extra>共 {{ items.length }} 个相位</template>
          <el-empty v-if="!items.length" description="暂无数据" />
          <el-table v-else :data="items" class="dense-table" height="100%" size="small" stripe>
            <el-table-column prop="phase" label="相位" min-width="120" fixed show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span class="mono">{{ row.phase || "-" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="电压" width="130" align="right">
              <template slot-scope="{ row }">{{ num1(row.voltage) }} V</template>
            </el-table-column>
            <el-table-column label="电流" width="130" align="right">
              <template slot-scope="{ row }">{{ num1(row.current) }} A</template>
            </el-table-column>
            <el-table-column label="功率" width="130" align="right">
              <template slot-scope="{ row }">{{ num1(row.powerKw) }} kW</template>
            </el-table-column>
            <el-table-column label="功率因数" width="130" align="right">
              <template slot-scope="{ row }">{{ num1(row.powerFactor) }}</template>
            </el-table-column>
          </el-table>
        </SectionCard>
      </card-grid>
    </template>

    <el-empty v-else description="暂无回路数据" />
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getPowerCircuits } from "@/api/monitor-power";

export default {
  name: "PowerCircuits",
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
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    statusColor(s) {
      if (["on", "active", "online", "normal", "On", "Active", "Online", "Normal"].includes(s)) return "#67c23a";
      if (["warning", "degraded", "Warning", "Degraded"].includes(s)) return "#e6a23c";
      if (["off", "down", "offline", "failed", "fault", "Off", "Down", "Offline", "Failed", "Fault"].includes(s)) return "#f56c6c";
      return "#909399";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getPowerCircuits(this.deviceId);
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
</style>
