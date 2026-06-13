<template>
  <div class="monitor-layout">
    <!-- 左侧：搜索 + 新增设备 + 指标分类导航 -->
    <aside class="monitor-layout__side">
      <div class="monitor-layout__search">
        <el-input v-model="keyword" placeholder="搜索" clearable :prefix-icon="Search" />
        <el-button :icon="Plus" @click="addVisible = true" title="新增设备" />
      </div>
      <ul class="monitor-layout__nav">
        <li
          v-for="tab in filteredTabs"
          :key="tab.key"
          :class="['monitor-layout__nav-item', { active: tab.key === activeKey }]"
          @click="activeKey = tab.key"
        >
          <el-icon><component :is="tab.icon || 'Menu'" /></el-icon>
          <span>{{ tab.label }}</span>
        </li>
      </ul>
    </aside>

    <!-- 右侧：头部（标题 + 设备切换 + 刷新 + 连接状态）+ 指标内容 -->
    <section class="monitor-layout__content">
      <header class="monitor-layout__header">
        <div class="monitor-layout__title">
          <el-icon><Monitor /></el-icon>
          <span>{{ currentTabLabel }}</span>
        </div>
        <div class="monitor-layout__ops">
          <el-select
            v-model="currentDeviceId"
            placeholder="选择设备"
            filterable
            class="monitor-layout__device"
            @change="onDeviceChange"
          >
            <el-option
              v-for="d in devices"
              :key="d.id"
              :label="d.name"
              :value="d.id"
            >
              <span>{{ d.name }}</span>
              <span class="monitor-layout__device-sub">{{ d.ip }}</span>
            </el-option>
          </el-select>
          <el-tooltip :content="autoRefresh ? '关闭自动刷新' : '开启自动刷新'">
            <el-button
              :type="autoRefresh ? 'success' : 'default'"
              :icon="Refresh"
              text
              @click="autoRefresh = !autoRefresh"
            >
              {{ autoRefresh ? "自动刷新中" : "已暂停" }}
            </el-button>
          </el-tooltip>
          <el-button :icon="RefreshRight" circle size="small" @click="refreshNow" />
          <el-tag :type="currentDevice?.connected ? 'success' : 'info'" size="small" effect="light">
            {{ currentDevice?.connected ? "已连接" : "未连接" }}
          </el-tag>
        </div>
      </header>

      <div v-loading="loadingDevices" class="monitor-layout__body">
        <el-empty v-if="!loadingDevices && !devices.length" description="暂无设备，点击左上角 + 新增" />
        <slot
          v-else-if="currentDeviceId"
          :device-id="currentDeviceId"
          :device="currentDevice"
          :active-key="activeKey"
          :refresh-token="refreshToken"
        />
      </div>
    </section>

    <AddDeviceDialog
      v-model="addVisible"
      :device-type="deviceType"
      @added="onDeviceAdded"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, Plus, Refresh, RefreshRight, Monitor } from "@element-plus/icons-vue";
import { listDevices } from "@/api/monitor-device";
import AddDeviceDialog from "./AddDeviceDialog.vue";

const props = defineProps({
  deviceType: { type: String, required: true },
  title: { type: String, default: "" },
  tabs: { type: Array, default: () => [] },
  // 自动刷新间隔(毫秒)
  interval: { type: Number, default: 5000 },
});

const keyword = ref("");
const devices = ref([]);
const currentDeviceId = ref("");
const activeKey = ref(props.tabs[0]?.key || "");
const autoRefresh = ref(true);
const refreshToken = ref(0);
const loadingDevices = ref(false);
const addVisible = ref(false);
let timer = null;

const filteredTabs = computed(() =>
  props.tabs.filter((t) => !keyword.value || t.label.includes(keyword.value))
);
const currentTabLabel = computed(
  () => props.tabs.find((t) => t.key === activeKey.value)?.label || props.title
);
const currentDevice = computed(() =>
  devices.value.find((d) => d.id === currentDeviceId.value)
);

const loadDevices = async (preferId) => {
  loadingDevices.value = true;
  try {
    const res = await listDevices(props.deviceType);
    devices.value = res.content || [];
    if (preferId && devices.value.some((d) => d.id === preferId)) {
      currentDeviceId.value = preferId;
    } else if (!devices.value.some((d) => d.id === currentDeviceId.value)) {
      currentDeviceId.value = devices.value[0]?.id || "";
    }
  } finally {
    loadingDevices.value = false;
  }
};

const refreshNow = () => {
  refreshToken.value += 1;
};

const onDeviceChange = () => {
  refreshNow();
};

const onDeviceAdded = (device) => {
  loadDevices(device?.id);
};

const setupTimer = () => {
  clearTimer();
  if (autoRefresh.value) {
    timer = setInterval(refreshNow, props.interval);
  }
};
const clearTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

watch(autoRefresh, setupTimer);

onMounted(async () => {
  await loadDevices();
  setupTimer();
});
onBeforeUnmount(clearTimer);
</script>

<style lang="less" scoped>
.monitor-layout {
  display: flex;
  height: 100%;
  gap: 12px;
  align-items: stretch;

  &__side {
    width: 220px;
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__search {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid #f0f2f5;
  }

  &__nav {
    list-style: none;
    margin: 0;
    padding: 8px;
    overflow-y: auto;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    color: #606266;
    font-size: 14px;
    margin-bottom: 2px;

    &:hover {
      background: #f5f7fa;
    }

    &.active {
      background: #ecf5ff;
      color: #409eff;
      font-weight: 500;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;

    .el-icon {
      color: #409eff;
    }
  }

  &__ops {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__device {
    width: 220px;
  }

  &__device-sub {
    float: right;
    color: #c0c4cc;
    font-size: 12px;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
