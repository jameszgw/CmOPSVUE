<template>
  <div class="page-container">
    <!-- 顶部工具栏：视图管理 -->
    <SectionCard title="拓扑维护" icon="Share">
      <template #extra>
        <span v-if="currentView.remark">{{ currentView.remark }}</span>
      </template>
      <div class="toolbar">
        <div class="toolbar__group">
          <span class="toolbar__label">当前视图</span>
          <el-select
            v-model="currentViewId"
            placeholder="请选择视图"
            style="width: 220px"
            @change="handleViewChange"
          >
            <el-option
              v-for="v in views"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
          <el-button :icon="Plus" @click="openCreateView">新建视图</el-button>
          <el-button
            :icon="Edit"
            :disabled="!currentViewId"
            @click="openRenameView"
            >重命名</el-button
          >
          <el-button
            :icon="Delete"
            type="danger"
            plain
            :disabled="!currentViewId"
            @click="handleDeleteView"
            >删除视图</el-button
          >
          <el-button :icon="Refresh" @click="reloadGraph">刷新</el-button>
        </div>
      </div>
    </SectionCard>

    <!-- 统计 -->
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="12" :sm="6">
        <StatCard icon="Share" label="节点总数" :value="nodeCount" color="#409eff" />
      </el-col>
      <el-col :xs="12" :sm="6">
        <StatCard icon="CircleCheck" label="健康" :value="g.healthy ?? 0" color="#67c23a" />
      </el-col>
      <el-col :xs="12" :sm="6">
        <StatCard icon="Warning" label="警告" :value="g.warning ?? 0" color="#e6a23c" />
      </el-col>
      <el-col :xs="12" :sm="6">
        <StatCard icon="CircleClose" label="严重" :value="g.critical ?? 0" color="#f56c6c" />
      </el-col>
    </el-row>

    <!-- 画布 -->
    <SectionCard title="拓扑画布" icon="Connection">
      <template #extra>
        <span v-if="selectedNode">已选节点：{{ selectedNode.name }}</span>
        <span v-else-if="selectedEdge">已选连线：{{ selectedEdge.relation }}</span>
        <span v-else>可拖拽节点，点击节点查看详情</span>
      </template>
      <div class="edit-toolbar">
        <el-button :icon="Monitor" :disabled="!currentViewId" @click="openAddDeviceNode"
          >从设备添加节点</el-button
        >
        <el-button :icon="Box" :disabled="!currentViewId" @click="openAddVirtualNode"
          >添加虚拟节点</el-button
        >
        <el-button :icon="Connection" :disabled="!currentViewId" @click="openAddEdge"
          >添加连线</el-button
        >
        <el-button type="primary" :icon="Finished" :disabled="!currentViewId" @click="saveLayout"
          >保存布局</el-button
        >
        <el-button
          type="danger"
          plain
          :icon="Delete"
          :disabled="!selectedNode && !selectedEdge"
          @click="deleteSelected"
          >删除选中</el-button
        >
      </div>
      <el-empty v-if="!currentViewId" description="请先选择或新建视图" />
      <div v-show="currentViewId" ref="chartRef" class="topo-chart"></div>
    </SectionCard>

    <!-- 新建 / 重命名视图对话框 -->
    <el-dialog
      v-model="viewDialog.visible"
      :title="viewDialog.mode === 'create' ? '新建视图' : '重命名视图'"
      width="460px"
    >
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="viewDialog.name" placeholder="请输入视图名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="viewDialog.remark" placeholder="可选" />
        </el-form-item>
        <el-form-item label="布局">
          <el-select v-model="viewDialog.layoutMode" style="width: 100%">
            <el-option label="手动布局" value="manual" />
            <el-option label="分层布局" value="layered" />
            <el-option label="力导向" value="force" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="viewDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="viewDialog.saving" @click="submitView"
          >确定</el-button
        >
      </template>
    </el-dialog>

    <!-- 从设备添加节点对话框 -->
    <el-dialog v-model="deviceDialog.visible" title="从设备添加节点" width="560px">
      <el-form label-width="80px">
        <el-form-item label="设备类型">
          <el-select
            v-model="deviceDialog.type"
            style="width: 100%"
            @change="loadDevices"
          >
            <el-option
              v-for="t in DEVICE_TYPES"
              :key="t.value"
              :label="t.label"
              :value="t.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备">
          <el-select
            v-model="deviceDialog.deviceId"
            placeholder="请选择设备"
            style="width: 100%"
            filterable
            :loading="deviceDialog.loading"
          >
            <el-option
              v-for="d in devices"
              :key="d.id"
              :label="`${d.name}（${d.ip || '-'}）`"
              :value="d.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="deviceDialog.saving"
          :disabled="!deviceDialog.deviceId"
          @click="submitDeviceNode"
          >添加</el-button
        >
      </template>
    </el-dialog>

    <!-- 添加连线对话框 -->
    <el-dialog v-model="edgeDialog.visible" title="添加连线" width="520px">
      <el-form label-width="80px">
        <el-form-item label="源节点">
          <el-select v-model="edgeDialog.sourceNodeId" placeholder="请选择" style="width: 100%" filterable>
            <el-option
              v-for="n in nodes"
              :key="n.id"
              :label="n.name"
              :value="n.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标节点">
          <el-select v-model="edgeDialog.targetNodeId" placeholder="请选择" style="width: 100%" filterable>
            <el-option
              v-for="n in nodes"
              :key="n.id"
              :label="n.name"
              :value="n.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关系">
          <el-select v-model="edgeDialog.relation" style="width: 100%">
            <el-option
              v-for="r in RELATIONS"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="edgeDialog.label" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edgeDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="edgeDialog.saving" @click="submitEdge"
          >添加</el-button
        >
      </template>
    </el-dialog>

    <!-- 节点详情抽屉 -->
    <el-drawer
      v-model="drawer.visible"
      :title="drawer.data?.name || '节点详情'"
      size="380px"
    >
      <div v-loading="drawer.loading" class="drawer-body">
        <div class="drawer-row">
          <span class="drawer-row__label">状态</span>
          <el-tag :type="statusTagType(drawer.data?.status)" effect="dark" size="small">
            {{ statusLabel(drawer.data?.status) }}
          </el-tag>
        </div>
        <div class="drawer-row">
          <span class="drawer-row__label">类型</span>
          <span>{{ typeLabel(drawer.data?.type) }}</span>
        </div>
        <div class="drawer-row">
          <span class="drawer-row__label">IP</span>
          <span>{{ drawer.data?.ip || "-" }}</span>
        </div>

        <div class="drawer-section">指标</div>
        <el-empty
          v-if="!metricEntries.length"
          description="暂无指标"
          :image-size="60"
        />
        <div v-else class="metric-list">
          <div v-for="m in metricEntries" :key="m.key" class="metric-item">
            <span class="metric-item__key">{{ m.key }}</span>
            <span class="metric-item__val">{{ m.value }}</span>
          </div>
        </div>

        <div class="drawer-section">告警</div>
        <el-empty
          v-if="!(drawer.data?.alerts || []).length"
          description="暂无告警"
          :image-size="60"
        />
        <div v-else class="alert-list">
          <div
            v-for="(a, i) in drawer.data?.alerts || []"
            :key="a.id ?? i"
            class="alert-item"
          >
            <el-tag :type="statusTagType(a.severity || a.level)" size="small" effect="plain">
              {{ a.severity || a.level || "alert" }}
            </el-tag>
            <span class="alert-item__msg">{{ a.message || a.title || a.name || "-" }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Refresh,
  Monitor,
  Box,
  Connection,
  Finished,
} from "@element-plus/icons-vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  listTopoViews,
  createTopoView,
  updateTopoView,
  deleteTopoView,
  getTopoViewGraph,
  createTopoNode,
  updateTopoNode,
  deleteTopoNode,
  createTopoEdge,
  deleteTopoEdge,
  getTopoNodeMetrics,
} from "@/api/monitor-topology";
import { listDevices } from "@/api/monitor-device";

