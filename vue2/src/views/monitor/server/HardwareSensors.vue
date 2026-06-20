<template>
  <div v-loading="loading" class="tab-pane">
    <el-empty v-if="d.noData" :description="d.message || '暂无数据'" :image-size="120" />
    <UnsupportedMask
      v-else
      :unsupported="d.supported === false"
      :reason="d.note"
      title="无物理硬件传感器"
    >
      <CardGrid min="180px" gap="8px" class="kpi-row">
        <StatCard dense icon="el-icon-circle-check" label="整体健康"
          :value="summary.overallHealth || '-'"
          :color="summary.overallHealth === '正常' ? '#67c23a' : '#f56c6c'"
          :sub="`异常传感器 ${summary.criticalSensors || 0} 个`" />
        <StatCard dense icon="el-icon-odometer" label="温度传感器" :value="summary.tempSensors || 0"
          :sub="`采集方式 ${d.bmc || '-'}`" color="#e6a23c" />
        <StatCard dense icon="el-icon-cpu" label="风扇 / 电源"
          :value="`${summary.fanCount || 0} / ${summary.psuCount || 0}`"
          sub="风扇 / 电源模块" color="#409eff" />
        <StatCard dense icon="el-icon-files" label="物理磁盘" :value="summary.diskCount || 0"
          sub="SMART 监测" color="#909399" />
      </CardGrid>

      <div class="body-grid">
        <SectionCard dense title="温度传感器" icon="el-icon-odometer" class="span-2">
          <div class="sensor-grid">
            <div v-for="t in d.temperature || []" :key="t.name" class="sensor" :class="t.status">
              <div class="sensor__name">{{ t.name }}</div>
              <div class="sensor__val">{{ t.value }}<span class="sensor__unit">{{ t.unit }}</span></div>
              <el-tag :type="tagType(t.status)" size="mini" effect="plain">{{ statusText(t.status) }}</el-tag>
            </div>
          </div>
        </SectionCard>

        <SectionCard dense title="风扇" icon="el-icon-refresh" body-class="dense-table" scrollable>
          <el-table class="dense-table" :data="d.fans || []" max-height="180" size="small" stripe>
            <el-table-column prop="name" label="风扇" width="80" />
            <el-table-column label="转速">
              <template slot-scope="{ row }">{{ row.rpm }} RPM</template>
            </el-table-column>
            <el-table-column label="占比" width="130">
              <template slot-scope="{ row }">
                <el-progress :percentage="clamp(row.pct)" :stroke-width="6"
                  :color="row.status === 'normal' ? '#409eff' : '#f56c6c'" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template slot-scope="{ row }">
                <el-tag :type="tagType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </SectionCard>

        <SectionCard dense title="电源模块" icon="el-icon-lightning" body-class="dense-table" scrollable>
          <el-table class="dense-table" :data="d.power || []" max-height="180" size="small" stripe>
            <el-table-column prop="name" label="电源" width="80" />
            <el-table-column label="功率">
              <template slot-scope="{ row }">{{ row.watt }} W / {{ row.capacity }} W</template>
            </el-table-column>
            <el-table-column prop="inputVoltage" label="输入电压" width="100" />
            <el-table-column label="状态" width="80">
              <template slot-scope="{ row }">
                <el-tag :type="tagType(row.status)" size="mini">{{ statusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </SectionCard>

        <SectionCard v-if="d.raid" dense title="RAID 卡" icon="el-icon-coin" class="span-2" body-class="dense-table" scrollable>
          <template #extra>
            <el-tag :type="d.raid.status === 'Optimal' ? 'success' : 'danger'" size="mini">{{ d.raid.status }}</el-tag>
          </template>
          <InfoTable :rows="raidRows" :columns="2" />
          <el-table class="dense-table" :data="d.raid.logicalDrives || []" max-height="160" size="small" stripe style="margin-top: 8px">
            <el-table-column prop="name" label="逻辑盘" width="100" />
            <el-table-column prop="level" label="级别" width="100" />
            <el-table-column label="容量"><template slot-scope="{ row }">{{ row.sizeTB }} TB</template></el-table-column>
            <el-table-column label="状态" width="120">
              <template slot-scope="{ row }">
                <el-tag :type="row.status === 'Optimal' ? 'success' : 'danger'" size="mini">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </SectionCard>

        <SectionCard dense title="硬盘 SMART" icon="el-icon-files" class="span-2 fill smart-card" body-class="dense-table fill" scrollable>
          <el-table class="dense-table" :data="d.disks || []" height="100%" size="small" stripe>
            <el-table-column prop="slot" label="槽位" width="80" />
            <el-table-column prop="model" label="型号" min-width="160" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="capacity" label="容量" width="80" />
            <el-table-column label="温度" width="80">
              <template slot-scope="{ row }">
                <span :style="{ color: row.temperature > 70 ? '#f56c6c' : '#303133' }">{{ row.temperature }}°C</span>
              </template>
            </el-table-column>
            <el-table-column label="重映射扇区" width="100">
              <template slot-scope="{ row }">
                <span :style="{ color: row.reallocatedSectors > 100 ? '#e6a23c' : '#303133' }">{{ row.reallocatedSectors }}</span>
              </template>
            </el-table-column>
            <el-table-column label="磨损/备件" width="120">
              <template slot-scope="{ row }">
                <span v-if="row.wearLevelPct != null">磨损 {{ row.wearLevelPct }}% / 备件 {{ row.availableSparePct }}%</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="通电时长" width="100">
              <template slot-scope="{ row }">{{ row.powerOnHours }} h</template>
            </el-table-column>
            <el-table-column label="健康" width="80">
              <template slot-scope="{ row }">
                <el-tag :type="diskTag(row.health)" size="mini">{{ diskText(row.health) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </SectionCard>
      </div>
    </UnsupportedMask>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import UnsupportedMask from "@/components/monitor/UnsupportedMask.vue";
import { getServerHardware } from "@/api/monitor-server";

export default {
  name: "ServerHardwareSensors",
  components: { StatCard, SectionCard, InfoTable, CardGrid, UnsupportedMask },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    summary() {
      return this.d.summary || {};
    },
    raidRows() {
      const r = this.d.raid || {};
      return [
        { label: "控制器", value: r.controller },
        { label: "固件", value: r.firmware },
        { label: "电池", value: r.batteryStatus, color: r.batteryStatus === "Healthy" ? "#67c23a" : "#f56c6c" },
        { label: "缓存策略", value: r.cacheStatus },
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
    clamp(v) {
      return Math.max(0, Math.min(100, Number(v) || 0));
    },
    tagType(s) {
      return s === "critical" ? "danger" : s === "warning" ? "warning" : "success";
    },
    statusText(s) {
      return s === "critical" ? "异常" : s === "warning" ? "警告" : "正常";
    },
    diskTag(h) {
      return h === "failed" ? "danger" : h === "warning" ? "warning" : "success";
    },
    diskText(h) {
      return h === "failed" ? "故障" : h === "warning" ? "警告" : "正常";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getServerHardware(this.deviceId);
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.kpi-row {
  flex-shrink: 0;
  margin-bottom: @dense-gap;
}
.body-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: @dense-gap;
  align-content: start;
}
.span-2 {
  grid-column: 1 / -1;
}
.smart-card {
  min-height: 200px;
}
.sensor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: @space-sm;
}
.sensor {
  border: 1px solid var(--cm-bg-page, @bg-page);
  border-radius: 6px;
  padding: 8px;
  text-align: center;

  &__name {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
  &__val {
    font-size: 18px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    margin: 4px 0;
  }
  &__unit {
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
    margin-left: 2px;
  }
  &.warning {
    border-color: #faecd8;
    background: #fdf6ec;
  }
  &.critical {
    border-color: #fde2e2;
    background: #fef0f0;
  }
}
</style>
