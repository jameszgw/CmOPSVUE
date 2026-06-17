<template>
  <div v-loading="loading" class="page-container monitor-config">
    <div class="page-header">
      <h1 class="page-header__title">监控开关</h1>
      <p class="page-header__desc">
        这些开关运行时生效（个别项 remark 标注“重启生效”），优先级高于配置文件。
      </p>
    </div>

    <SectionCard
      v-for="g in groups"
      :key="g.name"
      :title="g.name"
      icon="Setting"
    >
      <div class="cfg-grid">
        <div v-for="item in g.items" :key="item.key" class="cfg-item">
          <div class="cfg-item__main">
            <div class="cfg-item__label">{{ item.label }}</div>
            <div class="cfg-item__control">
              <el-switch
                v-if="item.type === 'BOOL'"
                v-model="item.value"
                :loading="!!savingMap[item.key]"
                @change="(val) => onChange(item, val)"
              />
              <el-input-number
                v-else
                v-model="item.value"
                :min="0"
                :controls-position="'right'"
                size="small"
                style="width: 140px"
                @change="(val) => onChange(item, val)"
              />
            </div>
          </div>
          <div v-if="item.remark" class="cfg-item__remark">{{ item.remark }}</div>
        </div>
      </div>
    </SectionCard>

    <el-empty v-if="!loading && !groups.length" description="暂无监控配置项" />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { listMonitorConfig, updateMonitorConfig } from "@/api/monitor-config";

const loading = ref(false);
const items = ref([]);
const savingMap = reactive({});

const groups = computed(() => {
  const map = new Map();
  for (const it of items.value) {
    const name = it.group || "其他";
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(it);
  }
  return Array.from(map, ([name, list]) => ({ name, items: list }));
});

const fetchConfig = async () => {
  loading.value = true;
  try {
    const res = await listMonitorConfig();
    items.value = (res.content || []).map((it) => ({ ...it }));
  } finally {
    loading.value = false;
  }
};

const onChange = async (item, newValue) => {
  const oldValue = item._prev ?? item.value;
  // INT 控件清空时可能传 null，忽略无效值并回退
  if (item.type === "INT" && (newValue === null || newValue === undefined)) {
    item.value = oldValue;
    return;
  }
  const payload = item.type === "BOOL" ? !!newValue : Number(newValue);
  savingMap[item.key] = true;
  try {
    const res = await updateMonitorConfig(item.key, payload);
    item.value = payload;
    item._prev = payload;
    ElMessage.success(res?.msg || "已保存");
  } catch (e) {
    // 保存失败：回退控件
    item.value = oldValue;
    ElMessage.error(e?.message || "保存失败");
  } finally {
    savingMap[item.key] = false;
  }
};

onMounted(fetchConfig);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.monitor-config {
  .page-header {
    margin-bottom: @space-lg;

    &__title {
      margin: 0 0 6px;
      font-size: 18px;
      font-weight: 600;
      color: var(--cm-text-primary);
    }

    &__desc {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: var(--cm-text-secondary);
    }
  }

  .cfg-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: @space-md @space-lg;

    @media (min-width: 992px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .cfg-item {
    padding: @space-sm 0;
    border-bottom: 1px dashed var(--cm-border-light);

    &__main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: @space-md;
    }

    &__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--cm-text-primary);
    }

    &__control {
      flex-shrink: 0;
    }

    &__remark {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.4;
      color: var(--cm-text-secondary);
    }
  }
}
</style>
