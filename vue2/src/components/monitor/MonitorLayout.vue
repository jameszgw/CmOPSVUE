<template>
  <div class="monitor-layout">
    <!-- 左侧：搜索 + 新增设备 + 指标分类导航 -->
    <aside class="monitor-layout__side">
      <div class="monitor-layout__search">
        <el-input v-model="keyword" placeholder="搜索" clearable prefix-icon="el-icon-search" />
        <el-button icon="el-icon-plus" title="新增设备" @click="openAdd" />
        <el-button icon="el-icon-setting" title="批量设置采集" @click="openBatch" />
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
          <el-tag
            v-if="currentDevice && currentDevice.collectVia"
            :type="currentDevice.collectVia && currentDevice.collectVia !== 'NONE' ? 'success' : 'info'"
            size="small"
            effect="light"
            class="monitor-layout__collect-tag"
          >
            获取方式：{{ COLLECT_VIA_LABEL[currentDevice.collectVia] || currentDevice.collectVia }}
          </el-tag>
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
              <el-option
                v-for="d in g.list"
                :key="d.id"
                :label="d.name"
                :value="d.id"
                class="monitor-layout__device-opt"
              >
                <span>{{ d.name }}</span>
                <span class="monitor-layout__device-sub">{{ d.ip }}</span>
                <el-dropdown
                  trigger="click"
                  class="monitor-layout__device-actions"
                  @command="(cmd) => onDeviceCommand(cmd, d)"
                >
                  <i class="el-icon-more monitor-layout__device-more" @click.stop></i>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="test">测试采集</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
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
          <el-select
            v-model="refreshMs"
            size="mini"
            class="monitor-layout__interval"
            @change="onRefreshMsChange"
          >
            <el-option
              v-for="opt in REFRESH_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
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

    <AddDeviceDialog
      v-model="addVisible"
      :device-type="deviceType"
      :edit-device="editingDevice"
      @added="onDeviceAdded"
    />

    <!-- 批量设置采集：勾选当前类型设备 + 采集配置 -->
    <el-dialog title="批量设置采集" :visible.sync="batchVisible" width="560px" @closed="onBatchClosed">
      <div class="monitor-layout__batch-bar">
        <el-checkbox
          :value="allSelected"
          :indeterminate="someSelected"
          @change="toggleSelectAll"
        >
          全选
        </el-checkbox>
        <span class="monitor-layout__batch-count">已选 {{ batchSelected.length }} / {{ devices.length }}</span>
      </div>
      <el-checkbox-group v-model="batchSelected" class="monitor-layout__batch-list">
        <el-checkbox v-for="d in devices" :key="d.id" :label="d.id" class="monitor-layout__batch-item">
          <span>{{ d.name }}</span>
          <span class="monitor-layout__device-sub">{{ d.ip }}</span>
          <el-tag
            v-if="d.collectVia && d.collectVia !== 'NONE'"
            size="mini"
            type="success"
            effect="light"
            class="monitor-layout__batch-via"
          >
            {{ COLLECT_VIA_LABEL[d.collectVia] || d.collectVia }}
          </el-tag>
        </el-checkbox>
      </el-checkbox-group>

      <el-divider content-position="left">采集配置</el-divider>
      <el-form label-width="90px">
        <el-form-item label="采集方式">
          <el-select v-model="batchForm.collectVia" placeholder="请选择">
            <el-option label="模拟数据" value="NONE" />
            <el-option label="Agent探针" value="AGENT" />
            <el-option label="SSH(无探针)" value="SSH" />
            <el-option label="SNMP(无探针)" value="SNMP" />
            <el-option label="WinRM(无探针)" value="WINRM" />
          </el-select>
        </el-form-item>
        <template v-if="batchForm.collectVia === 'SSH' || batchForm.collectVia === 'WINRM'">
          <el-form-item label="端口">
            <el-input-number v-model="batchForm.collectPort" :min="1" :max="65535" controls-position="right" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="batchForm.collectUser" placeholder="如 root / ops" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="batchForm.collectSecret" type="password" show-password placeholder="登录密码" />
          </el-form-item>
        </template>
        <template v-else-if="batchForm.collectVia === 'SNMP'">
          <el-form-item label="端口">
            <el-input-number v-model="batchForm.collectPort" :min="1" :max="65535" controls-position="right" />
          </el-form-item>
          <el-form-item label="Community">
            <el-input v-model="batchForm.collectSecret" placeholder="如 public" />
          </el-form-item>
        </template>
      </el-form>

      <div slot="footer">
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="submitBatch">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDevices, deleteDevice, batchCollect, testCollect } from "@/api/monitor-device";
import AddDeviceDialog from "./AddDeviceDialog.vue";

