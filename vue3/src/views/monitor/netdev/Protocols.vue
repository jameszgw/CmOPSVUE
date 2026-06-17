<template>
  <div v-loading="loading" class="screen-tab">
    <CardGrid min="220px" gap="8px">
      <StatCard icon="Share" label="BGP 邻居" :value="bgp.total ?? 0"
        :sub="`已建立 ${bgp.established ?? 0} / Down ${bgp.down ?? 0}`" color="#409eff" dense />
      <StatCard icon="Connection" label="OSPF 邻居" :value="ospf.neighbors ?? 0"
        :sub="`区域 ${ospf.areas ?? 0} / 状态 ${ospf.state ?? '-'}`" color="#67c23a" dense />
      <StatCard icon="Link" label="链路聚合" :value="lag.total ?? 0"
        :sub="`降级 ${lag.degraded ?? 0}`" :color="(lag.degraded ?? 0) > 0 ? '#e6a23c' : '#9254de'" dense />
      <StatCard icon="Position" label="LLDP 邻居" :value="lldp.neighbors ?? 0"
        :sub="`发现设备 ${lldp.discoveredDevices ?? 0}`" color="#e6a23c" dense />
    </CardGrid>

    <CardGrid min="300px" gap="8px">
      <SectionCard title="OSPF" icon="Connection" dense>
        <InfoTable :rows="ospfRows" />
      </SectionCard>
      <SectionCard title="LLDP" icon="Position" dense>
        <InfoTable :rows="lldpRows" />
      </SectionCard>
    </CardGrid>

    <CardGrid min="320px" gap="8px" class="fill grow-grid">
    <SectionCard title="BGP 邻居" icon="Share" dense scrollable bodyClass="dense-table fill" class="fill">
      <template #extra>共 {{ (bgp.neighbors || []).length }} 个邻居</template>
      <el-empty v-if="!(bgp.neighbors || []).length" description="暂无数据" />
      <el-table v-else :data="bgp.neighbors || []" size="small" stripe
        class="dense-table" height="100%">
        <el-table-column prop="neighbor" label="邻居" min-width="160">
          <template #default="{ row }">
            <span class="mono">{{ row.neighbor || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="AS" width="120">
          <template #default="{ row }">{{ row.as ?? "-" }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag size="small" :color="row.state === 'Established' ? '#67c23a' : '#e6a23c'"
              effect="dark" class="plain-tag">
              {{ row.state || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="运行时长" min-width="140">
          <template #default="{ row }">{{ row.uptime || "-" }}</template>
        </el-table-column>
        <el-table-column label="收到前缀" width="120" align="center">
          <template #default="{ row }">{{ row.prefixReceived ?? 0 }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <SectionCard title="链路聚合 (LAG)" icon="Link" dense scrollable bodyClass="dense-table fill" class="fill">
      <template #extra>共 {{ (lag.channels || []).length }} 个聚合组</template>
      <el-empty v-if="!(lag.channels || []).length" description="暂无数据" />
      <el-table v-else :data="lag.channels || []" size="small" stripe
        class="dense-table" height="100%">
        <el-table-column prop="name" label="聚合组" min-width="160">
          <template #default="{ row }">
            <span class="mono">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成员数" width="100" align="center">
          <template #default="{ row }">{{ row.members ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="活动成员" width="110" align="center">
          <template #default="{ row }">{{ row.activeMembers ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag size="small" :color="row.status === 'degraded' ? '#e6a23c' : statusColor(row.status)"
              effect="dark" class="plain-tag">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总带宽" min-width="140">
          <template #default="{ row }">{{ row.totalSpeed || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
    </CardGrid>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getNetDevProtocols } from "@/api/monitor-netdev";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const bgp = computed(() => d.value.bgp || {});
const ospf = computed(() => d.value.ospf || {});
const lag = computed(() => d.value.lag || {});
const lldp = computed(() => d.value.lldp || {});

const statusColor = (s) => {
  if (["up", "online", "active", "normal", "Established", "Healthy"].includes(s)) return "#67c23a";
  if (["near-full", "degraded", "warning", "Warning"].includes(s)) return "#e6a23c";
  if (["down", "offline", "failed", "Down", "Offline", "Failed"].includes(s)) return "#f56c6c";
  return "#909399";
};

const ospfRows = computed(() => {
  const v = ospf.value;
  return [
    { label: "邻居数", value: v.neighbors ?? "-" },
    { label: "区域数", value: v.areas ?? "-" },
    { label: "状态", value: v.state ?? "-", color: statusColor(v.state) },
  ];
});

const lldpRows = computed(() => {
  const v = lldp.value;
  return [
    { label: "邻居数", value: v.neighbors ?? "-" },
    { label: "发现设备", value: v.discoveredDevices ?? "-" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getNetDevProtocols(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  box-sizing: border-box;
}
.grow-grid {
  flex: 1;
  min-height: 0;
  grid-auto-rows: minmax(0, 1fr);
}
.mono {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
</style>
