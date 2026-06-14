<template>
  <div v-loading="loading" class="tab-pane">
    <!-- 插座回路 (PDU) -->
    <template v-if="d.type === 'outlet'">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-menu" label="插座总数" :value="num0(d.outletTotal)"
            sub="物理插座数" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-circle-check" label="使用中" :value="num0(d.outletActive)"
            sub="已上电插座" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-lightning" label="总功率"
            :value="`${num1(d.totalPowerW)} W`" sub="实时总功率" color="#e6a23c" />
        </el-col>
      </el-row>

      <SectionCard title="插座列表" icon="el-icon-menu">
        <template #extra>共 {{ items.length }} 个插座</template>
        <el-empty v-if="!items.length" description="暂无数据" />
        <el-table v-else :data="items" size="small" stripe>
          <el-table-column prop="name" label="名称" min-width="140" fixed>
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
    </template>

    <!-- 相位回路 (UPS / METER) -->
    <template v-else-if="d.type === 'phase'">
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-share" label="相数" :value="num0(d.phaseCount)"
            sub="供电相位数" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-lightning" label="总功率"
            :value="`${num1(d.totalPowerKw)} kW`" sub="三相合计" color="#67c23a" />
        </el-col>
        <el-col :xs="24" :sm="8">
          <StatCard icon="el-icon-warning-outline" label="不平衡度"
            :value="`${num1(d.imbalancePct)}%`" :percent="d.imbalancePct" color="#e6a23c" />
        </el-col>
      </el-row>

      <SectionCard title="相位列表" icon="el-icon-share">
        <template #extra>共 {{ items.length }} 个相位</template>
        <el-empty v-if="!items.length" description="暂无数据" />
        <el-table v-else :data="items" size="small" stripe>
          <el-table-column prop="phase" label="相位" min-width="120" fixed>
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
    </template>

    <el-empty v-else description="暂无回路数据" />
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getPowerCircuits } from "@/api/monitor-power";

export default {
  name: "PowerCircuits",
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
      this.loading = true;
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
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