// 默认采集端口（与 AddDeviceDialog 一致：SSH 22 / SNMP 161 / WinRM 5985）
const COLLECT_DEFAULT_PORT = { SSH: 22, SNMP: 161, WINRM: 5985 };

// 自动刷新间隔可选项（每设备可单独配置）
const REFRESH_OPTIONS = [
  { label: "3 秒", value: 3000 },
  { label: "5 秒", value: 5000 },
  { label: "10 秒", value: 10000 },
  { label: "30 秒", value: 30000 },
  { label: "60 秒", value: 60000 },
];

// 刷新间隔持久化键：按设备维度存储，回落全局默认
const REFRESH_KEY_DEFAULT = "cmops:refreshMs:default";

// 获取方式（采集方式）标签映射，用于头部展示设备配置的采集方式
const COLLECT_VIA_LABEL = {
  NONE: "模拟数据",
  AGENT: "Agent 探针",
  SSH: "SSH（无探针）",
  SNMP: "SNMP（无探针）",
  WINRM: "WinRM（无探针）",
  DIRECT: "直连采集",
};

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
      COLLECT_VIA_LABEL,
      REFRESH_OPTIONS,
      keyword: "",
      devices: [],
      currentDeviceId: "",
      activeKey: this.tabs[0] ? this.tabs[0].key : "",
      autoRefresh: true,
      refreshMs: this.interval,
      refreshToken: 0,
      loadingDevices: false,
      addVisible: false,
      editingDevice: null,
      timer: null,
      // 批量设置采集
      batchVisible: false,
      batchSubmitting: false,
      batchSelected: [],
      batchForm: {
        collectVia: "NONE",
        collectPort: 22,
        collectUser: "",
        collectSecret: "",
      },
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
    allSelected() {
      return this.devices.length > 0 && this.batchSelected.length === this.devices.length;
    },
    someSelected() {
      return this.batchSelected.length > 0 && this.batchSelected.length < this.devices.length;
    },
  },
  watch: {
    "batchForm.collectVia"(via) {
      if (COLLECT_DEFAULT_PORT[via]) {
        this.batchForm.collectPort = COLLECT_DEFAULT_PORT[via];
      }
      if (via === "SNMP" && !this.batchForm.collectSecret) {
        this.batchForm.collectSecret = "public";
      }
    },
    autoRefresh() {
      this.setupTimer();
    },
    // 刷新间隔变化时重新计时
    refreshMs() {
      this.setupTimer();
    },
    // 响应路由 query.deviceId 变化（同类型页面内切换）
    "$route.query.deviceId"(id) {
      if (id && this.devices.some((d) => d.id === id) && id !== this.currentDeviceId) {
        this.currentDeviceId = id;
        this.persistDevice(id);
        this.refreshMs = this.readRefreshMs(id);
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
    refreshKey(id) {
      return `cmops:refreshMs:${id}`;
    },
    // 读取设备刷新间隔：按设备 > 全局默认 > interval prop
    readRefreshMs(id) {
      try {
        const perDevice = id ? localStorage.getItem(this.refreshKey(id)) : null;
        if (perDevice) return Number(perDevice);
        const global = localStorage.getItem(REFRESH_KEY_DEFAULT);
        if (global) return Number(global);
      } catch (e) {
        /* ignore */
      }
      return this.interval;
    },
    persistRefreshMs(id, ms) {
      try {
        if (id) {
          localStorage.setItem(this.refreshKey(id), String(ms));
        }
        localStorage.setItem(REFRESH_KEY_DEFAULT, String(ms));
      } catch (e) {
        /* ignore */
      }
    },
    // 修改刷新间隔：持久化到当前设备 + 全局默认，并重新计时（watch 接管）
    onRefreshMsChange(ms) {
      this.persistRefreshMs(this.currentDeviceId, ms);
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
        // 载入该设备保存的刷新间隔
        this.refreshMs = this.readRefreshMs(target);
      } finally {
        this.loadingDevices = false;
      }
    },
    refreshNow() {
      this.refreshToken += 1;
    },
    onDeviceChange() {
      this.persistDevice(this.currentDeviceId);
      // 切换设备时载入该设备的刷新间隔
      this.refreshMs = this.readRefreshMs(this.currentDeviceId);
      this.refreshNow();
    },
    onDeviceAdded(device) {
      this.editingDevice = null;
      this.loadDevices(device && device.id);
    },
    openAdd() {
      this.editingDevice = null;
      this.addVisible = true;
    },
    // 每设备操作：编辑 / 测试采集 / 删除
    onDeviceCommand(cmd, d) {
      if (cmd === "edit") {
        this.editDeviceRow(d);
      } else if (cmd === "test") {
        this.testDeviceCollect(d);
      } else if (cmd === "delete") {
        this.removeDevice(d);
      }
    },
    editDeviceRow(d) {
      this.editingDevice = d;
      this.addVisible = true;
    },
    async testDeviceCollect(d) {
      try {
        const res = await testCollect(d.id);
        const c = (res && res.content) || {};
        if (c.ok) {
          this.$message.success(`采集成功 来源=${c.source} 用时${c.costMs}ms`);
        } else {
          this.$alert(c.note || "采集失败", "测试采集", { type: "warning" });
        }
      } catch (e) {
        /* 接口层已提示 */
      }
    },
    removeDevice(d) {
      this.$confirm(`确认删除设备「${d.name}」？`, "删除确认", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      })
        .then(async () => {
          const res = await deleteDevice(d.id);
          if (res.success) {
            this.$message.success("已删除");
            this.loadDevices();
          }
        })
        .catch(() => {});
    },
    // 批量设置采集
    openBatch() {
      this.batchSelected = [];
      this.batchForm.collectVia = "NONE";
      this.batchForm.collectPort = 22;
      this.batchForm.collectUser = "";
      this.batchForm.collectSecret = "";
      this.batchVisible = true;
    },
    onBatchClosed() {
      this.batchSelected = [];
    },
    toggleSelectAll(val) {
      this.batchSelected = val ? this.devices.map((d) => d.id) : [];
    },
    async submitBatch() {
      if (!this.batchSelected.length) {
        this.$message.warning("请至少选择一台设备");
        return;
      }
      this.batchSubmitting = true;
      try {
        const f = this.batchForm;
        const payload = { deviceIds: this.batchSelected, collectVia: f.collectVia };
        if (f.collectVia === "SSH" || f.collectVia === "WINRM") {
          payload.collectPort = f.collectPort;
          payload.collectUser = f.collectUser;
          payload.collectSecret = f.collectSecret;
        } else if (f.collectVia === "SNMP") {
          payload.collectPort = f.collectPort;
          payload.collectSecret = f.collectSecret;
        }
        const res = await batchCollect(payload);
        if (res.success) {
          const n = (res.content && res.content.updated) != null ? res.content.updated : this.batchSelected.length;
          this.$message.success(`已设置 ${n} 台`);
          this.batchVisible = false;
          this.loadDevices();
        }
      } finally {
        this.batchSubmitting = false;
      }
    },
    setupTimer() {
      this.clearTimer();
      if (this.autoRefresh) {
        this.timer = setInterval(this.refreshNow, this.refreshMs);
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
    padding: @space-sm @space-md;
    background: var(--cm-bg-card, @bg-card);
    border: 1px solid var(--cm-border-light, @border-light);
    border-radius: @radius-lg;
    margin-bottom: @space-sm;
    flex-shrink: 0;
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

  &__collect-tag {
    margin-left: 8px;
  }

  &__batch-via {
    margin-left: 8px;
  }

  &__ops {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__device {
    width: 220px;
  }

  &__interval {
    width: 96px;
  }

  &__device-sub {
    float: right;
    color: var(--cm-text-placeholder, @text-placeholder);
    font-size: 12px;
  }

  &__device-opt {
    position: relative;
  }

  &__device-actions {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
  }

  &__device-more {
    color: var(--cm-text-placeholder, @text-placeholder);
    cursor: pointer;

    &:hover {
      color: var(--cm-color-primary, @color-primary);
    }
  }

  &__batch-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: @space-sm;
  }

  &__batch-count {
    color: var(--cm-text-placeholder, @text-placeholder);
    font-size: 12px;
  }

  &__batch-list {
    display: flex;
    flex-direction: column;
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--cm-border-light, @border-light);
    border-radius: @radius-base;
    padding: @space-sm @space-md;
  }

  &__batch-item {
    display: flex;
    width: 100%;
    margin-right: 0;
  }

  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
