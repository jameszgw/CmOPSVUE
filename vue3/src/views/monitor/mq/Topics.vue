<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="240px" gap="8px" class="stat-grid">
      <StatCard dense icon="Collection" label="主题数" :value="d.topicCount ?? 0"
        sub="Topic 总数" color="#409eff" />
      <StatCard dense icon="Grid" label="分区数" :value="d.partitionCount ?? 0"
        sub="Partition 总数" color="#67c23a" />
      <StatCard dense icon="ScaleToOriginal" label="倾斜主题" :value="d.skewedCount ?? 0"
        sub="分区倾斜数" :color="countColor(d.skewedCount)" />
    </CardGrid>

    <SectionCard dense title="主题列表" icon="List" class="span-all fill" scrollable bodyClass="dense-table fill">
      <template #extra>共 {{ (d.topics || []).length }} 个主题</template>
      <el-empty v-if="!(d.topics || []).length" description="暂无数据" :image-size="60" />
      <el-table v-else class="dense-table" height="100%" :data="d.topics || []" size="small" stripe>
        <el-table-column prop="name" label="主题名称" min-width="180" fixed>
          <template #default="{ row }">
            <span class="topic-name">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分区" width="90" align="center">
          <template #default="{ row }">{{ row.partitions ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="副本" width="90" align="center">
          <template #default="{ row }">{{ row.replicas ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="消息数" width="130" align="right">
          <template #default="{ row }">{{ fmt(row.messages) }}</template>
        </el-table-column>
        <el-table-column label="大小" width="110" align="right">
          <template #default="{ row }">{{ row.size || "-" }}</template>
        </el-table-column>
        <el-table-column label="生产速率" width="120" align="right">
          <template #default="{ row }">{{ rate(row.inRate) }}</template>
        </el-table-column>
        <el-table-column label="消费速率" width="120" align="right">
          <template #default="{ row }">{{ rate(row.outRate) }}</template>
        </el-table-column>
        <el-table-column label="分区倾斜" min-width="160">
          <template #default="{ row }">
            <el-progress :percentage="clamp(row.partitionSkewPct)" :stroke-width="12"
              :color="row.skewed ? '#f56c6c' : '#67c23a'" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.skewed" size="small" type="danger" effect="dark">倾斜</el-tag>
            <el-tag v-else size="small" type="success" effect="plain">均衡</el-tag>
          </template>
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
import { getMqTopics } from "@/api/monitor-mq";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const countColor = (v) => (Number(v) > 0 ? "#e6a23c" : "#67c23a");
const fmt = (v) => (v === undefined || v === null ? "-" : Number(v).toLocaleString());
const rate = (v) => (v === undefined || v === null ? "-" : `${v} msg/s`);

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getMqTopics(props.deviceId);
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
.topic-name {
  font-family: monospace;
  color: var(--cm-text-primary);
}
</style>
