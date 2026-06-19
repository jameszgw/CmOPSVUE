<template>
  <ScreenPage v-loading="loading" title="监控设备维护" gap="8px">
    <template #header-extra>
      <div class="dm-filter">
        <el-select
          v-model="activeType"
          size="small"
          class="dm-filter__type"
          placeholder="全部类型"
          @change="load"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="t in DEVICE_TYPES"
            :key="t"
            :label="typeLabel(t)"
            :value="t"
          />
        </el-select>
        <el-input
          v-model="keyword"
          class="dm-filter__search"
          placeholder="搜索名称 / 地址"
          clearable
          size="small"
          :prefix-icon="Search"
        />
        <span class="dm-filter__count">共 {{ filtered.length }} 台</span>
      </div>
    </template>

    <SectionCard
      dense
      scrollable
      bodyClass="dense-table fill"
      class="fill"
      title="设备列表"
      icon="Monitor"
    >
      <template #extra>
        <div class="dm-toolbar">
          <!-- 新增：指定类型直接新增；全部类型时下拉选择类型 -->
          <el-button
            v-if="activeType"
            type="primary"
            size="small"
            :icon="Plus"
            @click="openAdd(activeType)"
          >
            新增{{ typeLabel(activeType) }}
          </el-button>
          <el-dropdown v-else trigger="click" @command="openAdd">
            <el-button type="primary" size="small" :icon="Plus">
              新增设备<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="t in DEVICE_TYPES" :key="t" :command="t">
                  <el-icon><component :is="typeIcon(t)" /></el-icon>
                  {{ typeLabel(t) }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button
            size="small"
            :icon="Setting"
            :disabled="!selected.length"
            @click="openBatch"
          >
            批量设置采集
          </el-button>
          <el-button size="small" :icon="RefreshRight" @click="load">刷新</el-button>
        </div>
      </template>

      <el-table
        ref="tableRef"
        :data="filtered"
        size="small"
        stripe
        border
        height="100%"
        class="dense-table dm-table"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="42" />
        <el-table-column label="名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column label="地址" min-width="160">
          <template #default="{ row }">{{ row.ip }}:{{ row.port }}</template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template #default="{ row }">
            <span class="dm-type">
              <el-icon class="dm-type__icon" :style="{ color: typeColor(row.type) }">
                <component :is="typeIcon(row.type)" />
              </el-icon>
              <span>{{ typeLabel(row.type) }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="采集方式" width="130">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="light"
              :type="row.collectVia && row.collectVia !== 'NONE' ? 'success' : 'info'"
            >
              {{ COLLECT_VIA_LABEL[row.collectVia] || row.collectVia || "模拟数据" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="摘要" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ summary(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="testRow(row)">测试采集</el-button>
            <el-popconfirm
              :title="`确认删除「${row.name}」？`"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="removeRow(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无设备" :image-size="80" />
        </template>
      </el-table>
    </SectionCard>

    <!-- 新增 / 编辑设备 -->
    <AddDeviceDialog
      v-model="addVisible"
      :device-type="addType"
      :edit-device="editingDevice"
      @added="onDeviceAdded"
    />

    <!-- 批量设置采集 -->
    <el-dialog v-model="batchVisible" title="批量设置采集" width="480px" @closed="onBatchClosed">
      <div class="dm-batch-bar">
        <el-icon><Setting /></el-icon>
        <span>已选 {{ selected.length }} 台设备</span>
      </div>
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
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { Search, Plus, Setting, RefreshRight, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import AddDeviceDialog from "@/components/monitor/AddDeviceDialog.vue";
import { listDevices, deleteDevice, batchCollect, testCollect } from "@/api/monitor-device";

// 设备类型代码顺序（与监控侧栏/新增弹窗口径一致）
const DEVICE_TYPES = [
  "SERVER", "REDIS", "DATABASE", "K8S", "MQ", "LB", "STORAGE",
  "NETDEV", "GPU", "POWER", "ESS", "IOT", "SBC", "ANDROID",
];

// 设备类型 → 中文名（copy from AddDeviceDialog.vue）
const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "K8s集群",
  MQ: "消息中间件", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
  POWER: "电能", ESS: "储能", IOT: "物联", SBC: "单板机", ANDROID: "安卓多开", AI: "AI",
};

// 设备类型 → Element Plus 图标组件名（已在 main.js 全局注册）
// 缺省回退到 Monitor。
const TYPE_ICON = {
  SERVER: "Monitor", REDIS: "Coin", DATABASE: "Files", K8S: "Cloudy",
  MQ: "Connection", LB: "Share", STORAGE: "Box", NETDEV: "Connection", GPU: "Cpu",
  AI: "MagicStick", POWER: "Lightning", ESS: "Coin", IOT: "Connection",
  SBC: "Cpu", ANDROID: "Cellphone",
};

// 设备类型 → 图标颜色，便于区分
const TYPE_COLOR = {
  SERVER: "#409eff", REDIS: "#e6493b", DATABASE: "#67c23a", K8S: "#326ce5",
  MQ: "#e6a23c", LB: "#9254de", STORAGE: "#13c2c2", NETDEV: "#2f9e7d", GPU: "#f56c6c",
  AI: "#722ed1", POWER: "#fa8c16", ESS: "#52c41a", IOT: "#1890ff",
  SBC: "#8c8c8c", ANDROID: "#3ddc84",
};

// 采集方式标签映射（copy from MonitorLayout.vue）
const COLLECT_VIA_LABEL = {
  NONE: "模拟数据",
  AGENT: "Agent 探针",
  SSH: "SSH（无探针）",
  SNMP: "SNMP（无探针）",
  WINRM: "WinRM（无探针）",
  DIRECT: "直连采集",
};

const COLLECT_DEFAULT_PORT = { SSH: 22, SNMP: 161, WINRM: 5985 };

const typeLabel = (t) => TYPE_LABEL[t] || t || "-";
const typeIcon = (t) => TYPE_ICON[t] || "Monitor";
const typeColor = (t) => TYPE_COLOR[t] || "#909399";

const loading = ref(false);
const devices = ref([]);
const activeType = ref("");
const keyword = ref("");
const selected = ref([]);
const tableRef = ref(null);

// 新增 / 编辑
const addVisible = ref(false);
const addType = ref("SERVER");
const editingDevice = ref(null);

// 批量设置采集
const batchVisible = ref(false);
const batchSubmitting = ref(false);
const batchForm = reactive({
  collectVia: "NONE",
  collectPort: 22,
  collectUser: "",
  collectSecret: "",
});

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

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return devices.value.filter((d) => {
    if (!kw) return true;
    return (
      (d.name || "").toLowerCase().includes(kw) ||
      (d.ip || "").toLowerCase().includes(kw)
    );
  });
});

// 一行式类型摘要（best-effort，缺字段显示 -）
const summary = (row) => {
  let v = "";
  switch (row.type) {
    case "SERVER":
      v = [row.category, row.osName].filter(Boolean).join(" / ");
      break;
    case "DATABASE":
      v = row.dbType;
      break;
    case "REDIS":
      v = row.redisMode;
      break;
    case "MQ":
      v = row.mqType;
      break;
    case "LB":
      v = row.lbType;
      break;
    default:
      v = typeLabel(row.type);
  }
  return v || "-";
};

const load = async () => {
  loading.value = true;
  try {
    // 无类型 → 返回全部设备；有类型 → 过滤
    const res = await listDevices(activeType.value || undefined);
    devices.value = res.content || [];
  } finally {
    loading.value = false;
  }
};

const onSelectionChange = (rows) => {
  selected.value = rows;
};

// 新增（command = 类型）
const openAdd = (type) => {
  editingDevice.value = null;
  addType.value = type || activeType.value || "SERVER";
  addVisible.value = true;
};

const openEdit = (row) => {
  editingDevice.value = row;
  addType.value = row.type || "SERVER";
  addVisible.value = true;
};

const onDeviceAdded = () => {
  editingDevice.value = null;
  load();
};

const testRow = async (row) => {
  try {
    const res = await testCollect(row.id);
    const c = res.content || {};
    if (c.ok) {
      ElMessage.success(`采集成功 来源=${c.source} 用时${c.costMs}ms`);
    } else {
      ElMessage.warning(c.note || "采集失败");
    }
  } catch (e) {
    /* 接口层已提示 */
  }
};

const removeRow = async (row) => {
  const res = await deleteDevice(row.id);
  if (res.success) {
    ElMessage.success("已删除");
    load();
  }
};

const openBatch = () => {
  batchForm.collectVia = "NONE";
  batchForm.collectPort = 22;
  batchForm.collectUser = "";
  batchForm.collectSecret = "";
  batchVisible.value = true;
};

const onBatchClosed = () => {
  /* 保留勾选，由表格 selection 控制 */
};

const submitBatch = async () => {
  if (!selected.value.length) {
    ElMessage.warning("请至少选择一台设备");
    return;
  }
  batchSubmitting.value = true;
  try {
    const payload = {
      deviceIds: selected.value.map((d) => d.id),
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
      const n = res.content?.updated ?? selected.value.length;
      ElMessage.success(`已设置 ${n} 台`);
      batchVisible.value = false;
      load();
    }
  } finally {
    batchSubmitting.value = false;
  }
};

onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.dm-filter {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;

  &__type {
    width: 130px;
  }

  &__search {
    width: 220px;
  }

  &__count {
    color: @text-secondary;
    font-size: 12px;
  }
}

.dm-toolbar {
  display: flex;
  align-items: center;
  gap: @space-sm;
}

.dm-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &__icon {
    font-size: 15px;
  }
}

.dm-batch-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: @space-md;
  color: @text-secondary;
  font-size: 13px;
}

.dm-table {
  width: 100%;
}
</style>
