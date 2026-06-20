<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="240px" gap="8px" class="stat-grid">
      <StatCard dense icon="Bell" label="事件总数" :value="d.total ?? '-'" color="#409eff" />
      <StatCard dense icon="WarningFilled" label="警告" :value="d.warningCount ?? '-'" color="#e6a23c" />
      <StatCard dense icon="CircleCheckFilled" label="正常" :value="d.normalCount ?? '-'" color="#67c23a" />
    </CardGrid>

    <SectionCard dense title="事件列表" icon="List" class="fill" scrollable bodyClass="dense-table fill">
      <template #extra>
        <el-select v-model="filterType" size="small" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="Warning" value="Warning" />
          <el-option label="Normal" value="Normal" />
        </el-select>
      </template>
      <el-table v-if="filteredEvents.length" class="dense-table" height="100%" :data="filteredEvents" size="small" stripe>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === 'Warning' ? 'warning' : 'info'" effect="plain">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" width="160" />
        <el-table-column prop="object" label="对象" min-width="180" />
        <el-table-column prop="namespace" label="命名空间" width="140" />
        <el-table-column prop="message" label="消息" min-width="240" show-overflow-tooltip />
        <el-table-column prop="count" label="次数" width="80" />
        <el-table-column prop="lastTime" label="最近时间" width="180" />
      </el-table>
      <el-empty v-else description="暂无事件" :image-size="60" />
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getK8sEvents } from "@/api/monitor-k8s";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const filterType = ref("");

const filteredEvents = computed(() => {
  const list = d.value.events || [];
  if (!filterType.value) return list;
  return list.filter((e) => e.type === filterType.value);
});

const load = async () => {
  if (!props.deviceId) return;
  const hasData = data.value && (Array.isArray(data.value) ? data.value.length : Object.keys(data.value).length);
  if (!hasData) loading.value = true;
  try {
    const res = await getK8sEvents(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
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
</style>
