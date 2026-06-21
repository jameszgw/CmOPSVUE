<template>
  <ScreenPage v-loading="loading" title="安全漏洞" gap="8px" class="vuln-page">
    <template #header-extra>
      <div class="ctrl-row">
        <el-button type="primary" size="small" :icon="Aim" :loading="scanning" @click="onScan">
          立即扫描
        </el-button>
        <el-button :icon="Refresh" size="small" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <!-- 顶部统计卡 -->
    <CardGrid min="180px" gap="8px" class="row-stats">
      <StatCard dense icon="Warning" label="待处置" :value="num(stats.openTotal)" color="#409eff" />
      <StatCard dense icon="CircleCloseFilled" label="严重" :value="num(stats.critical)" color="#f56c6c" />
      <StatCard dense icon="WarningFilled" label="高危" :value="num(stats.high)" color="#e6a23c" />
      <StatCard dense icon="InfoFilled" label="中危" :value="num(stats.medium)" color="#909399" />
      <StatCard dense icon="InfoFilled" label="低危" :value="num(stats.low)" color="#67c23a" />
    </CardGrid>

    <!-- 分类统计 -->
    <div v-if="hasByCategory" class="cat-row">
      <span class="cat-label">分类：</span>
      <el-tag v-for="c in catList" :key="c.key" size="small" type="info" effect="plain" class="cat-tag">
        {{ c.label }} {{ num(byCategory[c.key]) }}
      </el-tag>
    </div>

    <!-- 漏洞清单 -->
    <SectionCard dense scrollable bodyClass="dense-table fill" class="fill"
      title="漏洞清单" icon="Warning">
      <template #extra>
        <div class="filter-row">
          <el-select v-model="filter.severity" size="small" style="width: 110px">
            <el-option label="全部级别" value="" />
            <el-option label="严重" value="critical" />
            <el-option label="高危" value="high" />
            <el-option label="中危" value="medium" />
            <el-option label="低危" value="low" />
          </el-select>
          <el-select v-model="filter.category" size="small" style="width: 120px">
            <el-option label="全部类别" value="" />
            <el-option label="CVE" value="CVE" />
            <el-option label="端口" value="PORT" />
            <el-option label="凭证" value="CREDENTIAL" />
            <el-option label="基线" value="BASELINE" />
            <el-option label="TLS" value="TLS" />
          </el-select>
          <el-select v-model="filter.status" size="small" style="width: 110px">
            <el-option label="待处置" value="open" />
            <el-option label="已处置" value="resolved" />
          </el-select>
          <el-button type="primary" size="small" @click="load">查询</el-button>
          <span class="total-tag">共 {{ total }} 条</span>
        </div>
      </template>
      <el-table class="dense-table" height="100%" :data="findings" size="small" stripe>
        <el-table-column label="级别" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="severityType(row.severity)" effect="dark">
              {{ row.severityText || severityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="类别" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">
              {{ row.categoryText || row.category || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.deviceName || "-" }}</template>
        </el-table-column>
        <el-table-column prop="title" label="问题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="reference" label="引用" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.reference || "-" }}</template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="recommendation" label="建议" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'open'" link type="primary" size="small"
              @click="onResolve(row)">标记处置</el-button>
            <span v-else class="muted">已处置</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无漏洞记录" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>

    <!-- CVE 登记表 -->
    <SectionCard dense scrollable bodyClass="dense-table" class="cve-card"
      title="CVE登记表" icon="Tickets">
      <template #extra>
        <el-button link type="primary" size="small" @click="toggleCve">
          {{ cveVisible ? "收起" : "展开" }}（{{ cveRegistry.length }}）
        </el-button>
      </template>
      <el-table v-if="cveVisible" class="dense-table" :data="cveRegistry" size="small" stripe>
        <el-table-column prop="product" label="组件" min-width="120" show-overflow-tooltip />
        <el-table-column prop="cveId" label="CVE编号" width="160" show-overflow-tooltip />
        <el-table-column label="级别" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="severityType(row.severity)" effect="dark">
              {{ severityText(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="fixedVersion" label="修复版本" width="130" show-overflow-tooltip />
        <el-table-column prop="title" label="说明" min-width="180" show-overflow-tooltip />
        <el-table-column prop="recommendation" label="建议" min-width="180" show-overflow-tooltip />
        <template #empty>
          <el-empty description="暂无 CVE 登记" :image-size="60" />
        </template>
      </el-table>
    </SectionCard>
  </ScreenPage>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh, Aim } from "@element-plus/icons-vue";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getVulnStats,
  getVulnFindings,
  scanVuln,
  resolveVuln,
  getCveRegistry,
} from "@/api/monitor-ops";

const CATEGORIES = [
  { key: "CVE", label: "CVE" },
  { key: "PORT", label: "端口" },
  { key: "CREDENTIAL", label: "凭证" },
  { key: "BASELINE", label: "基线" },
  { key: "TLS", label: "TLS" },
];

const loading = ref(false);
const scanning = ref(false);
const stats = ref({});
const findingsData = ref({});
const cveRegistry = ref([]);
const cveVisible = ref(false);

const filter = reactive({
  severity: "",
  category: "",
  status: "open",
});

const findings = computed(() => findingsData.value.findings || []);
const total = computed(() => findingsData.value.total ?? findings.value.length);
const byCategory = computed(() => stats.value.byCategory || {});
const catList = CATEGORIES;
const hasByCategory = computed(() =>
  CATEGORIES.some((c) => byCategory.value[c.key] !== undefined)
);

const num = (v) => (v === undefined || v === null || v === "" ? 0 : v);

const severityType = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "critical") return "danger";
  if (k === "high") return "warning";
  if (k === "medium") return "warning";
  return "info";
};
const severityText = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "critical") return "严重";
  if (k === "high") return "高危";
  if (k === "medium") return "中危";
  if (k === "low") return "低危";
  return s || "-";
};

