<template>
  <div v-loading="loading" class="tab-pane">
    <el-alert
      v-if="d.supported === false"
      :title="d.note || '该设备无物理硬件传感器'"
      type="info"
      :closable="false"
      show-icon
    />

    <template v-else>
      <el-row :gutter="12" class="stat-row">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="CircleCheck" label="整体健康"
            :value="d.summary?.overallHealth || '-'"
            :color="d.summary?.overallHealth === '正常' ? '#67c23a' : '#f56c6c'"
            :sub="`异常传感器 ${d.summary?.criticalSensors ?? 0} 个`" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Odometer" label="温度传感器" :value="d.summary?.tempSensors ?? 0"
            :sub="`采集方式 ${d.bmc || '-'}`" color="#e6a23c" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Cpu" label="风扇 / 电源" :value="`${d.summary?.fanCount ?? 0} / ${d.summary?.psuCount ?? 0}`"
            sub="风扇 / 电源模块" color="#409eff" />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard icon="Files" label="物理磁盘" :value="d.summary?.diskCount ?? 0"
            sub="SMART 监测" color="#909399" />
        </el-col>
      </el-row>

      <SectionCard title="温度传感器" icon="Odometer">
        <el-row :gutter="12">
          <el-col v-for="t in d.temperature || []" :key="t.name" :xs="12" :sm="8" :lg="4">
            <div class="sensor" :class="t.status">
              <div class="sensor__name">{{ t.name }}</div>
              <div class="sensor__val">{{ t.value }}<span class="sensor__unit">{{ t.unit }}</span></div>
              <el-tag :type="tagType(t.status)" size="small" effect="plain">{{ statusText(t.status) }}</el-tag>
            </div>
          </el-col>
        </el-row>
      </SectionCard>

      <el-row :gutter="12">
        <el-col :xs="24" :lg="12">
          <SectionCard title="风扇" icon="Refresh">
            <el-table :data="d.fans || []" size="small" stripe>
              <el-table-column prop="name" label="风扇" width="100" />
              <el-table-column label="转速">
                <template #default="{ row }">{{ row.rpm }} RPM</template>
              </el-table-column>
              <el-table-column label="占比" width="160">
                <template #default="{ row }">
                  <el-progress :percentage="clamp(row.pct)" :stroke-width="8"
                    :color="row.status === 'normal' ? '#409eff' : '#f56c6c'" />
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </SectionCard>
        </el-col>
        <el-col :xs="24" :lg="12">
          <SectionCard title="电源模块" icon="Lightning">
            <el-table :data="d.power || []" size="small" stripe>
              <el-table-column prop="name" label="电源" width="90" />
              <el-table-column label="功率">
                <template #default="{ row }">{{ row.watt }} W / {{ row.capacity }} W</template>
              </el-table-column>
              <el-table-column prop="inputVoltage" label="输入电压" width="110" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag :type="tagType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </SectionCard>
        </el-col>
      </el-row>

      <SectionCard v-if="d.raid" title="RAID 卡" icon="Coin">
        <template #extra>
          <el-tag :type="d.raid.status === 'Optimal' ? 'success' : 'danger'" size="small">{{ d.raid.status }}</el-tag>
        </template>
        <InfoTable :rows="raidRows" :columns="2" />
        <el-table :data="d.raid.logicalDrives || []" size="small" stripe style="margin-top: 12px">
          <el-table-column prop="name" label="逻辑盘" width="100" />
          <el-table-column prop="level" label="级别" width="100" />
          <el-table-column label="容量"><template #default="{ row }">{{ row.sizeTB }} TB</template></el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'Optimal' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </SectionCard>

      <SectionCard title="硬盘 SMART" icon="Files">
        <el-table :data="d.disks || []" size="small" stripe>
          <el-table-column prop="slot" label="槽位" width="90" />
          <el-table-column prop="model" label="型号" min-width="180" />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column prop="capacity" label="容量" width="90" />
          <el-table-column label="温度" width="90">
            <template #default="{ row }">
              <span :style="{ color: row.temperature > 70 ? '#f56c6c' : '#303133' }">{{ row.temperature }}°C</span>
            </template>
          </el-table-column>
          <el-table-column label="重映射扇区" width="110">
            <template #default="{ row }">
              <span :style="{ color: row.reallocatedSectors > 100 ? '#e6a23c' : '#303133' }">{{ row.reallocatedSectors }}</span>
            </template>
          </el-table-column>
          <el-table-column label="磨损/备件" width="120">
            <template #default="{ row }">
              <span v-if="row.wearLevelPct != null">磨损 {{ row.wearLevelPct }}% / 备件 {{ row.availableSparePct }}%</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="powerOnHours" label="通电时长" width="110">
            <template #default="{ row }">{{ row.powerOnHours }} h</template>
          </el-table-column>
          <el-table-column label="健康" width="90" fixed="right">
            <template #default="{ row }">
              <el-tag :type="diskTag(row.health)" size="small">{{ diskText(row.health) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </SectionCard>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getServerHardware } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const tagType = (s) => (s === "critical" ? "danger" : s === "warning" ? "warning" : "success");
const statusText = (s) => (s === "critical" ? "异常" : s === "warning" ? "警告" : "正常");
const diskTag = (h) => (h === "failed" ? "danger" : h === "warning" ? "warning" : "success");
const diskText = (h) => (h === "failed" ? "故障" : h === "warning" ? "警告" : "正常");

const raidRows = computed(() => {
  const r = d.value.raid || {};
  return [
    { label: "控制器", value: r.controller },
    { label: "固件", value: r.firmware },
    { label: "电池", value: r.batteryStatus, color: r.batteryStatus === "Healthy" ? "#67c23a" : "#f56c6c" },
    { label: "缓存策略", value: r.cacheStatus },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerHardware(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.sensor {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  margin-bottom: 12px;

  &__name {
    font-size: 12px;
    color: #909399;
  }
  &__val {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
    margin: 6px 0;
  }
  &__unit {
    font-size: 12px;
    color: #909399;
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