const STATUS_COLOR = {
  healthy: "#67c23a",
  warning: "#e6a23c",
  critical: "#f56c6c",
};
const STATUS_TEXT = { healthy: "健康", warning: "警告", critical: "严重" };
const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息队列",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
  VIRTUAL: "虚拟节点",
  INTERNET: "互联网",
};
const DEVICE_TYPES = [
  { label: "服务器", value: "SERVER" },
  { label: "Redis", value: "REDIS" },
  { label: "数据库", value: "DATABASE" },
];
const RELATIONS = [
  { label: "路由 routes", value: "routes" },
  { label: "依赖 depends", value: "depends" },
  { label: "存储 stores", value: "stores" },
  { label: "网络 network", value: "network" },
  { label: "自定义 custom", value: "custom" },
];

const typeLabel = (t) => TYPE_LABEL[t] || t || "-";
const statusLabel = (s) => STATUS_TEXT[s] || s || "-";
const statusTagType = (s) => {
  if (s === "critical") return "danger";
  if (s === "warning") return "warning";
  if (s === "healthy") return "success";
  return "info";
};

// ===== 状态 =====
const views = ref([]);
const currentViewId = ref(null);
const graph = ref({});
const g = computed(() => graph.value || {});
const nodes = computed(() => g.value.nodes || []);
const nodeCount = computed(() => nodes.value.length);
const currentView = computed(
  () => views.value.find((v) => v.id === currentViewId.value) || {}
);

