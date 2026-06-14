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
          type="primary"
          plain
          :icon="DocumentChecked"
          :disabled="!currentViewId"
          @click="saveTopoGraphAll"
          >保存整图</el-button
        >
        <el-button
          type="danger"
          plain
          :icon="Delete"
          :disabled="!selectedNode && !selectedEdge"
          @click="deleteSelected"
          >删除选中</el-button
        >
        <el-button
          :icon="Download"
          :disabled="!currentViewId"
          @click="exportJson"
          >导出JSON</el-button
        >
        <el-button :icon="Upload" :loading="importing" @click="triggerImport"
          >导入JSON</el-button
        >
        <input
          ref="importInputRef"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="handleImportFile"
        />
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
  DocumentChecked,
  Download,
  Upload,
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
  saveTopoGraph,
} from "@/api/monitor-topology";
import { listDevices } from "@/api/monitor-device";
import { nodeSymbol } from "@/utils/topo-symbols";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import { useChartSkin } from "@/composables/useChartSkin";

applyChartTheme(echarts);

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
    chart = echarts.init(chartRef.value, currentChartTheme());
    chart.on("click", onChartClick);
  }

  const nodeList = nodes.value;
  const edgeList = g.value.edges || [];

  const chartNodes = nodeList.map((n, idx) => {
    const isVirtual = n.type === "VIRTUAL" || n.type === "INTERNET";
    const color = isVirtual ? "#909399" : STATUS_COLOR[n.status] || "#67c23a";
    const selected = selectedNode.value && selectedNode.value.id === n.id;
    return {
      id: String(n.id),
      name: n.name,
      x: n.x ?? (idx % 5) * 160 + 80,
      y: n.y ?? Math.floor(idx / 5) * 160 + 80,
      symbol: nodeSymbol(n.type, color),
      // 选中节点放大以突出（image 符号无法用 border 高亮）
      symbolSize: selected ? 54 : 40,
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

// 皮肤切换：销毁并以新主题重建画布（点击事件会在 renderChart 内重新绑定）
const rerenderChart = () => {
  if (chart) {
    chart.off("click", onChartClick);
    chart.dispose();
    chart = null;
  }
  renderChart();
};
useChartSkin(rerenderChart);

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

// ===== 保存整图：一次性持久化全部节点与连线（含拖拽坐标） =====
const saveTopoGraphAll = async () => {
  if (!currentViewId.value) return;
  // 读取画布当前拖拽后的坐标
  const data = chart?.getOption()?.series?.[0]?.data || [];
  const posMap = {};
  data.forEach((d) => {
    posMap[String(d.id)] = {
      x: Math.round(d.x ?? 0),
      y: Math.round(d.y ?? 0),
    };
  });

  const payloadNodes = nodes.value.map((n) => {
    const pos = posMap[String(n.id)] || {};
    return {
      id: n.id,
      deviceId: n.deviceId ?? null,
      name: n.name,
      type: n.type,
      icon: n.icon ?? n.type,
      x: pos.x ?? Math.round(n.x ?? 0),
      y: pos.y ?? Math.round(n.y ?? 0),
    };
  });

  const payloadEdges = (g.value.edges || []).map((e) => ({
    id: e.id,
    sourceNodeId: e.sourceNodeId ?? e.source,
    targetNodeId: e.targetNodeId ?? e.target,
    relation: e.relation,
    label: e.label,
  }));

  try {
    await saveTopoGraph(currentViewId.value, payloadNodes, payloadEdges);
    ElMessage.success("整图已保存");
    await reloadGraph();
  } catch (e) {
    /* toasted */
  }
};

// ===== 导出 / 导入 JSON =====
const importInputRef = ref(null);
const importing = ref(false);

// 导出当前视图为 JSON（不含服务端 id，连线以节点数组下标 sourceIndex/targetIndex 关联）
const exportJson = () => {
  if (!currentViewId.value) return;
  const nodeList = nodes.value || [];
  const edgeList = g.value.edges || [];

  // 读取画布当前拖拽后坐标（若有）
  const data = chart?.getOption()?.series?.[0]?.data || [];
  const posMap = {};
  data.forEach((d) => {
    posMap[String(d.id)] = { x: Math.round(d.x ?? 0), y: Math.round(d.y ?? 0) };
  });

  // 建立 节点服务端id -> 数组下标 的映射，供连线关联
  const idToIndex = {};
  nodeList.forEach((n, i) => {
    idToIndex[String(n.id)] = i;
  });

  const exportNodes = nodeList.map((n, i) => {
    const pos = posMap[String(n.id)] || {};
    return {
      index: i,
      deviceId: n.deviceId ?? null,
      name: n.name ?? "",
      type: n.type ?? "VIRTUAL",
      icon: n.icon ?? n.type ?? "VIRTUAL",
      x: pos.x ?? Math.round(n.x ?? 0),
      y: pos.y ?? Math.round(n.y ?? 0),
    };
  });

  const exportEdges = edgeList
    .map((e) => {
      const si = idToIndex[String(e.sourceNodeId ?? e.source)];
      const ti = idToIndex[String(e.targetNodeId ?? e.target)];
      if (si === undefined || ti === undefined) return null;
      return {
        sourceIndex: si,
        targetIndex: ti,
        relation: e.relation ?? "custom",
        label: e.label ?? "",
      };
    })
    .filter(Boolean);

  const viewName = currentView.value.name || "topology";
  const payload = {
    name: viewName,
    remark: currentView.value.remark || "",
    layoutMode: currentView.value.layoutMode || "manual",
    nodes: exportNodes,
    edges: exportEdges,
  };

  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topology-${viewName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success("已导出 JSON");
  } catch (e) {
    ElMessage.error("导出失败");
  }
};

const triggerImport = () => {
  if (importInputRef.value) {
    importInputRef.value.value = "";
    importInputRef.value.click();
  }
};

const handleImportFile = (evt) => {
  const file = evt?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    let json;
    try {
      json = JSON.parse(String(e.target?.result || ""));
    } catch (err) {
      ElMessage.error("JSON 解析失败，文件格式不正确");
      return;
    }
    await importGraph(json);
  };
  reader.onerror = () => ElMessage.error("文件读取失败");
  reader.readAsText(file);
};

const importGraph = async (json) => {
  // 校验 JSON 形态
  if (
    !json ||
    typeof json !== "object" ||
    !Array.isArray(json.nodes) ||
    !Array.isArray(json.edges)
  ) {
    ElMessage.error("JSON 结构非法：缺少 nodes / edges");
    return;
  }
  importing.value = true;
  try {
    // 1) 新建视图
    const viewRes = await createTopoView({
      name: `${json.name || "导入视图"}(导入)`,
      remark: json.remark || "",
      layoutMode: json.layoutMode || "manual",
    });
    const newViewId = viewRes?.content?.id;
    if (!newViewId) {
      ElMessage.error("导入失败：创建视图未返回 id");
      return;
    }

    // 2) 逐个创建节点，记录 导入下标 -> 新节点id
    const indexToNewId = {};
    for (let i = 0; i < json.nodes.length; i++) {
      const n = json.nodes[i] || {};
      const key = n.index ?? i; // 优先用导出时的 index，回退到数组位置
      try {
        const nodeRes = await createTopoNode({
          viewId: newViewId,
          deviceId: n.deviceId ?? null,
          name: n.name ?? `节点${i + 1}`,
          type: n.type ?? "VIRTUAL",
          icon: n.icon ?? n.type ?? "VIRTUAL",
          x: Math.round(n.x ?? 0),
          y: Math.round(n.y ?? 0),
        });
        const newId = nodeRes?.content?.id;
        if (newId !== undefined && newId !== null) {
          indexToNewId[String(key)] = newId;
        }
      } catch (err) {
        /* 单节点失败不阻断整体导入 */
      }
    }

    // 3) 创建连线，按 sourceIndex/targetIndex 解析为新节点 id
    let edgeOk = 0;
    for (const ed of json.edges) {
      if (!ed) continue;
      const sId = indexToNewId[String(ed.sourceIndex)];
      const tId = indexToNewId[String(ed.targetIndex)];
      if (sId === undefined || tId === undefined) continue;
      try {
        await createTopoEdge({
          viewId: newViewId,
          sourceNodeId: sId,
          targetNodeId: tId,
          relation: ed.relation ?? "custom",
          label: ed.label ?? "",
        });
        edgeOk++;
      } catch (err) {
        /* 单连线失败不阻断 */
      }
    }

    // 4) 刷新视图列表，选中新视图并重载
    currentViewId.value = newViewId;
    await loadViews();
    ElMessage.success(
      `导入成功：${Object.keys(indexToNewId).length} 个节点，${edgeOk} 条连线`
    );
  } catch (e) {
    ElMessage.error("导入失败");
  } finally {
    importing.value = false;
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
@import (reference) "@/styles/variables.less";

.page-container {
  padding: @space-lg;
}
.stat-row {
  margin-bottom: @space-xs;
}
.stat-row .el-col {
  margin-bottom: @space-md;
}
.toolbar {
  &__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: @space-sm;
  }
  &__label {
    font-size: 13px;
    color: var(--cm-text-regular);
  }
}
.edit-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: @space-sm;
  margin-bottom: @space-md;
}
.topo-chart {
  height: 560px;
  width: 100%;
}

.drawer-body {
  padding: @space-xs @space-xs @space-xl;
}
.drawer-row {
  display: flex;
  align-items: center;
  gap: @space-md;
  font-size: 13px;
  color: var(--cm-text-regular);
  padding: 6px 0;

  &__label {
    width: 48px;
    color: var(--cm-text-secondary);
  }
}
.drawer-section {
  font-size: 13px;
  font-weight: 600;
  color: var(--cm-text-primary);
  margin: @space-lg 0 @space-sm;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--cm-bg-page);
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
  background: var(--cm-bg-muted);
  border: 1px solid var(--cm-border-light);
  border-radius: @radius-base;

  &__key {
    color: var(--cm-text-secondary);
  }
  &__val {
    color: var(--cm-text-primary);
    font-weight: 600;
  }
}
.alert-list {
  display: flex;
  flex-direction: column;
  gap: @space-sm;
}
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: @space-sm;
  font-size: 13px;
  color: var(--cm-text-regular);

  &__msg {
    flex: 1;
  }
}
</style>
