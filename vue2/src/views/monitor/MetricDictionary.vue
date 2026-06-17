<template>
  <div class="page-container metric-dict-page">
    <div class="dict-header">
      <h2 class="dict-title">指标说明（指标字典）</h2>
      <p class="dict-note">
        指标字典：解释每个监控指标“是什么/怎么看/从哪来”，阈值为推荐值。
      </p>
    </div>

    <div class="dict-toolbar">
      <el-select
        v-model="activeType"
        size="small"
        clearable
        placeholder="全部设备类型"
        class="type-select"
        @change="applyFilter"
      >
        <el-option
          v-for="code in deviceTypes"
          :key="code"
          :label="typeLabel(code)"
          :value="code"
        />
      </el-select>
      <el-input
        v-model="keyword"
        size="small"
        clearable
        placeholder="搜索指标 / 键 / 含义"
        class="keyword-input"
        @input="applyFilter"
      />
      <span class="dict-count">共 {{ filteredList.length }} 项</span>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredList"
      size="small"
      border
      stripe
      class="dict-table"
    >
      <el-table-column
        prop="deviceType"
        label="类型"
        width="100"
      >
        <template slot-scope="{ row }">{{ typeLabel(row.deviceType) }}</template>
      </el-table-column>
      <el-table-column prop="label" label="指标" min-width="120" />
      <el-table-column prop="metricKey" label="键" min-width="140">
        <template slot-scope="{ row }">
          <span class="metric-key">{{ row.metricKey }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" width="80">
        <template slot-scope="{ row }">{{ row.unit || "-" }}</template>
      </el-table-column>
      <el-table-column prop="definition" label="含义" min-width="220" />
      <el-table-column prop="interpretation" label="解读" min-width="220" />
      <el-table-column label="推荐阈值" min-width="180">
        <template slot-scope="{ row }">{{ thresholdText(row) }}</template>
      </el-table-column>
      <el-table-column label="采集来源" width="110">
        <template slot-scope="{ row }">
          <el-tag
            size="mini"
            :type="sourceType(row.source)"
          >{{ row.source || "-" }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getMetricDeviceTypes, getMetricGlossary } from "@/api/monitor-metric";

const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息中间件",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
  POWER: "电能",
  ESS: "储能",
  IOT: "物联感知",
  SBC: "单板机",
  ANDROID: "安卓多开",
  AI: "AI",
};

export default {
  name: "MetricDictionary",
  data() {
    return {
      loading: false,
      deviceTypes: [],
      glossary: [],
      filteredList: [],
      activeType: "",
      keyword: "",
    };
  },
  created() {
    this.load();
  },
  methods: {
    typeLabel(code) {
      return TYPE_LABEL[code] || code || "-";
    },
    async load() {
      this.loading = true;
      try {
        const [typesRes, glossaryRes] = await Promise.all([
          getMetricDeviceTypes(),
          getMetricGlossary(),
        ]);
        this.deviceTypes = (typesRes && typesRes.content) || [];
        this.glossary = (glossaryRes && glossaryRes.content) || [];
        this.applyFilter();
      } finally {
        this.loading = false;
      }
    },
    applyFilter() {
      const kw = this.keyword.trim().toLowerCase();
      this.filteredList = this.glossary.filter((item) => {
        if (this.activeType && item.deviceType !== this.activeType) return false;
        if (!kw) return true;
        const hay = [item.label, item.metricKey, item.definition]
          .map((v) => (v || "").toLowerCase())
          .join(" ");
        return hay.indexOf(kw) !== -1;
      });
    },
    thresholdText(row) {
      if (row.warnValue === undefined || row.warnValue === null) return "-";
      const parts = [`警告 ≥ ${row.warnValue}`];
      if (row.criticalValue !== undefined && row.criticalValue !== null) {
        parts.push(`严重 ≥ ${row.criticalValue}`);
      }
      return parts.join(" / ");
    },
    sourceType(source) {
      return source && source.indexOf("真实") !== -1 ? "success" : "info";
    },
  },
};
</script>

<style scoped>
.metric-dict-page {
  padding: 12px 16px;
}
.dict-header {
  margin-bottom: 10px;
}
.dict-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
}
.dict-note {
  margin: 0;
  font-size: 12px;
  color: #909399;
}
.dict-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.type-select {
  width: 160px;
}
.keyword-input {
  width: 240px;
}
.dict-count {
  font-size: 12px;
  color: #909399;
}
.dict-table {
  width: 100%;
}
.metric-key {
  color: #909399;
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
}
</style>
