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
            <el-option-group v-for="g in deviceGroups" :key="g.label" :label="g.label">
              <el-option v-for="d in g.list" :key="d.id" :label="d.name" :value="d.id">
                <span>{{ d.name }}</span>
                <span class="monitor-layout__device-sub">{{ d.ip }}</span>
              </el-option>
            </el-option-group>
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
    // 按环境(env)分组设备，生产环境优先，其余按字母排序
    deviceGroups() {
      const map = new Map();
      (this.devices || []).forEach((d) => {
        const env = (d && d.env) || "默认环境";
        if (!map.has(env)) {
          map.set(env, []);
        }
        map.get(env).push(d);
      });
      const labels = Array.from(map.keys()).sort((a, b) => {
        if (a === "生产环境") return -1;
        if (b === "生产环境") return 1;
        return a.localeCompare(b);
      });
      return labels.map((label) => ({ label, list: map.get(label) }));
    },
  },
  watch: {
    autoRefresh() {
      this.setupTimer();
    },
    // 响应路由 query.deviceId 变化（同类型页面内切换）
    "$route.query.deviceId"(id) {
      if (id && this.devices.some((d) => d.id === id) && id !== this.currentDeviceId) {
        this.currentDeviceId = id;
        this.persistDevice(id);
        this.refreshNow();
      }
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
    storageKey() {
      return `cm-last-device-${this.deviceType}`;
    },
    readLastDevice() {
      try {
        return localStorage.getItem(this.storageKey()) || "";
      } catch (e) {
        return "";
      }
    },
    persistDevice(id) {
      try {
        if (id) {
          localStorage.setItem(this.storageKey(), id);
        }
      } catch (e) {
        /* ignore */
      }
    },
    async loadDevices(preferId) {
      this.loadingDevices = true;
      try {
        const res = await listDevices(this.deviceType);
        this.devices = res.content || [];
        const exists = (id) => id && this.devices.some((d) => d.id === id);
        // 优先级：路由 query.deviceId > preferId 参数 > localStorage > 当前值 > 第一个
        const queryId = this.$route.query && this.$route.query.deviceId;
        let target = "";
        if (exists(queryId)) {
          target = queryId;
        } else if (exists(preferId)) {
          target = preferId;
        } else if (exists(this.readLastDevice())) {
          target = this.readLastDevice();
        } else if (exists(this.currentDeviceId)) {
          target = this.currentDeviceId;
        } else {
          target = this.devices[0] ? this.devices[0].id : "";
        }
        this.currentDeviceId = target;
        this.persistDevice(target);
      } finally {
        this.loadingDevices = false;
      }
    },
    refreshNow() {
      this.refreshToken += 1;
    },
    onDeviceChange() {
      this.persistDevice(this.currentDeviceId);
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
@import (reference) "@/styles/variables.less";

.monitor-layout {
  display: flex;
  height: 100%;
  gap: @space-md;
  align-items: stretch;

  &__side {
    width: 220px;
    flex-shrink: 0;
    background: var(--cm-bg-card, @bg-card);
    border: 1px solid var(--cm-border-light, @border-light);
    border-radius: @radius-lg;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__search {
    display: flex;
    gap: @space-sm;
    padding: @space-md;
    border-bottom: 1px solid var(--cm-border-light, @border-light);
  }

  &__nav {
    list-style: none;
    margin: 0;
    padding: @space-sm;
    overflow-y: auto;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: @space-sm;
    padding: 10px @space-md;
    border-radius: @radius-base;
    cursor: pointer;
    color: var(--cm-text-regular, @text-regular);
    font-size: 14px;
    margin-bottom: 2px;

    &:hover {
      background: var(--cm-bg-soft, @bg-soft);
    }

    &.active {
      background: var(--cm-active-soft, #ecf5ff);
      color: var(--cm-color-primary, @color-primary);
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
    padding: @space-md @space-lg;
    background: var(--cm-bg-card, @bg-card);
    border: 1px solid var(--cm-border-light, @border-light);
    border-radius: @radius-lg;
    margin-bottom: @space-md;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: @space-sm;
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);

    i {
      color: var(--cm-color-primary, @color-primary);
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
    color: var(--cm-text-placeholder, @text-placeholder);
    font-size: 12px;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
