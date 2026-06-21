<template>
  <screen-page v-loading="loading" title="操作审计" gap="8px" class="audit-page">
    <template #header-extra>
      <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="load">刷新</el-button>
    </template>

    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="操作审计日志"
      icon="el-icon-tickets"
    >
      <template #extra>
        <div class="filter-row">
          <el-input
            v-model="filterOperator"
            placeholder="操作者"
            size="small"
            clearable
            class="filter-input"
            @keyup.enter.native="load"
          />
          <el-input
            v-model="filterAction"
            placeholder="动作"
            size="small"
            clearable
            class="filter-input"
            @keyup.enter.native="load"
          />
          <el-button type="primary" size="small" @click="load">查询</el-button>
          <span class="total-tag">共 {{ total }} 条</span>
        </div>
      </template>
      <el-table class="dense-table" height="100%" :data="items" size="small" stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="operator" label="操作者" min-width="120" show-overflow-tooltip />
        <el-table-column label="动作" min-width="120">
          <template slot-scope="{ row }">
            <el-tag size="small" type="info" effect="plain">{{ row.action || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="方法" width="90">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="methodType(row.method)" effect="plain">
              {{ row.method || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" min-width="200" show-overflow-tooltip />
        <el-table-column prop="clientIp" label="来源IP" width="140" show-overflow-tooltip />
        <el-table-column label="状态码" width="100">
          <template slot-scope="{ row }">
            <span :style="{ color: statusColor(row.status) }">{{ num(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
        <template slot="empty">
          <el-empty description="暂无审计记录" :image-size="60" />
        </template>
      </el-table>
    </section-card>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getAuditList } from "@/api/monitor-ops";

export default {
  name: "MonitorAudit",
  components: { ScreenPage, SectionCard },
  data() {
    return {
      loading: false,
      data: {},
      filterOperator: "",
      filterAction: "",
    };
  },
  computed: {
    items() {
      return this.data.items || [];
    },
    total() {
      return this.data.total != null ? this.data.total : this.items.length;
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    methodType(m) {
      const k = String(m || "").toUpperCase();
      if (k === "GET") return "success";
      if (k === "POST") return "primary";
      if (k === "DELETE") return "danger";
      if (k === "PUT" || k === "PATCH") return "warning";
      return "info";
    },
    statusColor(s) {
      const n = Number(s);
      if (Number.isNaN(n)) return "var(--cm-text-primary)";
      if (n >= 500) return "#f56c6c";
      if (n >= 400) return "#e6a23c";
      return "#67c23a";
    },
    async load() {
      this.loading = true;
      try {
        const res = await getAuditList(100, this.filterOperator, this.filterAction);
        this.data = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.filter-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.filter-input {
  width: 140px;
}
.total-tag {
  font-size: 12px;
  color: var(--cm-text-secondary, @text-secondary);
}
</style>
