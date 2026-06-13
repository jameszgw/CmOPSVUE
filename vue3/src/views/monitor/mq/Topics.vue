<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Collection" label="主题数" :value="d.topicCount ?? 0"
          sub="Topic 总数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Grid" label="分区数" :value="d.partitionCount ?? 0"
          sub="Partition 总数" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="ScaleToOriginal" label="倾斜主题" :value="d.skewedCount ?? 0"
          sub="分区倾斜数" :color="countColor(d.skewedCount)" />
      </el-col>
    </el-row>

    <SectionCard title="主题列表" icon="List">
      <template #extra>共 {{ (d.topics || []).length }} 个主题</template>
      <el-empty v-if="!(d.topics || []).length" description="暂无数据" />
      <el-table v-else :data="d.topics || []" size="small" stripe>
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
  loading.value = true;
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
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.topic-name {
  font-family: monospace;
  color: #303133;
}
</style>
