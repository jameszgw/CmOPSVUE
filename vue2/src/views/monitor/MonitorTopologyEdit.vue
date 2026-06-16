<template>
  <div class="page-container">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-share" label="节点总数" :value="nodeTotal" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-circle-check" label="健康" :value="healthy" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-warning-outline" label="警告" :value="warning" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-circle-close" label="严重" :value="critical" color="#f56c6c" />
      </el-col>
    </el-row>

    <SectionCard title="拓扑维护" icon="el-icon-edit-outline">
      <template #extra>{{ selectedTip }}</template>

      <div class="toolbar">
        <div class="toolbar__group">
          <span class="toolbar__label">视图</span>
          <el-select
            v-model="currentViewId"
            placeholder="请选择视图"
            size="small"
            style="width: 200px"
            @change="onViewChange"
          >
            <el-option
              v-for="v in views"
              :key="v.id"
              :label="v.name"
              :value="v.id"
            />
          </el-select>
          <el-button size="small" icon="el-icon-plus" @click="onCreateView">新建视图</el-button>
          <el-button size="small" icon="el-icon-edit" :disabled="!currentViewId" @click="onRenameView">
            重命名
          </el-button>
          <el-button
            size="small"
            type="danger"
            icon="el-icon-delete"
            :disabled="!currentViewId"
            @click="onDeleteView"
          >
            删除视图
          </el-button>
          <el-button size="small" icon="el-icon-refresh" :disabled="!currentViewId" @click="loadGraph">
            刷新
          </el-button>
          <el-button
            size="small"
            icon="el-icon-download"
            :disabled="!currentViewId"
            @click="onExportJson"
          >
            导出JSON
          </el-button>
          <el-button size="small" icon="el-icon-upload2" @click="onImportJsonClick">
            导入JSON
          </el-button>
          <input
            ref="importInput"
            type="file"
            accept=".json,application/json"
            style="display: none"
            @change="onImportJsonChange"
          />
        </div>
      </div>

      <div class="toolbar">
        <div class="toolbar__group">
          <el-button
            size="small"
            type="primary"
            icon="el-icon-cpu"
            :disabled="!currentViewId"
            @click="openDevicePicker"
          >
            从设备添加节点
          </el-button>
          <el-button
            size="small"
            icon="el-icon-circle-plus-outline"
            :disabled="!currentViewId"
            @click="onAddVirtualNode"
          >
            添加虚拟节点
          </el-button>
          <el-button
            size="small"
            icon="el-icon-connection"
            :disabled="!currentViewId || nodeOptions.length < 2"
            @click="openEdgeDialog"
          >
            添加连线
          </el-button>
          <el-button
            size="small"
            icon="el-icon-s-grid"
            :disabled="!currentViewId || !nodeTotal"
            @click="onAutoLayout"
          >
            自动布局
          </el-button>
          <el-button
            size="small"
            type="success"
            icon="el-icon-finished"
            :disabled="!currentViewId"
            @click="onSaveLayout"
          >
            保存布局
          </el-button>
          <el-button
            size="small"
            type="success"
            icon="el-icon-document-checked"
            :disabled="!currentViewId"
            @click="onSaveGraph"
          >
            保存整图
          </el-button>
          <el-button
            size="small"
            type="danger"
            icon="el-icon-delete"
            :disabled="!hasSelection"
            @click="onDeleteSelected"
          >
            删除选中
          </el-button>
        </div>
      </div>

      <el-empty v-if="!currentViewId" description="请先选择或新建一个拓扑视图" />
      <div v-show="currentViewId" ref="graphRef" class="graph-chart"></div>
    </SectionCard>

    <!-- 设备选择对话框 -->
    <el-dialog title="从设备添加节点" :visible.sync="deviceDialogVisible" width="640px" append-to-body>
      <el-form inline @submit.native.prevent>
        <el-form-item label="设备类型">
          <el-select v-model="deviceFilterType" placeholder="全部类型" clearable size="small" @change="loadDevices">
            <el-option v-for="t in deviceTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-table
        :data="devices"
        height="320"
        size="small"
        @row-dblclick="addNodeFromDevice"
      >
        <el-table-column prop="name" label="设备名称" />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ typeLabel(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="150" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="text" @click="addNodeFromDevice(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="deviceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 添加连线对话框 -->
    <el-dialog title="添加连线" :visible.sync="edgeDialogVisible" width="480px" append-to-body>
      <el-form :model="edgeForm" label-width="90px">
        <el-form-item label="源节点">
          <el-select v-model="edgeForm.sourceNodeId" placeholder="请选择源节点" style="width: 100%">
            <el-option v-for="n in nodeOptions" :key="n.id" :label="n.name" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标节点">
          <el-select v-model="edgeForm.targetNodeId" placeholder="请选择目标节点" style="width: 100%">
            <el-option v-for="n in nodeOptions" :key="n.id" :label="n.name" :value="n.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关系">
          <el-select v-model="edgeForm.relation" placeholder="请选择关系" style="width: 100%">
            <el-option v-for="r in relationOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="edgeForm.label" placeholder="可选，连线说明文字" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="edgeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onCreateEdge">确定</el-button>
      </template>
    </el-dialog>

    <!-- 节点详情抽屉 -->
    <el-drawer
      :title="nodeDetail.name || '节点详情'"
      :visible.sync="drawerVisible"
      size="380px"
      append-to-body
    >
      <div class="node-detail" v-loading="detailLoading">
        <div class="node-detail__row">
          <span class="node-detail__label">状态</span>
          <el-tag :type="statusTagType(nodeDetail.status)" effect="dark" size="small">
            {{ statusLabel(nodeDetail.status) }}
          </el-tag>
        </div>
        <div class="node-detail__row">
          <span class="node-detail__label">类型</span>
          <span>{{ typeLabel(nodeDetail.type) }}</span>
        </div>
        <div class="node-detail__row">
          <span class="node-detail__label">IP</span>
          <span>{{ nodeDetail.ip || "-" }}</span>
        </div>
        <div v-if="nodeDetail.source" class="node-detail__row">
          <span class="node-detail__label">来源</span>
          <el-tag :type="['agent','ssh','snmp'].includes(nodeDetail.source) ? 'success' : 'info'" size="mini">
            {{ {agent:'真实采集·Agent',ssh:'真实采集·SSH',snmp:'真实采集·SNMP'}[nodeDetail.source] || '模拟数据' }}
          </el-tag>
        </div>

        <div class="node-detail__section">指标</div>
        <el-empty v-if="!metricEntries.length" description="暂无指标" :image-size="60" />
        <div v-else class="metric-list">
          <div v-for="m in metricEntries" :key="m.key" class="metric-item">
            <span class="metric-item__key">{{ m.key }}</span>
            <span class="metric-item__val">{{ m.value }}</span>
          </div>
        </div>

        <div class="node-detail__section">告警</div>
        <el-empty v-if="!nodeAlerts.length" description="无告警" :image-size="60" />
        <div v-else class="alert-list">
          <div v-for="(a, i) in nodeAlerts" :key="i" class="alert-item">
            <el-tag :type="statusTagType(a.level || a.severity)" size="mini" effect="plain">
              {{ a.level || a.severity || "告警" }}
            </el-tag>
            <span class="alert-item__msg">{{ a.message || a.msg || a.title || a }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { applyChartTheme, currentChartTheme } from "@/styles/chart-theme";
import chartSkin from "@/mixins/chartSkin";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { listDevices } from "@/api/monitor-device";
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
import { nodeSymbol } from "@/utils/topo-symbols";

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
};
const STATUS_LABEL = { healthy: "健康", warning: "警告", critical: "严重" };
const STATUS_COLOR = { healthy: "#67c23a", warning: "#e6a23c", critical: "#f56c6c" };
const STATUS_INDEX = { healthy: 0, warning: 1, critical: 2 };

export default {
  name: "MonitorTopologyEdit",
  mixins: [chartSkin],
  components: { StatCard, SectionCard },
  data() {
    return {
      views: [],
      currentViewId: null,
      graph: {},
      chart: null,
      loading: false,

      // 选中状态
      selectedNodeId: null,
      selectedEdgeId: null,

      // 设备选择
      deviceDialogVisible: false,
      deviceFilterType: "",
      devices: [],
      deviceTypes: [
        { value: "SERVER", label: "服务器" },
        { value: "REDIS", label: "Redis" },
        { value: "DATABASE", label: "数据库" },
        { value: "K8S", label: "容器" },
        { value: "MQ", label: "消息队列" },
        { value: "LB", label: "负载均衡" },
        { value: "STORAGE", label: "存储" },
        { value: "NETDEV", label: "网络设备" },
        { value: "GPU", label: "GPU" },
      ],

      // 连线
      edgeDialogVisible: false,
      edgeForm: { sourceNodeId: null, targetNodeId: null, relation: "depends", label: "" },
      relationOptions: [
        { value: "routes", label: "路由 (routes)" },
        { value: "depends", label: "依赖 (depends)" },
        { value: "stores", label: "存储 (stores)" },
        { value: "network", label: "网络 (network)" },
        { value: "custom", label: "自定义 (custom)" },
      ],

      // 节点详情抽屉
      drawerVisible: false,
      detailLoading: false,
      nodeDetail: {},
    };
  },
  computed: {
    nodeTotal() {
      return (this.graph.nodes && this.graph.nodes.length) || 0;
    },
    healthy() {
      return this.num(this.graph.healthy);
    },
    warning() {
      return this.num(this.graph.warning);
    },
    critical() {
      return this.num(this.graph.critical);
    },
    nodeOptions() {
      return this.graph.nodes || [];
    },
    hasSelection() {
      return !!(this.selectedNodeId || this.selectedEdgeId);
    },
    selectedTip() {
      if (this.selectedNodeId) {
        const n = this.findNode(this.selectedNodeId);
        return "已选中节点：" + ((n && n.name) || this.selectedNodeId);
      }
      if (this.selectedEdgeId) return "已选中连线";
      return "拖动节点后点击保存布局";
    },
    metricEntries() {
      const m = this.nodeDetail.metrics || {};
      return Object.keys(m).map((k) => ({ key: k, value: this.fmtVal(m[k]) }));
    },
    nodeAlerts() {
      return this.nodeDetail.alerts || [];
    },
  },
  mounted() {
    this.loadViews();
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },
  methods: {
    num(v) {
      return v === undefined || v === null ? 0 : v;
    },
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    statusLabel(s) {
      return STATUS_LABEL[s] || s || "-";
    },
    statusTagType(s) {
      if (s === "critical") return "danger";
      if (s === "warning") return "warning";
      if (s === "healthy") return "success";
      return "info";
    },
    fmtVal(v) {
      if (v === null || v === undefined) return "-";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    },
    findNode(id) {
      return (this.graph.nodes || []).find((n) => n.id === id);
    },

    // ===== 视图 =====
    async loadViews(keepId) {
      try {
        const res = await listTopoViews();
        this.views = (res && res.content) || [];
        const exists = this.views.some((v) => v.id === this.currentViewId);
        if (keepId && exists) {
          // keep current
        } else if (this.views.length) {
          this.currentViewId = this.views[0].id;
        } else {
          this.currentViewId = null;
          this.graph = {};
        }
        if (this.currentViewId) {
          await this.loadGraph();
        }
      } catch (e) {
        // request util already toasts
      }
    },
    onViewChange() {
      this.resetSelection();
      this.loadGraph();
    },
    onCreateView() {
      this.$prompt("请输入视图名称", "新建视图", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S+/,
        inputErrorMessage: "名称不能为空",
      })
        .then(async ({ value }) => {
          const res = await createTopoView({ name: value, remark: "", layoutMode: "manual" });
          this.$message.success("创建成功");
          const created = res && res.content;
          await this.loadViews(true);
          if (created && created.id) {
            this.currentViewId = created.id;
            await this.loadGraph();
          }
        })
        .catch(() => {});
    },
    onRenameView() {
      const cur = this.views.find((v) => v.id === this.currentViewId);
      if (!cur) return;
      this.$prompt("请输入新的视图名称", "重命名视图", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: cur.name,
        inputPattern: /\S+/,
        inputErrorMessage: "名称不能为空",
      })
        .then(async ({ value }) => {
          await updateTopoView({
            viewId: this.currentViewId,
            name: value,
            remark: cur.remark,
            layoutMode: cur.layoutMode,
          });
          this.$message.success("已更新");
          this.loadViews(true);
        })
        .catch(() => {});
    },
    onDeleteView() {
      if (!this.currentViewId) return;
      this.$confirm("确定要删除当前视图吗？该操作不可恢复。", "确认删除", {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          await deleteTopoView(this.currentViewId);
          this.$message.success("删除成功");
          this.currentViewId = null;
          this.resetSelection();
          this.loadViews();
        })
        .catch(() => {});
    },

    // ===== 导出 / 导入 JSON =====
    onExportJson() {
      if (!this.currentViewId) return;
      const cur = this.views.find((v) => v.id === this.currentViewId) || {};
      const viewName = cur.name || "topology";
      const graph = this.graph || {};
      const nodes = graph.nodes || [];
      // 节点 id → 数组下标，连线引用下标，便于导入时重新关联。
      const idToIndex = {};
      nodes.forEach((n, idx) => {
        if (n && n.id !== undefined && n.id !== null) idToIndex[n.id] = idx;
      });
      const payload = {
        name: viewName,
        remark: cur.remark || "",
        layoutMode: cur.layoutMode || "manual",
        nodes: nodes.map((n) => ({
          deviceId: n.deviceId === undefined ? null : n.deviceId,
          name: n.name || "",
          type: n.type || "",
          icon: n.icon || "",
          x: n.x === undefined || n.x === null ? 0 : n.x,
          y: n.y === undefined || n.y === null ? 0 : n.y,
        })),
        edges: (graph.edges || [])
          .map((e) => {
            const srcId = e.sourceNodeId !== undefined ? e.sourceNodeId : e.source;
            const tgtId = e.targetNodeId !== undefined ? e.targetNodeId : e.target;
            const sourceIndex = idToIndex[srcId];
            const targetIndex = idToIndex[tgtId];
            if (sourceIndex === undefined || targetIndex === undefined) return null;
            return {
              sourceIndex: sourceIndex,
              targetIndex: targetIndex,
              relation: e.relation || "",
              label: e.label || "",
            };
          })
          .filter((e) => e !== null),
      };
      try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "topology-" + viewName + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.$message.success("已导出 JSON");
      } catch (e) {
        this.$message.error("导出失败");
      }
    },
    onImportJsonClick() {
      if (this.$refs.importInput) {
        this.$refs.importInput.value = "";
        this.$refs.importInput.click();
      }
    },
    onImportJsonChange(evt) {
      const input = evt && evt.target;
      const file = input && input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        let json;
        try {
          json = JSON.parse(e.target.result);
        } catch (err) {
          this.$message.error("JSON 解析失败，文件格式不正确");
          return;
        }
        if (!json || typeof json !== "object" || !Array.isArray(json.nodes)) {
          this.$message.error("JSON 内容不合法：缺少 nodes 数组");
          return;
        }
        await this.importTopology(json);
      };
      reader.onerror = () => {
        this.$message.error("文件读取失败");
      };
      reader.readAsText(file);
    },
    async importTopology(json) {
      try {
        const baseName = json.name || "拓扑";
        const viewRes = await createTopoView({
          name: baseName + "(导入)",
          remark: json.remark || "",
          layoutMode: json.layoutMode || "manual",
        });
        const view = (viewRes && viewRes.content) || {};
        const newViewId = view.id;
        if (newViewId === undefined || newViewId === null) {
          this.$message.error("创建导入视图失败");
          return;
        }
        // 下标 → 新节点 id 映射
        const indexToNodeId = {};
        const nodes = json.nodes || [];
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i] || {};
          const nodeRes = await createTopoNode({
            viewId: newViewId,
            deviceId: n.deviceId === undefined ? null : n.deviceId,
            name: n.name || "",
            type: n.type || "VIRTUAL",
            icon: n.icon || "",
            x: n.x === undefined || n.x === null ? (i % 6) * 160 : n.x,
            y: n.y === undefined || n.y === null ? Math.floor(i / 6) * 140 : n.y,
          });
          const created = (nodeRes && nodeRes.content) || {};
          if (created.id !== undefined && created.id !== null) {
            indexToNodeId[i] = created.id;
          }
        }
        // 连线：通过下标映射解析源/目标节点 id
        const edges = Array.isArray(json.edges) ? json.edges : [];
        for (let j = 0; j < edges.length; j++) {
          const ed = edges[j] || {};
          const srcId = indexToNodeId[ed.sourceIndex];
          const tgtId = indexToNodeId[ed.targetIndex];
          if (srcId === undefined || tgtId === undefined) continue;
          await createTopoEdge({
            viewId: newViewId,
            sourceNodeId: srcId,
            targetNodeId: tgtId,
            relation: ed.relation || "",
            label: ed.label || "",
          });
        }
        await this.loadViews(true);
        this.currentViewId = newViewId;
        this.resetSelection();
        await this.loadGraph();
        this.$message.success("导入成功");
      } catch (e) {
        this.$message.error("导入失败");
      }
    },

    // ===== 图加载/渲染 =====
    async loadGraph() {
      if (!this.currentViewId) return;
      if (this.loading) return;
      this.loading = true;
      try {
        const res = await getTopoViewGraph(this.currentViewId);
        this.graph = (res && res.content) || {};
        await this.$nextTick();
        this.renderChart();
      } catch (e) {
        // toasted by request util
      } finally {
        this.loading = false;
      }
    },
    buildNodes() {
      const nodes = this.graph.nodes || [];
      return nodes.map((n, idx) => {
        const status = n.status || "healthy";
        const isVirtual = n.type === "VIRTUAL" || n.type === "INTERNET";
        const color = isVirtual ? "#909399" : STATUS_COLOR[status] || "#67c23a";
        const selected = this.selectedNodeId != null && n.id === this.selectedNodeId;
        return {
          id: n.id,
          name: n.name,
          x: n.x === undefined || n.x === null ? (idx % 6) * 160 : n.x,
          y: n.y === undefined || n.y === null ? Math.floor(idx / 6) * 140 : n.y,
          symbol: nodeSymbol(n.type, color),
          // 选中节点放大以突出（image 符号无法用 border 高亮）
          symbolSize: selected ? 36 : 26,
          category: STATUS_INDEX[status] === undefined ? 0 : STATUS_INDEX[status],
          label: { show: true },
          _raw: n,
        };
      });
    },
    buildLinks() {
      const edges = this.graph.edges || [];
      return edges.map((e) => ({
        source: e.sourceNodeId !== undefined ? e.sourceNodeId : e.source,
        target: e.targetNodeId !== undefined ? e.targetNodeId : e.target,
        _id: e.id,
        lineStyle: { color: "#909399", width: 1.6, curveness: 0.05 },
        label: { show: !!(e.label || e.relation), formatter: e.label || e.relation || "", fontSize: 10, color: "#909399" },
      }));
    },
    renderChart() {
      if (!this.$refs.graphRef) return;
      if (!this.chart) {
        applyChartTheme(echarts);
        this.chart = echarts.init(this.$refs.graphRef, currentChartTheme());
        this.chart.on("click", this.onChartClick);
      }
      const categories = [
        { name: STATUS_LABEL.healthy, itemStyle: { color: STATUS_COLOR.healthy } },
        { name: STATUS_LABEL.warning, itemStyle: { color: STATUS_COLOR.warning } },
        { name: STATUS_LABEL.critical, itemStyle: { color: STATUS_COLOR.critical } },
      ];
      this.chart.setOption(
        {
          tooltip: {
            trigger: "item",
            formatter: (p) => {
              if (p.dataType !== "node") return p.name || "";
              const n = (p.data && p.data._raw) || {};
              return (
                "<b>" + (n.name || "") + "</b><br/>" +
                "类型: " + this.typeLabel(n.type) + "<br/>" +
                "IP: " + (n.ip || "-") + "<br/>" +
                "状态: " + this.statusLabel(n.status)
              );
            },
          },
          legend: [
            { data: [STATUS_LABEL.healthy, STATUS_LABEL.warning, STATUS_LABEL.critical], top: 8 },
          ],
          series: [
            {
              type: "graph",
              layout: "none",
              roam: true,
              draggable: true,
              categories: categories,
              label: { show: true, position: "bottom", fontSize: 11, color: "#303133" },
              edgeLabel: { show: false },
              lineStyle: { color: "#909399", opacity: 0.7 },
              emphasis: { focus: "adjacency", lineStyle: { width: 3 } },
              data: this.buildNodes(),
              links: this.buildLinks(),
            },
          ],
        },
        true
      );
    },
    reinitChartsForSkin() {
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
      this.renderChart();
    },
    onChartClick(params) {
      if (params.dataType === "node") {
        const n = (params.data && params.data._raw) || {};
        this.selectedNodeId = params.data && params.data.id;
        this.selectedEdgeId = null;
        // 重新渲染以放大选中节点（image 符号无 border 高亮）
        this.renderChart();
        if (n.deviceId) {
          this.openNodeDetail(n);
        }
      } else if (params.dataType === "edge") {
        this.selectedEdgeId = (params.data && params.data._id) || null;
        this.selectedNodeId = null;
        if (this.selectedEdgeId) {
          this.$message.info("已选中连线，可点击「删除选中」删除");
        }
      }
    },
    resetSelection() {
      this.selectedNodeId = null;
      this.selectedEdgeId = null;
    },

    // ===== 节点详情下钻 =====
    async openNodeDetail(node) {
      this.drawerVisible = true;
      this.detailLoading = true;
      this.nodeDetail = { name: node.name, type: node.type, ip: node.ip, status: node.status };
      try {
        const res = await getTopoNodeMetrics(node.deviceId);
        this.nodeDetail = (res && res.content) || this.nodeDetail;
      } catch (e) {
        // toasted
      } finally {
        this.detailLoading = false;
      }
    },

    // ===== 设备 → 节点 =====
    openDevicePicker() {
      this.deviceFilterType = "";
      this.deviceDialogVisible = true;
      this.loadDevices();
    },
    async loadDevices() {
      try {
        const res = await listDevices(this.deviceFilterType || undefined);
        this.devices = (res && res.content) || [];
      } catch (e) {
        this.devices = [];
      }
    },
    async addNodeFromDevice(row) {
      if (!row || !this.currentViewId) return;
      const count = (this.graph.nodes && this.graph.nodes.length) || 0;
      try {
        await createTopoNode({
          viewId: this.currentViewId,
          deviceId: row.id,
          name: row.name,
          type: row.type,
          icon: "",
          x: (count % 6) * 160,
          y: Math.floor(count / 6) * 140,
        });
        this.$message.success("已添加节点");
        this.deviceDialogVisible = false;
        await this.loadGraph();
      } catch (e) {
        // toasted
      }
    },
    onAddVirtualNode() {
      if (!this.currentViewId) return;
      this.$prompt("请输入虚拟节点名称", "添加虚拟节点", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /\S+/,
        inputErrorMessage: "名称不能为空",
      })
        .then(async ({ value }) => {
          const count = (this.graph.nodes && this.graph.nodes.length) || 0;
          await createTopoNode({
            viewId: this.currentViewId,
            deviceId: null,
            name: value,
            type: "VIRTUAL",
            icon: "",
            x: (count % 6) * 160,
            y: Math.floor(count / 6) * 140,
          });
          this.$message.success("已添加虚拟节点");
          await this.loadGraph();
        })
        .catch(() => {});
    },

    // ===== 连线 =====
    openEdgeDialog() {
      this.edgeForm = { sourceNodeId: null, targetNodeId: null, relation: "depends", label: "" };
      this.edgeDialogVisible = true;
    },
    async onCreateEdge() {
      const f = this.edgeForm;
      if (!f.sourceNodeId || !f.targetNodeId) {
        this.$message.warning("请选择源节点和目标节点");
        return;
      }
      if (f.sourceNodeId === f.targetNodeId) {
        this.$message.warning("源节点与目标节点不能相同");
        return;
      }
      try {
        await createTopoEdge({
          viewId: this.currentViewId,
          sourceNodeId: f.sourceNodeId,
          targetNodeId: f.targetNodeId,
          relation: f.relation,
          label: f.label,
        });
        this.$message.success("已添加连线");
        this.edgeDialogVisible = false;
        await this.loadGraph();
      } catch (e) {
        // toasted
      }
    },

    // ===== 自动布局：将当前视图节点重排为网格 =====
    onAutoLayout() {
      const list = (this.graph && this.graph.nodes) || [];
      const n = list.length;
      if (!n) return;
      const cols = Math.max(4, Math.ceil(Math.sqrt(n) * 1.6));
      const dx = 160;
      const dy = 120;
      list.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        node.x = (col - (cols - 1) / 2) * dx;
        node.y = row * dy;
      });
      this.renderChart();
      this.$message.success("已重新布局，点「保存布局」可持久化");
    },

    // ===== 保存布局 =====
    async onSaveLayout() {
      if (!this.chart || !this.currentViewId) return;
      const opt = this.chart.getOption();
      const series = (opt.series && opt.series[0]) || {};
      const data = series.data || [];
      const tasks = [];
      data.forEach((d) => {
        if (d.id === undefined || d.id === null) return;
        if (d.x === undefined || d.y === undefined) return;
        tasks.push(
          updateTopoNode({ nodeId: d.id, x: Math.round(d.x), y: Math.round(d.y) })
        );
      });
      if (!tasks.length) {
        this.$message.info("没有可保存的节点位置");
        return;
      }
      try {
        await Promise.all(tasks);
        this.$message.success("布局已保存");
        await this.loadGraph();
      } catch (e) {
        // toasted
      }
    },

    // ===== 保存整图 =====
    async onSaveGraph() {
      if (!this.currentViewId) return;
      // 从画布读取当前坐标（包含拖拽后的位置）
      const posMap = {};
      if (this.chart) {
        const opt = this.chart.getOption();
        const series = (opt.series && opt.series[0]) || {};
        const data = series.data || [];
        data.forEach((d) => {
          if (d.id === undefined || d.id === null) return;
          posMap[d.id] = { x: d.x, y: d.y };
        });
      }
      const nodes = (this.graph.nodes || []).map((n) => {
        const pos = posMap[n.id] || {};
        const x = pos.x !== undefined && pos.x !== null ? Math.round(pos.x) : n.x;
        const y = pos.y !== undefined && pos.y !== null ? Math.round(pos.y) : n.y;
        return {
          id: n.id,
          deviceId: n.deviceId,
          name: n.name,
          type: n.type,
          icon: n.icon,
          x: x,
          y: y,
        };
      });
      const edges = (this.graph.edges || []).map((e) => ({
        id: e.id,
        sourceNodeId: e.sourceNodeId !== undefined ? e.sourceNodeId : e.source,
        targetNodeId: e.targetNodeId !== undefined ? e.targetNodeId : e.target,
        relation: e.relation,
        label: e.label,
      }));
      try {
        await saveTopoGraph(this.currentViewId, nodes, edges);
        this.$message.success("整图已保存");
        await this.loadGraph();
      } catch (e) {
        // toasted
      }
    },

    // ===== 删除选中 =====
    onDeleteSelected() {
      if (this.selectedNodeId) {
        const n = this.findNode(this.selectedNodeId);
        this.$confirm(
          "确定要删除节点「" + ((n && n.name) || "") + "」吗？相关连线也会被移除。",
          "确认删除",
          { confirmButtonText: "确认", cancelButtonText: "取消", type: "warning" }
        )
          .then(async () => {
            await deleteTopoNode(this.selectedNodeId);
            this.$message.success("已删除节点");
            this.resetSelection();
            await this.loadGraph();
          })
          .catch(() => {});
      } else if (this.selectedEdgeId) {
        this.$confirm("确定要删除选中的连线吗？", "确认删除", {
          confirmButtonText: "确认",
          cancelButtonText: "取消",
          type: "warning",
        })
          .then(async () => {
            await deleteTopoEdge(this.selectedEdgeId);
            this.$message.success("已删除连线");
            this.resetSelection();
            await this.loadGraph();
          })
          .catch(() => {});
      }
    },
  },
};
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
  margin-bottom: @space-md;

  &__group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: @space-sm;
  }

  &__label {
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
}
.graph-chart {
  height: 560px;
  width: 100%;
}
.node-detail {
  padding: @space-lg 20px;

  &__row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  &__label {
    width: 60px;
    font-size: 13px;
    color: var(--cm-text-secondary, @text-secondary);
  }

  &__section {
    margin: @space-lg 0 @space-sm;
    font-size: 14px;
    font-weight: 600;
    color: var(--cm-text-primary, @text-primary);
    border-top: 1px dashed var(--cm-border-light, @border-light);
    padding-top: @space-md;
  }
}
.metric-list {
  .metric-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    // 浅色保持原值 #f5f7fa；深色跟随边框
    border-bottom: 1px solid #f5f7fa;
    font-size: 13px;

    &__key {
      color: var(--cm-text-regular, @text-regular);
    }

    &__val {
      color: var(--cm-text-primary, @text-primary);
      font-weight: 500;
    }
  }
}
.alert-list {
  .alert-item {
    display: flex;
    align-items: flex-start;
    padding: 6px 0;
    font-size: 13px;

    &__msg {
      margin-left: @space-sm;
      color: var(--cm-text-regular, @text-regular);
      line-height: 1.4;
    }
  }
}

[data-theme="dark"] .metric-list .metric-item {
  border-bottom-color: var(--cm-border-light);
}
</style>
