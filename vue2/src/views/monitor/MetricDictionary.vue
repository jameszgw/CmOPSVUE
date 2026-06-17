<template>
  <screen-page v-loading="loading" title="指标说明（指标字典）" gap="8px">
    <template #header-extra>
      <div class="dict-filter">
        <el-select
          v-model="activeType"
          size="small"
          clearable
          placeholder="全部设备类型"
          class="dict-filter__type"
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
          prefix-icon="el-icon-search"
          class="dict-filter__search"
          @input="applyFilter"
        />
        <span class="dict-filter__count">共 {{ filteredList.length }} 项</span>
      </div>
    </template>

    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="指标字典"
      icon="el-icon-collection"
    >
      <template slot="extra">
        <span class="dict-note">
          解释每个监控指标“是什么/怎么看/从哪来”，阈值为推荐值（可在告警规则中调整）。
        </span>
      </template>

      <!-- 指标表 -->
      <el-table
        :data="filteredList"
        size="small"
        stripe
        border
        height="100%"
        class="dense-table dict-table"
      >
        <el-table-column prop="deviceType" label="类型" width="100">
          <template slot-scope="{ row }">
            <el-tag size="mini" type="info">{{ typeLabel(row.deviceType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="指标" min-width="160">
          <template slot-scope="{ row }">
            <div class="dict-metric">
              <span class="dict-metric__label">{{ row.label }}</span>
              <span class="dict-metric__key">{{ row.metricKey }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="80">
          <template slot-scope="{ row }">{{ row.unit || "-" }}</template>
        </el-table-column>
        <el-table-column
          prop="definition"
          label="含义"
          min-width="220"
          show-overflow-tooltip
        >
          <template slot-scope="{ row }">{{ row.definition || "-" }}</template>
        </el-table-column>
        <el-table-column
          prop="interpretation"
          label="解读"
          min-width="240"
          show-overflow-tooltip
        >
          <template slot-scope="{ row }">{{ row.interpretation || "-" }}</template>
        </el-table-column>
        <el-table-column label="推荐阈值" min-width="180">
          <template slot-scope="{ row }">{{ thresholdText(row) }}</template>
        </el-table-column>
        <el-table-column label="采集来源" width="110">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="sourceType(row.source)">
              {{ row.source || "-" }}
            </el-tag>
          </template>
        </el-table-column>

        <template slot="empty">
          <el-empty description="暂无匹配指标" :image-size="80" />
        </template>
      </el-table>
    </section-card>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
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
  components: {
    ScreenPage,
    SectionCard,
  },
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

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.dict-note {
  color: @text-secondary;
  font-size: 12px;
}

.dict-filter {
  display: flex;
  align-items: center;
  gap: @space-sm;
  flex-wrap: wrap;

  &__type {
    width: 160px;
  }

  &__search {
    width: 240px;
  }

  &__count {
    color: @text-secondary;
    font-size: 12px;
  }
}

.dict-metric {
  display: flex;
  flex-direction: column;
  line-height: 1.3;

  &__label {
    color: @text-primary;
  }

  &__key {
    color: @text-secondary;
    font-size: 11px;
    font-family: Menlo, Consolas, monospace;
  }
}

.dict-table {
  width: 100%;
}
</style>
