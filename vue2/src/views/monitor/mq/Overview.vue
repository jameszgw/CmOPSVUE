<template>
  <div v-loading="loading" class="screen-tab">
    <card-grid min="220px" gap="8px" class="kpi-grid">
      <stat-card dense icon="el-icon-cpu" label="Broker"
        :value="`${num0(d.brokerOnline)} / ${num0(d.brokerTotal)}`"
        :sub="`在线 ${num0(d.brokerOnline)} / 离线 ${num0(d.brokerOffline)}`" color="#409eff" />
      <stat-card dense icon="el-icon-collection" label="主题数"
        :value="num0(d.topicCount)" :sub="`分区 ${num0(d.partitionCount)}`" color="#67c23a" />
      <stat-card dense icon="el-icon-upload" label="生产速率"
        :value="`${num0(d.produceRate)} msg/s`" :sub="`消费 ${num0(d.consumeRate)} msg/s`" color="#e6a23c" />
      <stat-card dense icon="el-icon-warning-outline" label="消费积压"
        :value="num0(d.totalLag)" :sub="`堆积 ${num0(d.messageBacklog)}`" color="#f56c6c" />
    </card-grid>

    <div class="screen-tab__main">
      <card-grid min="320px" gap="8px">
        <section-card dense title="基础信息" icon="el-icon-info">
          <template #extra>
            <el-tooltip v-if="versionStatus" :content="versionTooltip" placement="top">
              <el-tag size="mini" :type="versionTagType" style="margin-right: 6px">
                适配: {{ versionStatus.status }}
              </el-tag>
            </el-tooltip>
            <el-tag size="mini" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
              {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
            </el-tag>
          </template>
          <InfoTable :rows="basicRows" />
        </section-card>
        <section-card dense title="吞吐统计" icon="el-icon-data-line">
          <InfoTable :rows="throughputRows" />
        </section-card>
        <section-card dense title="健康状态" icon="el-icon-odometer">
          <el-row :gutter="12">
            <el-col :xs="12" :sm="6">
              <div class="count-card">
                <div class="count-card__value" :style="{ color: underReplColor }">{{ num0(d.underReplicated) }}</div>
                <div class="count-card__label">副本不足分区</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="count-card">
                <div class="count-card__value" :style="{ color: offlineColor }">{{ num0(d.offlinePartitions) }}</div>
                <div class="count-card__label">离线分区</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="count-card">
                <div class="count-card__value" style="color:#409eff">{{ num0(d.consumerGroupCount) }}</div>
                <div class="count-card__label">消费组数</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="count-card">
                <div class="count-card__value" style="color:#909399">{{ num0(d.totalMessages) }}</div>
                <div class="count-card__label">总消息数</div>
              </div>
            </el-col>
          </el-row>
          <div class="bar-row">
            <span class="bar-row__label">磁盘使用率</span>
            <el-progress :percentage="clamp(d.diskUsagePct)" :stroke-width="14" :text-inside="true" :color="diskColor" />
          </div>
        </section-card>
      </card-grid>
    </div>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getMqOverview } from "@/api/monitor-mq";
import { getVersionStatus } from "@/api/monitor-meta";

export default {
  name: "MqOverview",
  components: { StatCard, SectionCard, CardGrid, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {}, versionStatus: null };
  },
  computed: {
    versionTagType() {
      const s = this.versionStatus && this.versionStatus.status;
      if (s === "适配") return "success";
      if (s === "可能适配") return "warning";
      return "info";
    },
    versionTooltip() {
      const v = this.versionStatus;
      return v ? `支持范围：${v.supported || "-"}（推荐 ${v.recommended || "-"}）` : "";
    },
    basicRows() {
      const d = this.d;
      return [
        { label: "MQ 类型", value: this.val(d.mqType) },
        { label: "版本", value: this.val(d.version) },
        { label: "地址", value: this.val(d.address) },
        { label: "Controller", value: this.val(d.controllerActive) },
        { label: "主题数", value: this.val(d.topicCount) },
        { label: "分区数", value: this.val(d.partitionCount) },
      ];
    },
    throughputRows() {
      const d = this.d;
      return [
        { label: "生产速率", value: `${this.num0(d.produceRate)} msg/s` },
        { label: "消费速率", value: `${this.num0(d.consumeRate)} msg/s` },
        { label: "输入速率", value: this.val(d.inRate) },
        { label: "输出速率", value: this.val(d.outRate) },
        { label: "总积压", value: this.num0(d.totalLag) },
        { label: "消息堆积", value: this.num0(d.messageBacklog) },
      ];
    },
    underReplColor() {
      return Number(this.d.underReplicated) > 0 ? "#f56c6c" : "#67c23a";
    },
    offlineColor() {
      return Number(this.d.offlinePartitions) > 0 ? "#f56c6c" : "#67c23a";
    },
    diskColor() {
      const v = Number(this.d.diskUsagePct) || 0;
      if (v >= 90) return "#f56c6c";
      if (v >= 75) return "#e6a23c";
      return "#67c23a";
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
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    clamp(v) {
      return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getMqOverview(this.deviceId);
        this.d = res.content || {};
        this.loadVersionStatus();
      } finally {
        this.loading = false;
      }
    },
    async loadVersionStatus() {
      const version = this.d.version;
      const product = String(this.d.mqType || (this.device && this.device.mqType) || "").toUpperCase();
      if (!version || !product) {
        this.versionStatus = null;
        return;
      }
      try {
        const res = await getVersionStatus(product, version);
        this.versionStatus = res.content || null;
      } catch (e) {
        this.versionStatus = null;
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
  padding: 8px;
  box-sizing: border-box;
  &__main {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
}
.kpi-grid {
  flex-shrink: 0;
}
.count-card {
  border: 1px solid var(--cm-border-light, @border-light);
  border-radius: 8px;
  padding: 14px 12px;
  text-align: center;
  margin-bottom: 12px;
  &__value {
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }
  &__label {
    margin-top: 6px;
    font-size: 12px;
    color: var(--cm-text-secondary, @text-secondary);
  }
}
.bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  &__label {
    width: 90px;
    flex-shrink: 0;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
  /deep/ .el-progress {
    flex: 1;
  }
}
</style>