const selectedNode = ref(null);
const selectedEdge = ref(null);

const chartRef = ref(null);
let chart = null;
let loading = false;

// ===== 视图加载 =====
const loadViews = async () => {
  try {
    const res = await listTopoViews();
    views.value = res?.content || [];
    if (views.value.length) {
      const exists = views.value.some((v) => v.id === currentViewId.value);
      if (!exists) currentViewId.value = views.value[0].id;
      await reloadGraph();
    } else {
      currentViewId.value = null;
      graph.value = {};
    }
  } catch (e) {
    /* keep previous */
  }
};

const reloadGraph = async () => {
  if (!currentViewId.value || loading) return;
  loading = true;
  try {
    const res = await getTopoViewGraph(currentViewId.value);
    graph.value = res?.content || {};
    selectedNode.value = null;
    selectedEdge.value = null;
    await nextTick();
    renderChart();
  } catch (e) {
    /* keep previous */
  } finally {
    loading = false;
  }
};

const handleViewChange = () => {
  selectedNode.value = null;
  selectedEdge.value = null;
  reloadGraph();
};

// ===== 画布渲染 =====
const renderChart = () => {
  if (!chartRef.value) return;
  if (!chart) {
    chart = echarts.init(chartRef.value);
    chart.on("click", onChartClick);
  }

  const nodeList = nodes.value;
  const edgeList = g.value.edges || [];

  const chartNodes = nodeList.map((n, idx) => {
    const isVirtual = n.type === "VIRTUAL" || n.type === "INTERNET";
    return {
      id: String(n.id),
      name: n.name,
      x: n.x ?? (idx % 5) * 160 + 80,
      y: n.y ?? Math.floor(idx / 5) * 160 + 80,
      symbol: isVirtual ? "rect" : "circle",
      symbolSize: 46,
      itemStyle: {
        color: isVirtual ? "#909399" : STATUS_COLOR[n.status] || "#67c23a",
        borderColor:
          selectedNode.value && selectedNode.value.id === n.id
            ? "#409eff"
            : "transparent",
        borderWidth:
          selectedNode.value && selectedNode.value.id === n.id ? 4 : 0,
      },
      label: { show: true },
      _meta: n,
    };
  });

  const chartLinks = edgeList.map((e) => {
    const sel = selectedEdge.value && selectedEdge.value.id === e.id;
    return {
      id: e.id,
      source: String(e.sourceNodeId ?? e.source),
      target: String(e.targetNodeId ?? e.target),
      label: { show: !!e.label, formatter: e.label || e.relation },
      lineStyle: {
        color: sel ? "#409eff" : "#c0c4cc",
        width: sel ? 3 : 1.5,
        curveness: 0.1,
      },
      _meta: e,
    };
  });

  chart.setOption(
    {
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          if (p.dataType === "node") {
            const m = p.data._meta || {};
            return [
              `<b>${p.data.name}</b>`,
              `类型：${typeLabel(m.type)}`,
              `IP：${m.ip || "-"}`,
              `状态：${statusLabel(m.status)}`,
            ].join("<br/>");
          }
          const m = p.data._meta || {};
          return `${m.relation || ""}${m.label ? " · " + m.label : ""}`;
        },
      },
      series: [
        {
          type: "graph",
          layout: "none",
          roam: true,
          draggable: true,
          label: {
            show: true,
            position: "bottom",
            fontSize: 11,
            color: "#303133",
          },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 7,
          lineStyle: { curveness: 0.1 },
          emphasis: { focus: "adjacency" },
          data: chartNodes,
          links: chartLinks,
        },
      ],
    },
    true
  );
};

const onChartClick = (p) => {
  if (p.dataType === "node") {
    selectedEdge.value = null;
    selectedNode.value = p.data?._meta || null;
    renderChart();
    openDrawer(selectedNode.value);
  } else if (p.dataType === "edge") {
    selectedNode.value = null;
    selectedEdge.value = p.data?._meta || null;
    renderChart();
  }
};

// ===== 视图对话框 =====
const viewDialog = reactive({
  visible: false,
  mode: "create",
  name: "",
  remark: "",
  layoutMode: "manual",
  saving: false,
});

