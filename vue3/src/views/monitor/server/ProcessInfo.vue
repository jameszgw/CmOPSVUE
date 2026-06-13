<template>
  <div v-loading="loading" class="tab-pane">
    <el-alert v-if="d.limited" type="warning" :closable="false" show-icon class="limit-alert"
      :title="d.limitNote || '当前设备未安装 Agent，进程信息为受限模式。'" />

    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="List" label="总进程数" :value="d.total ?? '-'"
          sub="系统进程总数" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="VideoPlay" label="运行中" :value="d.running ?? '-'"
          sub="正在运行的进程" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Moon" label="休眠中" :value="d.sleeping ?? '-'"
          sub="休眠状态的进程" color="#909399" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="其他状态" :value="d.other ?? '-'"
          sub="停止/僵尸等状态" color="#e6a23c" />
      </el-col>
    </el-row>

    <SectionCard title="Top 进程（按CPU使用率排序）" icon="List">
      <el-table :data="d.topProcess || []" size="small" stripe>
        <el-table-column prop="pid" label="PID" width="100" />
        <el-table-column prop="name" label="进程名" min-width="160" />
        <el-table-column label="CPU %" width="120">
          <template #default="{ row }">
            <span style="color: #67c23a">{{ num(row.cpu) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="内存 %" width="120">
          <template #default="{ row }">
            <span style="color: #e6a23c">{{ num(row.mem) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="200" />
      </el-table>
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="进程状态分布" icon="PieChart">
          <div v-for="item in statusRows" :key="item.label" class="dist-item">
            <span class="dist-item__dot" :style="{ background: item.color }"></span>
            <span class="dist-item__label">{{ item.label }}</span>
            <span class="dist-item__count">{{ item.count ?? "-" }}</span>
            <span class="dist-item__percent">{{ num(item.percent) }}%</span>
          </div>
          <div class="dist-total">
            <span class="dist-total__label">总计</span>
            <span class="dist-total__count">{{ d.statusDist?.total ?? "-" }}</span>
          </div>
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="资源使用排行" icon="Histogram">
          <div v-for="item in d.resourceRank || []" :key="item.pid" class="rank-item">
            <div class="rank-item__head">
              <span class="rank-item__rank">{{ item.rank }}</span>
              <span class="rank-item__name">{{ item.name }}</span>
              <span class="rank-item__pid">PID: {{ item.pid }}</span>
            </div>
            <div class="rank-item__metric">
              <span class="rank-item__metric-label">CPU:</span>
              <span class="rank-item__metric-value" style="color: #67c23a">{{ num(item.cpu) }}%</span>
            </div>
            <div class="rank-item__metric">
              <span class="rank-item__metric-label">内存:</span>
              <span class="rank-item__metric-value" style="color: #e6a23c">{{ num(item.mem) }}%</span>
            </div>
          </div>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getServerProcess } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));

const statusRows = computed(() => {
  const s = d.value.statusDist || {};
  const total = Number(s.total) || 0;
  const pct = (v) => (total > 0 ? ((Number(v) || 0) / total) * 100 : 0);
  return [
    { label: "运行中", count: s.running, percent: pct(s.running), color: "#67c23a" },
    { label: "休眠中", count: s.sleeping, percent: pct(s.sleeping), color: "#409eff" },
    { label: "其他状态", count: s.other, percent: pct(s.other), color: "#909399" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerProcess(props.deviceId);
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
.limit-alert {
  margin-bottom: 12px;
}
.dist-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
  font-size: 13px;
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
  }
  &__label {
    color: #606266;
  }
  &__count {
    margin-left: auto;
    font-weight: 600;
    color: #303133;
  }
  &__percent {
    width: 64px;
    text-align: right;
    color: #909399;
  }
}
.dist-total {
  display: flex;
  align-items: center;
  padding-top: 12px;
  &__label {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
  &__count {
    margin-left: auto;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}
.rank-item {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 10px;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }
  &__rank {
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    border-radius: 4px;
    background: #ecf5ff;
    color: #409eff;
    font-size: 12px;
    font-weight: 600;
    margin-right: 8px;
  }
  &__name {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
  }
  &__pid {
    margin-left: auto;
    font-size: 12px;
    color: #909399;
  }
  &__metric {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-top: 2px;
  }
  &__metric-label {
    color: #909399;
  }
  &__metric-value {
    margin-left: auto;
    font-weight: 600;
  }
}
</style>
