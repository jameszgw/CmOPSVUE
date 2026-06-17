<template>
  <div v-loading="loading" class="page-container">
    <SectionCard title="指标字典" icon="Collection">
      <template #extra>
        <span class="dict-note">
          解释每个监控指标"是什么/怎么看/从哪来"，阈值为推荐值（可在告警规则中调整）。
        </span>
      </template>

      <!-- 过滤区 -->
      <div class="dict-filter">
        <el-radio-group v-model="activeType" size="small">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button
            v-for="t in deviceTypes"
            :key="t"
            :label="t"
          >
            {{ typeLabel(t) }}
          </el-radio-button>
        </el-radio-group>
        <el-input
          v-model="keyword"
          class="dict-filter__search"
          placeholder="搜索指标 / 键 / 含义"
          clearable
          size="small"
          :prefix-icon="Search"
        />
        <span class="dict-filter__count">共 {{ filtered.length }} 项</span>
      </div>

      <!-- 指标表 -->
      <el-table
        :data="filtered"
        size="small"
        stripe
        border
        height="calc(100vh - 230px)"
        class="dict-table"
      >
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="指标" min-width="160">
          <template #default="{ row }">
            <div class="dict-metric">
              <span class="dict-metric__label">{{ row.label }}</span>
              <span class="dict-metric__key">{{ row.metricKey }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="80">
          <template #default="{ row }">{{ row.unit || "-" }}</template>
        </el-table-column>
        <el-table-column label="含义" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.definition || "-" }}</template>
        </el-table-column>
        <el-table-column label="解读" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ row.interpretation || "-" }}</template>
        </el-table-column>
        <el-table-column label="推荐阈值" min-width="180">
          <template #default="{ row }">
            <span v-if="row.warnValue != null || row.criticalValue != null" class="dict-threshold">
              <span v-if="row.warnValue != null" class="dict-threshold__warn">
                警告 {{ row.comparator || "≥" }} {{ row.warnValue }}
              </span>
              <span v-if="row.criticalValue != null" class="dict-threshold__crit">
                严重 {{ row.comparator || "≥" }} {{ row.criticalValue }}
              </span>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="采集来源" width="110">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="(row.source || '').includes('真实') ? 'success' : 'info'"
              effect="plain"
            >
              {{ row.source || "-" }}
            </el-tag>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无匹配指标" :image-size="80" />
        </template>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getMetricDeviceTypes, getMetricGlossary } from "@/api/monitor-metric";

// 设备类型代码 → 中文名（与本页展示口径一致）
const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息中间件",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
  POWER: "电能",
  ESS: "储能",
  IOT: "物联感知",
  SBC: "单板机",
  ANDROID: "安卓多开",
  AI: "AI",
};
const typeLabel = (t) => TYPE_LABEL[t] || t || "-";

const loading = ref(false);
const deviceTypes = ref([]);
const metrics = ref([]);
const activeType = ref("");
const keyword = ref("");

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return metrics.value.filter((m) => {
    if (activeType.value && m.deviceType !== activeType.value) return false;
    if (!kw) return true;
    return (
      (m.label || "").toLowerCase().includes(kw) ||
      (m.metricKey || "").toLowerCase().includes(kw) ||
      (m.definition || "").toLowerCase().includes(kw)
    );
  });
});

const load = async () => {
  loading.value = true;
  try {
    const [typesRes, glossaryRes] = await Promise.all([
      getMetricDeviceTypes(),
      getMetricGlossary(),
    ]);
    deviceTypes.value = typesRes?.content || [];
    metrics.value = glossaryRes?.content || [];
  } catch (e) {
    ElMessage.error("加载指标字典失败");
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.dict-note {
  color: @text-secondary;
  font-size: 12px;
}

.dict-filter {
  display: flex;
  align-items: center;
  gap: @space-md;
  flex-wrap: wrap;
  margin-bottom: @space-md;

  &__search {
    width: 240px;
  }

  &__count {
    color: @text-secondary;
    font-size: 12px;
    margin-left: auto;
  }
}

.dict-metric {
  display: flex;
  flex-direction: column;
  line-height: 1.3;

  &__label {
    color: @text-primary;
  }

  &__key {
    color: @text-secondary;
    font-size: 11px;
  }
}

.dict-threshold {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  line-height: 1.3;

  &__warn {
    color: @color-warning;
  }

  &__crit {
    color: @color-danger;
  }
}

.dict-table {
  width: 100%;
}
</style>
