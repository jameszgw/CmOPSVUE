<template>
  <div class="monitor-layout">
    <!-- 左侧：搜索 + 新增设备 + 指标分类导航 -->
    <aside class="monitor-layout__side">
      <div class="monitor-layout__search">
        <el-input v-model="keyword" placeholder="搜索" clearable :prefix-icon="Search" />
        <el-button :icon="Plus" @click="openAdd" title="新增设备" />
        <el-button :icon="Setting" @click="openBatch" title="批量设置采集" />
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
          <el-tag
            v-if="currentDevice?.collectVia"
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
            <el-option-group
              v-for="g in deviceGroups"
              :key="g.label"
              :label="g.label"
            >
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
                  <el-icon class="monitor-layout__device-more" @click.stop>
                    <MoreFilled />
                  </el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="test">测试采集</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-option>
            </el-option-group>
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
      :edit-device="editingDevice"
      @added="onDeviceAdded"
    />

    <!-- 批量设置采集：勾选当前类型设备 + 采集配置 -->
    <el-dialog v-model="batchVisible" title="批量设置采集" width="560px" @closed="onBatchClosed">
      <div class="monitor-layout__batch-bar">
        <el-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected"
          @change="toggleSelectAll"
        >
          全选
        </el-checkbox>
        <span class="monitor-layout__batch-count">已选 {{ batchSelected.length }} / {{ devices.length }}</span>
      </div>
      <el-checkbox-group v-model="batchSelected" class="monitor-layout__batch-list">
        <el-checkbox v-for="d in devices" :key="d.id" :value="d.id" :label="d.id" class="monitor-layout__batch-item">
          <span>{{ d.name }}</span>
          <span class="monitor-layout__device-sub">{{ d.ip }}</span>
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

      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="submitBatch">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus, Setting, Refresh, RefreshRight, Monitor, MoreFilled } from "@element-plus/icons-vue";
import { listDevices, deleteDevice, batchCollect, testCollect } from "@/api/monitor-device";
import AddDeviceDialog from "./AddDeviceDialog.vue";

const props = defineProps({
  deviceType: { type: String, required: true },
  title: { type: String, default: "" },
  tabs: { type: Array, default: () => [] },
  // 自动刷新间隔(毫秒)
  interval: { type: Number, default: 5000 },
});

const route = useRoute();

// 记住上次选择的设备（按设备类型区分）
const storageKey = computed(() => `cm-last-device-${props.deviceType}`);
const readLastDevice = () => {
  try {
    return localStorage.getItem(storageKey.value) || "";
  } catch (e) {
    return "";
  }
};
const persistDevice = (id) => {
  try {
    if (id) {
      localStorage.setItem(storageKey.value, id);
    }
  } catch (e) {
    /* ignore */
  }
};

const keyword = ref("");
const devices = ref([]);
const currentDeviceId = ref("");
const activeKey = ref(props.tabs[0]?.key || "");
const autoRefresh = ref(true);
const refreshToken = ref(0);
const loadingDevices = ref(false);
const addVisible = ref(false);
const editingDevice = ref(null);
let timer = null;

// 默认采集端口（与 AddDeviceDialog 一致：SSH 22 / SNMP 161 / WinRM 5985）
const COLLECT_DEFAULT_PORT = { SSH: 22, SNMP: 161, WINRM: 5985 };

// 获取方式（采集方式）标签映射，用于头部展示设备配置的采集方式
const COLLECT_VIA_LABEL = {
  NONE: "模拟数据",
  AGENT: "Agent 探针",
  SSH: "SSH（无探针）",
  SNMP: "SNMP（无探针）",
  WINRM: "WinRM（无探针）",
  DIRECT: "直连采集",
};

// 批量设置采集
const batchVisible = ref(false);
const batchSubmitting = ref(false);
const batchSelected = ref([]);
const batchForm = reactive({
  collectVia: "NONE",
  collectPort: 22,
  collectUser: "",
  collectSecret: "",
});

const allSelected = computed(
  () => devices.value.length > 0 && batchSelected.value.length === devices.value.length
);
const someSelected = computed(
  () => batchSelected.value.length > 0 && batchSelected.value.length < devices.value.length
);

const toggleSelectAll = (val) => {
  batchSelected.value = val ? devices.value.map((d) => d.id) : [];
};

watch(
  () => batchForm.collectVia,
  (via) => {
    if (COLLECT_DEFAULT_PORT[via]) {
      batchForm.collectPort = COLLECT_DEFAULT_PORT[via];
    }
    if (via === "SNMP" && !batchForm.collectSecret) {
      batchForm.collectSecret = "public";
    }
  }
);

const filteredTabs = computed(() =>
  props.tabs.filter((t) => !keyword.value || t.label.includes(keyword.value))
);
const currentTabLabel = computed(
  () => props.tabs.find((t) => t.key === activeKey.value)?.label || props.title
);
const currentDevice = computed(() =>
  devices.value.find((d) => d.id === currentDeviceId.value)
);

// 按环境(env)分组设备，生产环境优先，其余按字母排序
const deviceGroups = computed(() => {
  const map = new Map();
  for (const d of devices.value) {
    const env = d.env || "默认环境";
    if (!map.has(env)) {
      map.set(env, []);
    }
    map.get(env).push(d);
  }
  const labels = Array.from(map.keys()).sort((a, b) => {
    if (a === "生产环境") return -1;
    if (b === "生产环境") return 1;
    return a.localeCompare(b);
  });
  return labels.map((label) => ({ label, list: map.get(label) }));
});