const load = async () => {
  loading.value = true;
  try {
    const [statRes, findRes] = await Promise.all([
      getVulnStats(),
      getVulnFindings({
        severity: filter.severity,
        category: filter.category,
        status: filter.status,
        limit: 200,
      }),
    ]);
    stats.value = statRes.content || {};
    findingsData.value = findRes.content || {};
  } finally {
    loading.value = false;
  }
};

const loadCve = async () => {
  try {
    const res = await getCveRegistry();
    cveRegistry.value = res.content || [];
  } catch (e) {
    // 静默
  }
};

const toggleCve = () => {
  cveVisible.value = !cveVisible.value;
  if (cveVisible.value && cveRegistry.value.length === 0) {
    loadCve();
  }
};

const onScan = async () => {
  scanning.value = true;
  try {
    const res = await scanVuln();
    const c = res.content || {};
    ElMessage.success(
      `扫描完成：共 ${num(c.scannedDevices)} 台设备，新增高危/严重 ${num(c.newHighCritical)} 项`
    );
    await load();
  } catch (e) {
    ElMessage.error("扫描失败");
  } finally {
    scanning.value = false;
  }
};

const onResolve = (row) => {
  ElMessageBox.confirm(`确认将「${row.title}」标记为已处置？`, "提示", {
    type: "warning",
    confirmButtonText: "标记处置",
    cancelButtonText: "取消",
  })
    .then(async () => {
      await resolveVuln(row.id);
      ElMessage.success("已标记处置");
      load();
    })
    .catch(() => {});
};

onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.row-stats {
  flex-shrink: 0;
}
.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.cat-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: @space-xs;
  flex-shrink: 0;
}
.cat-label {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.filter-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.total-tag {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.muted {
  font-size: 12px;
  color: var(--cm-text-secondary);
}
.cve-card {
  flex-shrink: 0;
}
</style>
