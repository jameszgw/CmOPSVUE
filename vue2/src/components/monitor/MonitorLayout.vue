<template>
  <div class="monitor-layout">
    <!-- 左侧：搜索 + 新增设备 + 指标分类导航 -->
    <aside class="monitor-layout__side">
      <div class="monitor-layout__search">
        <el-input v-model="keyword" placeholder="搜索" clearable prefix-icon="el-icon-search" />
        <el-button icon="el-icon-plus" title="新增设备" @click="addVisible = true" />
      </div>
      <ul class="monitor-layout__nav">
        <li
          v-for="tab in filteredTabs"
          :key="tab.key"
          :class="['monitor-layout__nav-item', { active: tab.key === activeKey }]"
          @click="activeKey = tab.key"
        >
          <i :class="tab.icon || 'el-icon-menu'"></i>
          <span>{{ tab.label }}</span>
        </li>
      </ul>
    </aside>

    <!-- 右侧：头部（标题 + 设备切换 + 刷新 + 连接状态）+ 指标内容 -->
    <section class="monitor-layout__content">
      <header class="monitor-layout__header">
        <div class="monitor-layout__title">
          <i class="el-icon-monitor"></i>
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
            <el-option v-for="dev in devices" :key="dev.id" :label="dev.name" :value="dev.id">
              <span>{{ dev.name }}</span>
              <span class="monitor-layout__device-sub">{{ dev.ip }}</span>
            </el-option>
          </el-select>
          <el-tooltip :content="autoRefresh ? '关闭自动刷新' : '开启自动刷新'">
            <el-button
              :type="autoRefresh ? 'success' : 'default'"
              icon="el-icon-refresh"
              size="small"
              @click="autoRefresh = !autoRefresh"
            >
              {{ autoRefresh ? "自动刷新中" : "已暂停" }}
            </el-button>
          </el-tooltip>
          <el-button icon="el-icon-refresh-right" circle size="mini" @click="refreshNow" />
          <el-tag :type="currentDevice && currentDevice.connected ? 'success' : 'info'" size="small" effect="light">
            {{ currentDevice && currentDevice.connected ? "已连接" : "未连接" }}
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

    <AddDeviceDialog v-model="addVisible" :device-type="deviceType" @added="onDeviceAdded" />
  </div>
</template>

<script>
import { listDevices } from "@/api/monitor-device";
import AddDeviceDialog from "./AddDeviceDialog.vue";

export default {
  name: "MonitorLayout",
  components: { AddDeviceDialog },
  props: {
    deviceType: { type: String, required: true },
    title: { type: String, default: "" },
    tabs: { type: Array, default: () => [] },
    interval: { type: Number, default: 5000 },
  },
  data() {
    return {
      keyword: "",
      devices: [],
      currentDeviceId: "",
      activeKey: this.tabs[0] ? this.tabs[0].key : "",
      autoRefresh: true,
      refreshToken: 0,
      loadingDevices: false,
      addVisible: false,
      timer: null,
    };
  },
  computed: {
    filteredTabs() {
      return this.tabs.filter((t) => !this.keyword || t.label.includes(this.keyword));
    },
    currentTabLabel() {
      const t = this.tabs.find((x) => x.key === this.activeKey);
      return t ? t.label : this.title;
    },
    currentDevice() {
      return this.devices.find((d) => d.id === this.currentDeviceId);
    },
  },
  watch: {
    autoRefresh() {
      this.setupTimer();
    },
  },
  async mounted() {
    await this.loadDevices();
    this.setupTimer();
  },
  beforeDestroy() {
    this.clearTimer();
  },
  methods: {
    async loadDevices(preferId) {
      this.loadingDevices = true;
      try {
        const res = await listDevices(this.deviceType);
        this.devices = res.content || [];
        if (preferId && this.devices.some((d) => d.id === preferId)) {
          this.currentDeviceId = preferId;
        } else if (!this.devices.some((d) => d.id === this.currentDeviceId)) {
          this.currentDeviceId = this.devices[0] ? this.devices[0].id : "";
        }
      } finally {
        this.loadingDevices = false;
      }
    },
    refreshNow() {
      this.refreshToken += 1;
    },
    onDeviceChange() {
      this.refreshNow();
    },
    onDeviceAdded(device) {
      this.loadDevices(device && device.id);
    },
    setupTimer() {
      this.clearTimer();
      if (this.autoRefresh) {
        this.timer = setInterval(this.refreshNow, this.interval);
      }
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
  },
};
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

    i {
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
