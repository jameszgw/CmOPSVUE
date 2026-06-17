<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-folder-checked" label="RDB 状态"
        :value="d.rdbOk ? '正常' : '异常'" :tag="rdbStatusText"
        :color="d.rdbOk ? '#67c23a' : '#f56c6c'" />
      <stat-card dense icon="el-icon-document-copy" label="AOF 状态"
        :value="aofValue" :sub="aofSub"
        :color="aofColor" />
      <stat-card dense icon="el-icon-share" label="从节点数"
        :value="d.connectedSlaves == null ? '-' : d.connectedSlaves" sub="connected_slaves"
        color="#409eff" />
      <stat-card dense icon="el-icon-sort" label="最大主从偏移"
        :value="d.maxSlaveLagHuman || '-'" sub="max slave lag" color="#e6a23c" />
    </card-grid>

    <card-grid min="320px" gap="8px" class="content-grid">
      <section-card dense title="RDB 持久化" icon="el-icon-folder">
        <InfoTable :rows="rdbRows" :columns="2" />
      </section-card>

      <section-card dense title="AOF 持久化" icon="el-icon-document">
        <InfoTable :rows="aofRows" :columns="2" />
      </section-card>

      <section-card dense scrollable class="fill" body-class="dense-table fill"
        title="复制状态" icon="el-icon-connection">
        <InfoTable :rows="replicationRows" :columns="2" />
        <el-table v-if="slaves.length" :data="slaves" size="small" stripe class="slaves-table dense-table">
          <el-table-column prop="id" label="ID" width="120" />
          <el-table-column prop="addr" label="地址" min-width="180" />
          <el-table-column label="状态" width="120">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="row.state === 'online' ? 'success' : 'info'" effect="plain">{{ row.state }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="offset" label="偏移量" width="140" align="right" />
          <el-table-column prop="lagBytes" label="偏移字节" width="140" align="right" />
          <el-table-column label="偏移(可读)" width="140" align="right">
            <template slot-scope="{ row }">
              <span style="color: #e6a23c">{{ row.lagHuman }}</span>
            </template>
          </el-table-column>
        </el-table>
      </section-card>

      <section-card dense scrollable class="fill" body-class="dense-table fill"
        title="哨兵切换事件" icon="el-icon-bell">
        <template #extra>共 {{ sentinelEvents.length }} 条</template>
        <el-table v-if="sentinelEvents.length" :data="sentinelEvents" size="small" stripe class="dense-table">
          <el-table-column prop="time" label="时间" width="200" />
          <el-table-column label="类型" width="160">
            <template slot-scope="{ row }">
              <el-tag size="small" type="warning" effect="plain">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="detail" label="详情" min-width="240" />
        </el-table>
        <el-empty v-else description="暂无哨兵切换事件" />
      </section-card>
    </card-grid>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getRedisPersistence } from "@/api/monitor-redis";

const OK_COLOR = "#67c23a";
const ERR_COLOR = "#f56c6c";

export default {
  name: "RedisPersistence",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    rdbStatusText() {
      return this.d.rdbOk ? "BGSAVE OK" : "BGSAVE ERR";
    },
    aofValue() {
      if (!this.d.aofEnabled) return "未启用";
      return this.d.aofOk ? "正常" : "异常";
    },
    aofSub() {
      return this.d.aofEnabled ? "已启用" : "AOF 关闭";
    },
    aofColor() {
      if (!this.d.aofEnabled) return "#909399";
      return this.d.aofOk ? OK_COLOR : ERR_COLOR;
    },
    rdbRows() {
      const r = this.d.rdb || {};
      return [
        { label: "上次保存时间", value: r.lastSaveTime },
        { label: "上次保存后变更数", value: r.changesSinceSave },
        {
          label: "上次 BGSAVE 状态",
          value: r.lastBgsaveStatus,
          color: r.lastBgsaveStatus === "ok" ? OK_COLOR : ERR_COLOR,
        },
        { label: "BGSAVE 进行中", value: r.bgsaveInProgress ? "是" : "否" },
        { label: "上次 BGSAVE 耗时", value: r.lastBgsaveTimeSec == null ? "-" : r.lastBgsaveTimeSec + " s" },
        { label: "RDB 文件大小", value: r.rdbSize },
      ];
    },
    aofRows() {
      const a = this.d.aof || {};
      return [
        { label: "是否启用", value: a.enabled ? "是" : "否", color: a.enabled ? OK_COLOR : "#909399" },
        {
          label: "上次写入状态",
          value: a.lastWriteStatus,
          color: a.lastWriteStatus === "ok" ? OK_COLOR : ERR_COLOR,
        },
        {
          label: "上次重写状态",
          value: a.lastRewriteStatus,
          color: a.lastRewriteStatus === "ok" ? OK_COLOR : ERR_COLOR,
        },
        { label: "重写进行中", value: a.rewriteInProgress ? "是" : "否" },
        { label: "AOF 文件大小", value: a.aofSize },
        { label: "AOF 基础大小", value: a.aofBaseSize },
      ];
    },
    replicationRows() {
      const rp = this.d.replication || {};
      return [
        { label: "角色", value: rp.role, tag: rp.mode },
        { label: "模式", value: rp.mode },
        { label: "从节点数", value: rp.connectedSlaves },
        { label: "主复制偏移", value: rp.masterReplOffset },
        { label: "最大偏移字节", value: rp.maxSlaveLagBytes },
        { label: "最大偏移(可读)", value: rp.maxSlaveLagHuman, color: "#e6a23c" },
        {
          label: "主链路状态",
          value: rp.masterLinkStatus,
          color: rp.masterLinkStatus === "up" ? OK_COLOR : ERR_COLOR,
        },
      ];
    },
    slaves() {
      const rp = this.d.replication || {};
      return Array.isArray(rp.slaves) ? rp.slaves : [];
    },
    sentinelEvents() {
      return Array.isArray(this.d.sentinelEvents) ? this.d.sentinelEvents : [];
    },
  },
  watch: {
    deviceId() {
      this.load();
    },
    refreshToken() {
      this.load();
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getRedisPersistence(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.screen-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 8px;
  padding: @dense-gap;
}
.kpi-grid {
  flex-shrink: 0;
}
.content-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  align-content: start;
}
.slaves-table {
  margin-top: 16px;
}
/deep/ .el-table th {
  background: var(--cm-bg-muted, @bg-muted);
}
</style>
