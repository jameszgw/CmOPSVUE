<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="8">
        <StatCard icon="Key" label="总键数" :value="fmt(d.totalKeys)"
          sub="所有数据库" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Timer" label="过期键数" :value="fmt(d.expiredKeys)"
          :sub="expiredSub" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="8">
        <StatCard icon="Histogram" label="平均TTL" :value="d.avgTtl ?? '-'"
          sub="平均存活时间" color="#67c23a" />
      </el-col>
    </el-row>

    <SectionCard title="数据库列表" icon="Coin">
      <template #extra>共 {{ (d.databases || []).length }} 个数据库</template>
      <el-row :gutter="12">
        <el-col v-for="db in d.databases || []" :key="db.name || db.index" :xs="24">
          <div class="db-card">
            <div class="db-card__head">
              <div class="db-card__icon"><el-icon><Coin /></el-icon></div>
              <div class="db-card__title">
                <div class="db-card__name">{{ db.name || `DB${db.index}` }}</div>
                <div class="db-card__index">数据库 {{ db.index }}</div>
              </div>
              <el-tag size="small" type="success" effect="plain" class="db-card__tag">活跃</el-tag>
            </div>
            <el-row :gutter="16" class="db-card__body">
              <el-col :xs="24" :sm="12" :lg="8">
                <div class="db-metric">
                  <div class="db-metric__label">键数量</div>
                  <div class="db-metric__value">{{ fmt(db.keys) }}</div>
                  <el-progress :percentage="clamp(db.expireRate)" :stroke-width="8"
                    color="#409eff" :show-text="false" />
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <div class="db-metric">
                  <div class="db-metric__label">过期键</div>
                  <div class="db-metric__value">{{ fmt(db.expires) }}</div>
                  <div class="db-metric__sub">
                    <span style="color:#67c23a">{{ num(db.expireRate) }}%</span> 过期率
                  </div>
                </div>
              </el-col>
              <el-col :xs="24" :sm="12" :lg="8">
                <div class="db-metric">
                  <div class="db-metric__label">平均TTL</div>
                  <div class="db-metric__value">{{ db.avgTtl ?? "-" }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-col>
        <el-col v-if="!(d.databases && d.databases.length)" :span="24">
          <el-empty description="暂无数据库数据" :image-size="80" />
        </el-col>
      </el-row>
    </SectionCard>

    <SectionCard title="字段说明" icon="InfoFilled">
      <el-row :gutter="12">
        <el-col v-for="f in fieldDocs" :key="f.key" :xs="24" :sm="12" :lg="8">
          <div class="field-doc">
            <div class="field-doc__title">{{ f.key }}</div>
            <div class="field-doc__text">{{ f.text }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getRedisKeyspace } from "@/api/monitor-redis";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const fmt = (v) =>
  typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : v ?? "-";

const expiredSub = computed(() => {
  if (d.value.totalKeys == null || !d.value.expiredKeys) return "设置了过期时间";
  const rate = (Number(d.value.expiredKeys) / Number(d.value.totalKeys)) * 100;
  return `占比: ${rate.toFixed(1)}%`;
});

const fieldDocs = [
  { key: "键数量", text: "数据库中存储的键的总数量" },
  { key: "过期键", text: "设置了过期时间的键的数量" },
  { key: "平均TTL", text: "所有过期键的平均存活时间（毫秒）" },
  { key: "过期率", text: "过期键占总键数的百分比" },
  { key: "数据库编号", text: "Redis数据库编号（0-15）" },
  { key: "使用率", text: "数据库键数量相对于最大容量的占比" },
];

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getRedisKeyspace(props.deviceId);
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
.db-card {
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fafafa;
  &__head {
    display: flex;
    align-items: center;
    margin-bottom: 14px;
  }
  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #ecf5ff;
    color: #409eff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
  }
  &__name {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }
  &__index {
    font-size: 12px;
    color: #909399;
  }
  &__tag {
    margin-left: auto;
  }
}
.db-metric {
  margin-bottom: 8px;
  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
  }
  &__value {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 6px;
  }
  &__sub {
    font-size: 12px;
    color: #909399;
  }
}
.field-doc {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 12px;
  &__title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
  }
  &__text {
    font-size: 12px;
    color: #909399;
    line-height: 1.6;
  }
}
</style>
