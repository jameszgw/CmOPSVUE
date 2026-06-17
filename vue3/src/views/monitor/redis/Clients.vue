<template>
  <div v-loading="loading" class="tab-pane">
    <CardGrid min="240px" gap="8px" class="stat-grid">
      <StatCard dense icon="User" label="连接客户端" :value="d.connectedClients ?? '-'"
        sub="当前连接数" color="#409eff" />
      <StatCard dense icon="Lock" label="阻塞客户端" :value="d.blockedClients ?? '-'"
        sub="阻塞中" color="#e6a23c" />
      <StatCard dense icon="Connection" label="总连接数" :value="fmt(d.totalConnections)"
        sub="累计连接" color="#67c23a" />
    </CardGrid>

    <SectionCard dense title="客户端连接列表" icon="List" class="fill" scrollable bodyClass="dense-table fill">
      <template #extra>共 {{ (d.clients || []).length }} 个连接</template>
      <el-table class="dense-table" height="100%" :data="d.clients || []" size="small" stripe>
        <el-table-column prop="id" label="客户端ID" width="100" />
        <el-table-column prop="addr" label="地址" min-width="180" />
        <el-table-column label="名称" width="120">
          <template #default="{ row }">
            <span>{{ row.name || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="db" label="数据库" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)" effect="plain">
              {{ row.status || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="空闲时间" width="120">
          <template #default="{ row }">
            <span>{{ row.idleTime ?? row.idle ?? "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outputBuffer" label="输出缓冲" width="120">
          <template #default="{ row }">
            <span>{{ row.outputBuffer ?? "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后命令" min-width="120">
          <template #default="{ row }">
            <span style="color: #409eff">{{ row.lastCmd || "-" }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无客户端连接" :image-size="80" />
        </template>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getRedisClients } from "@/api/monitor-redis";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const fmt = (v) =>
  typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v ?? "-";

const statusType = (s) => {
  if (!s) return "info";
  const v = String(s).toLowerCase();
  if (v.includes("normal") || v.includes("正常")) return "success";
  if (v.includes("block") || v.includes("阻塞")) return "warning";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getRedisClients(props.deviceId);
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