const loadDevices = async (preferId) => {
  loadingDevices.value = true;
  try {
    const res = await listDevices(props.deviceType);
    devices.value = res.content || [];
    const exists = (id) => id && devices.value.some((d) => d.id === id);
    // 优先级：路由 query.deviceId > preferId 参数 > localStorage > 当前值 > 第一个
    const queryId = route.query?.deviceId;
    let target = "";
    if (exists(queryId)) {
      target = queryId;
    } else if (exists(preferId)) {
      target = preferId;
    } else if (exists(readLastDevice())) {
      target = readLastDevice();
    } else if (exists(currentDeviceId.value)) {
      target = currentDeviceId.value;
    } else {
      target = devices.value[0]?.id || "";
    }
    currentDeviceId.value = target;
    persistDevice(target);
  } finally {
    loadingDevices.value = false;
  }
};

const refreshNow = () => {
  refreshToken.value += 1;
};

const onDeviceChange = () => {
  persistDevice(currentDeviceId.value);
  refreshNow();
};

// 同页面下路由 query.deviceId 变化（全局搜索跳转到同类型设备）时更新选中
watch(
  () => route.query.deviceId,
  (id) => {
    if (id && id !== currentDeviceId.value && devices.value.some((d) => d.id === id)) {
      currentDeviceId.value = id;
      persistDevice(id);
      refreshNow();
    }
  }
);

const onDeviceAdded = (device) => {
  editingDevice.value = null;
  loadDevices(device?.id);
};

const openAdd = () => {
  editingDevice.value = null;
  addVisible.value = true;
};

// 每设备操作：编辑 / 测试采集 / 删除
const onDeviceCommand = (cmd, d) => {
  if (cmd === "edit") {
    editDeviceRow(d);
  } else if (cmd === "test") {
    testDeviceCollect(d);
  } else if (cmd === "delete") {
    removeDevice(d);
  }
};

const editDeviceRow = (d) => {
  editingDevice.value = d;
  addVisible.value = true;
};

const testDeviceCollect = async (d) => {
  try {
    const res = await testCollect(d.id);
    const c = res.content || {};
    if (c.ok) {
      ElMessage.success(`采集成功 来源=${c.source} 用时${c.costMs}ms`);
    } else {
      ElMessageBox.alert(c.note || "采集失败", "测试采集", { type: "warning" });
    }
  } catch (e) {
    /* 接口层已提示 */
  }
};

const removeDevice = (d) => {
  ElMessageBox.confirm(`确认删除设备「${d.name}」？`, "删除确认", {
    type: "warning",
    confirmButtonText: "删除",
    cancelButtonText: "取消",
  })
    .then(async () => {
      const res = await deleteDevice(d.id);
      if (res.success) {
        ElMessage.success("已删除");
        loadDevices();
      }
    })
    .catch(() => {});
};

// 批量设置采集
const openBatch = () => {
  batchSelected.value = [];
  batchForm.collectVia = "NONE";
  batchForm.collectPort = 22;
  batchForm.collectUser = "";
  batchForm.collectSecret = "";
  batchVisible.value = true;
};

const onBatchClosed = () => {
  batchSelected.value = [];
};

const submitBatch = async () => {
  if (!batchSelected.value.length) {
    ElMessage.warning("请至少选择一台设备");
    return;
  }
  batchSubmitting.value = true;
  try {
    const payload = {
      deviceIds: batchSelected.value,
      collectVia: batchForm.collectVia,
    };
    if (batchForm.collectVia === "SSH" || batchForm.collectVia === "WINRM") {
      payload.collectPort = batchForm.collectPort;
      payload.collectUser = batchForm.collectUser;
      payload.collectSecret = batchForm.collectSecret;
    } else if (batchForm.collectVia === "SNMP") {
      payload.collectPort = batchForm.collectPort;
      payload.collectSecret = batchForm.collectSecret;
    }
    const res = await batchCollect(payload);
    if (res.success) {
      const n = res.content?.updated ?? batchSelected.value.length;
      ElMessage.success(`已设置 ${n} 台`);
      batchVisible.value = false;
      loadDevices();
    }
  } finally {
    batchSubmitting.value = false;
  }
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
    background: var(--cm-bg-card);
    border: 1px solid var(--cm-border-light);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__search {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-bottom: 1px solid var(--cm-border-light);
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
    color: var(--cm-text-regular);
    font-size: 14px;
    margin-bottom: 2px;

    &:hover {
      background: var(--cm-bg-soft);
    }

    &.active {
      background: var(--cm-active-soft);
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
    padding: 8px 12px;
    background: var(--cm-bg-card);
    border: 1px solid var(--cm-border-light);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--cm-text-primary);

    .el-icon {
      color: #409eff;
    }
  }

  &__collect-tag {
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

  &__device-sub {
    float: right;
    color: var(--cm-text-placeholder);
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
    color: var(--cm-text-placeholder);
    cursor: pointer;

    &:hover {
      color: #409eff;
    }
  }

  &__batch-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__batch-count {
    color: var(--cm-text-placeholder);
    font-size: 12px;
  }

  &__batch-list {
    display: flex;
    flex-direction: column;
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid var(--cm-border-light);
    border-radius: 6px;
    padding: 8px 12px;
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
