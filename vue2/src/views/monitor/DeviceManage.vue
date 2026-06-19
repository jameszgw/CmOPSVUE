<template>
  <screen-page v-loading="loading" title="监控设备维护" gap="8px">
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
            v-for="t in deviceTypes"
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
          prefix-icon="el-icon-search"
        />
        <span class="dm-filter__count">共 {{ filtered.length }} 台</span>
      </div>
    </template>

    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="设备列表"
      icon="el-icon-monitor"
    >
      <template slot="extra">
        <div class="dm-toolbar">
          <!-- 新增：指定类型直接新增；全部类型时下拉选择类型 -->
          <el-button
            v-if="activeType"
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="openAdd(activeType)"
          >
            新增{{ typeLabel(activeType) }}
          </el-button>
          <el-dropdown v-else trigger="click" @command="openAdd">
            <el-button type="primary" size="small" icon="el-icon-plus">
              新增设备<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-for="t in deviceTypes" :key="t" :command="t">
                <i :class="typeIcon(t)"></i>
                {{ typeLabel(t) }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>

          <el-button
            size="small"
            icon="el-icon-setting"
            :disabled="!selected.length"
            @click="openBatch"
          >
            批量设置采集
          </el-button>
          <el-button
            size="small"
            icon="el-icon-document-copy"
            :loading="dupLoading"
            @click="openDuplicate"
          >
            检测重复主机
          </el-button>
          <el-button size="small" icon="el-icon-refresh-right" @click="load">刷新</el-button>
        </div>
      </template>

      <el-table
        ref="table"
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
          <template slot-scope="{ row }">{{ row.name }}</template>
        </el-table-column>
        <el-table-column label="地址" min-width="160">
          <template slot-scope="{ row }">{{ row.ip }}:{{ row.port }}</template>
        </el-table-column>
        <el-table-column label="类型" width="140">
          <template slot-scope="{ row }">
            <span class="dm-type">
              <i :class="typeIcon(row.type)" class="dm-type__icon" :style="{ color: typeColor(row.type) }"></i>
              <span>{{ typeLabel(row.type) }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="采集方式" width="130">
          <template slot-scope="{ row }">
            <el-tag
              size="mini"
              :type="row.collectVia && row.collectVia !== 'NONE' ? 'success' : 'info'"
            >
              {{ COLLECT_VIA_LABEL[row.collectVia] || row.collectVia || "模拟数据" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="摘要" min-width="180" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ summary(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="mini" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" size="mini" @click="testRow(row)">测试采集</el-button>
            <el-popconfirm
              :title="`确认删除「${row.name}」？`"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="removeRow(row)"
            >
              <el-button slot="reference" type="text" size="mini" class="dm-del">删除</el-button>
            </el-popconfirm>
          </template>
        </el-table-column>

        <template slot="empty">
          <el-empty description="暂无设备" :image-size="80" />
        </template>
      </el-table>
    </section-card>

    <!-- 新增 / 编辑设备 -->
    <add-device-dialog
      v-model="addVisible"
      :device-type="addType"
      :edit-device="editingDevice"
      @added="onDeviceAdded"
    />

    <!-- 批量设置采集 -->
    <el-dialog :visible.sync="batchVisible" title="批量设置采集" width="480px" @closed="onBatchClosed">
      <div class="dm-batch-bar">
        <i class="el-icon-setting"></i>
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
      <div slot="footer">
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="submitBatch">确定</el-button>
      </div>
    </el-dialog>

    <!-- 重复主机检测 -->
    <el-dialog :visible.sync="dupVisible" title="重复主机检测" width="640px">
      <p class="dm-dup-hint">
        同一物理主机若有多个 IP（如 KVM 宿主的网桥与物理网卡），会被登记成多台设备；此处按主机身份(machineId/IP)归并，可删除重复项仅保留主设备。需设备已配置
        Agent 且开启真实采集才能识别。
      </p>
      <el-empty
        v-if="!dupGroups.length"
        description="未检测到重复主机（同一物理主机的多个 IP 设备）"
        :image-size="80"
      />
      <div
        v-for="(g, gi) in dupGroups"
        :key="g.machineId || g.hostName || gi"
        class="dm-dup-group"
      >
        <div class="dm-dup-group__head">
          <span class="dm-dup-group__title">
            主机 {{ groupTitle(g) }} · 共 {{ g.deviceCount }} 台
          </span>
          <el-button
            type="danger"
            size="small"
            plain
            :loading="dupDeleting === gi"
            @click="removeGroupDuplicates(g, gi)"
          >
            删除重复设备
          </el-button>
        </div>
        <el-table :data="g.devices || []" size="small" border class="dense-table">
          <el-table-column label="名称" min-width="140" show-overflow-tooltip>
            <template slot-scope="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="地址" min-width="130">
            <template slot-scope="{ row }">{{ row.ip }}</template>
          </el-table-column>
          <el-table-column label="采集方式" width="120">
            <template slot-scope="{ row }">
              {{ COLLECT_VIA_LABEL[row.collectVia] || row.collectVia || "模拟数据" }}
            </template>
          </el-table-column>
          <el-table-column label="角色" width="120">
            <template slot-scope="{ row }">
              <el-tag v-if="row.primary" size="mini" type="success">主设备(保留)</el-tag>
              <el-tag v-else size="mini" type="warning">重复(可删除)</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer">
        <el-button @click="dupVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import AddDeviceDialog from "@/components/monitor/AddDeviceDialog.vue";
import { listDevices, deleteDevice, batchCollect, testCollect, getDuplicateHosts } from "@/api/monitor-device";

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

// 设备类型 → Element UI 字体图标类名，缺省回退 el-icon-monitor。
const TYPE_ICON = {
  SERVER: "el-icon-monitor", REDIS: "el-icon-coin", DATABASE: "el-icon-files",
  K8S: "el-icon-cloudy", MQ: "el-icon-connection", LB: "el-icon-share",
  STORAGE: "el-icon-box", NETDEV: "el-icon-connection", GPU: "el-icon-cpu",
  AI: "el-icon-magic-stick", POWER: "el-icon-lightning", ESS: "el-icon-coin",
  IOT: "el-icon-connection", SBC: "el-icon-cpu", ANDROID: "el-icon-mobile-phone",
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

export default {
  name: "DeviceManage",
  components: {
    ScreenPage,
    SectionCard,
    AddDeviceDialog,
  },
  data() {
    return {
      COLLECT_VIA_LABEL,
      deviceTypes: DEVICE_TYPES,
      loading: false,
      devices: [],
      activeType: "",
      keyword: "",
      selected: [],
      // 新增 / 编辑
      addVisible: false,
      addType: "SERVER",
      editingDevice: null,
      // 重复主机检测
      dupVisible: false,
      dupLoading: false,
      dupDeleting: -1,
      dupGroups: [],
      // 批量设置采集
      batchVisible: false,
      batchSubmitting: false,
      batchForm: {
        collectVia: "NONE",
        collectPort: 22,
        collectUser: "",
        collectSecret: "",
      },
    };
  },
  computed: {
    filtered() {
      const kw = this.keyword.trim().toLowerCase();
      return this.devices.filter((d) => {
        if (!kw) return true;
        return (
          (d.name || "").toLowerCase().indexOf(kw) !== -1 ||
          (d.ip || "").toLowerCase().indexOf(kw) !== -1
        );
      });
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
  },
  created() {
    this.load();
  },
  methods: {
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    typeIcon(t) {
      return TYPE_ICON[t] || "el-icon-monitor";
    },
    typeColor(t) {
      return TYPE_COLOR[t] || "#909399";
    },
    // 一行式类型摘要（best-effort，缺字段显示 -）
    summary(row) {
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
          v = this.typeLabel(row.type);
      }
      return v || "-";
    },
    async load() {
      this.loading = true;
      try {
        // 无类型 → 返回全部设备；有类型 → 过滤
        const res = await listDevices(this.activeType || undefined);
        this.devices = (res && res.content) || [];
      } finally {
        this.loading = false;
      }
    },
    onSelectionChange(rows) {
      this.selected = rows;
    },
    // 新增（command = 类型）
    openAdd(type) {
      this.editingDevice = null;
      this.addType = type || this.activeType || "SERVER";
      this.addVisible = true;
    },
    openEdit(row) {
      this.editingDevice = row;
      this.addType = row.type || "SERVER";
      this.addVisible = true;
    },
    onDeviceAdded() {
      this.editingDevice = null;
      this.load();
    },
    async testRow(row) {
      try {
        const res = await testCollect(row.id);
        const c = (res && res.content) || {};
        if (c.ok) {
          this.$message.success(`采集成功 来源=${c.source} 用时${c.costMs}ms`);
        } else {
          this.$message.warning(c.note || "采集失败");
        }
      } catch (e) {
        /* 接口层已提示 */
      }
    },
    async removeRow(row) {
      const res = await deleteDevice(row.id);
      if (res && res.success) {
        this.$message.success("已删除");
        this.load();
      }
    },
    // 重复主机检测
    groupTitle(g) {
      return g.hostName || (g.machineId ? g.machineId.slice(0, 12) : "未知主机");
    },
    async loadDuplicates() {
      const res = await getDuplicateHosts();
      this.dupGroups = (res && res.content) || [];
    },
    async openDuplicate() {
      this.dupLoading = true;
      try {
        await this.loadDuplicates();
        this.dupVisible = true;
      } finally {
        this.dupLoading = false;
      }
    },
    async removeGroupDuplicates(group, index) {
      const dups = (group.devices || []).filter((d) => d.primary === false);
      if (!dups.length) {
        this.$message.info("该组没有可删除的重复设备");
        return;
      }
      this.dupDeleting = index;
      try {
        for (const d of dups) {
          await deleteDevice(d.id);
        }
        this.$message.success(`已删除 ${dups.length} 台重复设备`);
        await this.loadDuplicates();
        this.load();
        if (!this.dupGroups.length) {
          this.dupVisible = false;
        }
      } finally {
        this.dupDeleting = -1;
      }
    },
    openBatch() {
      this.batchForm.collectVia = "NONE";
      this.batchForm.collectPort = 22;
      this.batchForm.collectUser = "";
      this.batchForm.collectSecret = "";
      this.batchVisible = true;
    },
    onBatchClosed() {
      /* 保留勾选，由表格 selection 控制 */
    },
    async submitBatch() {
      if (!this.selected.length) {
        this.$message.warning("请至少选择一台设备");
        return;
      }
      this.batchSubmitting = true;
      try {
        const f = this.batchForm;
        const payload = {
          deviceIds: this.selected.map((d) => d.id),
          collectVia: f.collectVia,
        };
        if (f.collectVia === "SSH" || f.collectVia === "WINRM") {
          payload.collectPort = f.collectPort;
          payload.collectUser = f.collectUser;
          payload.collectSecret = f.collectSecret;
        } else if (f.collectVia === "SNMP") {
          payload.collectPort = f.collectPort;
          payload.collectSecret = f.collectSecret;
        }
        const res = await batchCollect(payload);
        if (res && res.success) {
          const n =
            res.content && res.content.updated != null
              ? res.content.updated
              : this.selected.length;
          this.$message.success(`已设置 ${n} 台`);
          this.batchVisible = false;
          this.load();
        }
      } finally {
        this.batchSubmitting = false;
      }
    },
  },
};
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

.dm-del {
  color: @color-danger;
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

.dm-dup-hint {
  margin: 0 0 @space-md;
  padding: 8px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  color: @text-secondary;
  font-size: 12px;
  line-height: 1.6;
}

.dm-dup-group {
  margin-bottom: @space-md;

  &:last-child {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: @text-primary;
  }
}
</style>
