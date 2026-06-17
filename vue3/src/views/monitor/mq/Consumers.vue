<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="220px" gap="8px" class="stat-grid">
      <StatCard dense icon="UserFilled" label="消费组数" :value="d.groupCount ?? 0"
        sub="Consumer Group" color="#409eff" />
      <StatCard dense icon="Warning" label="最大积压" :value="fmt(d.maxLag)"
        sub="单组最大 Lag" :color="lagColor(d.maxLag)" />
      <StatCard dense icon="DataLine" label="总积压" :value="fmt(d.totalLag)"
        sub="全部 Lag" :color="lagColor(d.totalLag)" />
      <StatCard dense icon="Refresh" label="再平衡中" :value="d.rebalancingCount ?? 0"
        :sub="`高积压组 ${d.highLagCount ?? 0}`" :color="countColor(d.rebalancingCount)" />
    </CardGrid>

    <SectionCard dense title="消费组列表" icon="List" class="span-all fill" scrollable bodyClass="dense-table fill">
      <template #extra>共 {{ (d.groups || []).length }} 个消费组</template>
      <el-empty v-if="!(d.groups || []).length" description="暂无数据" :image-size="60" />
      <el-table v-else class="dense-table" height="100%" :data="d.groups || []" size="small" stripe>
        <el-table-column prop="groupId" label="消费组 ID" min-width="200" fixed>
          <template #default="{ row }">
            <span class="group-id">{{ row.groupId || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" :color="stateColor(row.state)" effect="dark" class="plain-tag">
              {{ row.state || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成员数" width="90" align="center">
          <template #default="{ row }">{{ row.members ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="订阅主题" width="90" align="center">
          <template #default="{ row }">{{ row.topics ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="积压 (Lag)" width="140" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.highLag ? '#f56c6c' : '#303133', fontWeight: row.highLag ? 600 : 400 }">
              {{ fmt(row.lag) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="消费速率" width="130" align="right">
          <template #default="{ row }">{{ rate(row.consumeRate) }}</template>
        </el-table-column>
        <el-table-column label="再平衡次数" width="120" align="center">
          <template #default="{ row }">{{ row.rebalanceCount ?? 0 }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getMqConsumers } from "@/api/monitor-mq";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const fmt = (v) => (v === undefined || v === null ? "-" : Number(v).toLocaleString());
const rate = (v) => (v === undefined || v === null ? "-" : `${v} msg/s`);
const lagColor = (v) => (Number(v) > 0 ? "#e6a23c" : "#67c23a");
const countColor = (v) => (Number(v) > 0 ? "#e6a23c" : "#67c23a");
const stateColor = (s) => {
  if (s === "Stable") return "#67c23a";
  if (s === "Rebalancing") return "#e6a23c";
  return "#909399";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getMqConsumers(props.deviceId);
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
.tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.stat-grid {
  flex-shrink: 0;
}
.span-all {
  grid-column: 1 / -1;
}
.group-id {
  font-family: monospace;
  color: var(--cm-text-primary);
}
.plain-tag {
  border: none;
  color: var(--cm-bg-card);
}
</style>