const openCreateView = () => {
  viewDialog.mode = "create";
  viewDialog.name = "";
  viewDialog.remark = "";
  viewDialog.layoutMode = "manual";
  viewDialog.visible = true;
};

const openRenameView = () => {
  viewDialog.mode = "edit";
  viewDialog.name = currentView.value.name || "";
  viewDialog.remark = currentView.value.remark || "";
  viewDialog.layoutMode = currentView.value.layoutMode || "manual";
  viewDialog.visible = true;
};

const submitView = async () => {
  if (!viewDialog.name.trim()) {
    ElMessage.warning("请输入视图名称");
    return;
  }
  viewDialog.saving = true;
  try {
    if (viewDialog.mode === "create") {
      const res = await createTopoView({
        name: viewDialog.name.trim(),
        remark: viewDialog.remark,
        layoutMode: viewDialog.layoutMode,
      });
      const created = res?.content;
      if (created?.id) currentViewId.value = created.id;
      ElMessage.success("视图已创建");
    } else {
      await updateTopoView({
        viewId: currentViewId.value,
        name: viewDialog.name.trim(),
        remark: viewDialog.remark,
        layoutMode: viewDialog.layoutMode,
      });
      ElMessage.success("视图已更新");
    }
    viewDialog.visible = false;
    await loadViews();
  } catch (e) {
    /* error toasted by request */
  } finally {
    viewDialog.saving = false;
  }
};

const handleDeleteView = async () => {
  if (!currentViewId.value) return;
  try {
    await ElMessageBox.confirm(
      `确认删除视图「${currentView.value.name}」？该操作将级联删除其节点与连线。`,
      "删除视图",
      { type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await deleteTopoView(currentViewId.value);
    ElMessage.success("视图已删除");
    currentViewId.value = null;
    await loadViews();
  } catch (e) {
    /* toasted */
  }
};

// ===== 设备节点对话框 =====
const devices = ref([]);
const deviceDialog = reactive({
  visible: false,
  type: "SERVER",
  deviceId: null,
  loading: false,
  saving: false,
});

const loadDevices = async () => {
  deviceDialog.loading = true;
  deviceDialog.deviceId = null;
  try {
    const res = await listDevices(deviceDialog.type);
    devices.value = res?.content || [];
  } catch (e) {
    devices.value = [];
  } finally {
    deviceDialog.loading = false;
  }
};

const openAddDeviceNode = () => {
  deviceDialog.visible = true;
  deviceDialog.deviceId = null;
  loadDevices();
};

// 默认放置坐标：错落排布，避免堆叠
const defaultPosition = () => {
  const n = nodes.value.length;
  return { x: (n % 5) * 160 + 80, y: Math.floor(n / 5) * 160 + 80 };
};

const submitDeviceNode = async () => {
  const dev = devices.value.find((d) => d.id === deviceDialog.deviceId);
  if (!dev) return;
  deviceDialog.saving = true;
  const pos = defaultPosition();
  try {
    await createTopoNode({
      viewId: currentViewId.value,
      deviceId: dev.id,
      name: dev.name,
      type: dev.type,
      icon: dev.type,
      x: pos.x,
      y: pos.y,
    });
    ElMessage.success("节点已添加");
    deviceDialog.visible = false;
    await reloadGraph();
  } catch (e) {
    /* toasted */
  } finally {
    deviceDialog.saving = false;
  }
};

// ===== 虚拟节点 =====
const openAddVirtualNode = async () => {
  let name;
  try {
    const r = await ElMessageBox.prompt("请输入虚拟节点名称", "添加虚拟节点", {
      inputPattern: /\S+/,
      inputErrorMessage: "名称不能为空",
    });
    name = r.value;
  } catch {
    return;
  }
  const pos = defaultPosition();
  try {
    await createTopoNode({
      viewId: currentViewId.value,
      deviceId: null,
      name: name.trim(),
      type: "VIRTUAL",
      icon: "VIRTUAL",
      x: pos.x,
      y: pos.y,
    });
    ElMessage.success("虚拟节点已添加");
    await reloadGraph();
  } catch (e) {
    /* toasted */
  }
};

// ===== 连线对话框 =====
const edgeDialog = reactive({
  visible: false,
  sourceNodeId: null,
  targetNodeId: null,
  relation: "depends",
  label: "",
  saving: false,
});

const openAddEdge = () => {
  edgeDialog.sourceNodeId = null;
  edgeDialog.targetNodeId = null;
  edgeDialog.relation = "depends";
  edgeDialog.label = "";
  edgeDialog.visible = true;
};

const submitEdge = async () => {
  if (!edgeDialog.sourceNodeId || !edgeDialog.targetNodeId) {
    ElMessage.warning("请选择源节点与目标节点");
    return;
  }
  if (edgeDialog.sourceNodeId === edgeDialog.targetNodeId) {
    ElMessage.warning("源节点与目标节点不能相同");
    return;
  }
  edgeDialog.saving = true;
  try {
    await createTopoEdge({
      viewId: currentViewId.value,
      sourceNodeId: edgeDialog.sourceNodeId,
      targetNodeId: edgeDialog.targetNodeId,
      relation: edgeDialog.relation,
      label: edgeDialog.label,
    });
    ElMessage.success("连线已添加");
    edgeDialog.visible = false;
    await reloadGraph();
  } catch (e) {
    /* toasted */
  } finally {
    edgeDialog.saving = false;
  }
};

// ===== 保存布局：读取 ECharts 拖拽后坐标 =====
const saveLayout = async () => {
  if (!chart || !currentViewId.value) return;
  const opt = chart.getOption();
  const data = opt?.series?.[0]?.data || [];
  const tasks = [];
  data.forEach((d) => {
    const id = Number(d.id);
    const orig = nodes.value.find((n) => n.id === id);
    if (!orig) return;
    const nx = Math.round(d.x);
    const ny = Math.round(d.y);
    if (nx !== Math.round(orig.x ?? 0) || ny !== Math.round(orig.y ?? 0)) {
      tasks.push(updateTopoNode({ nodeId: id, x: nx, y: ny }));
    }
  });
  if (!tasks.length) {
    ElMessage.info("布局无变化");
    return;
  }
  try {
    await Promise.all(tasks);
    ElMessage.success(`已保存 ${tasks.length} 个节点位置`);
    await reloadGraph();
  } catch (e) {
    /* toasted */
  }
};

// ===== 删除选中 =====
const deleteSelected = async () => {
  if (selectedNode.value) {
    const node = selectedNode.value;
    try {
      await ElMessageBox.confirm(
        `确认删除节点「${node.name}」？相关连线也会被移除。`,
        "删除节点",
        { type: "warning" }
      );
    } catch {
      return;
    }
    try {
      await deleteTopoNode(node.id);
      ElMessage.success("节点已删除");
      selectedNode.value = null;
      await reloadGraph();
    } catch (e) {
      /* toasted */
    }
  } else if (selectedEdge.value) {
    const edge = selectedEdge.value;
    try {
      await ElMessageBox.confirm("确认删除该连线？", "删除连线", {
        type: "warning",
      });
    } catch {
      return;
    }
    try {
      await deleteTopoEdge(edge.id);
      ElMessage.success("连线已删除");
      selectedEdge.value = null;
      await reloadGraph();
    } catch (e) {
      /* toasted */
    }
  }
};

// ===== 节点详情抽屉 =====
const drawer = reactive({ visible: false, loading: false, data: null });
const metricEntries = computed(() => {
  const m = drawer.data?.metrics || {};
  return Object.keys(m).map((k) => ({ key: k, value: formatMetric(m[k]) }));
});
const formatMetric = (v) => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

const openDrawer = async (node) => {
  drawer.visible = true;
  drawer.data = node ? { ...node, metrics: {}, alerts: [] } : null;
  if (!node?.deviceId) {
    drawer.loading = false;
    return;
  }
  drawer.loading = true;
  try {
    const res = await getTopoNodeMetrics(node.deviceId);
    drawer.data = res?.content || drawer.data;
  } catch (e) {
    /* keep base node info */
  } finally {
    drawer.loading = false;
  }
};

// ===== 生命周期 =====
onMounted(() => {
  loadViews();
});

onBeforeUnmount(() => {
  if (chart) {
    chart.off("click", onChartClick);
    chart.dispose();
    chart = null;
  }
});
</script>

<style lang="less" scoped>
.page-container {
  padding: 16px;
}
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.toolbar {
  &__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  &__label {
    font-size: 13px;
    color: #606266;
  }
}
.edit-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.topo-chart {
  height: 560px;
  width: 100%;
}

.drawer-body {
  padding: 4px 4px 24px;
}
.drawer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
  padding: 6px 0;

  &__label {
    width: 48px;
    color: #909399;
  }
}
.drawer-section {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f0f2f5;
}
.metric-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 6px 10px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;

  &__key {
    color: #909399;
  }
  &__val {
    color: #303133;
    font-weight: 600;
  }
}
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #606266;

  &__msg {
    flex: 1;
  }
}
</style>
