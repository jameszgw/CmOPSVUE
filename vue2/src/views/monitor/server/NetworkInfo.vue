<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-top" label="上传速度" :value="upSpeed"
          sub="当前上行速率" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-bottom" label="下载速度" :value="downSpeed"
          sub="当前下行速率" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-upload2" label="总发送" :value="d.totalSent || '-'"
          sub="累计发送数据" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-download" label="总接收" :value="d.totalRecv || '-'"
          sub="累计接收数据" color="#909399" />
      </el-col>
    </el-row>

    <SectionCard v-for="(itf, i) in interfaces" :key="i"
      :title="itf.name || '网卡'" icon="el-icon-connection">
      <template #extra>{{ itf.status || '-' }} · {{ itf.speed || '-' }}</template>
      <InfoTable :rows="interfaceRows(itf)" :columns="2" />
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="12">
        <SectionCard title="发送统计" icon="el-icon-upload2">
          <InfoTable :rows="sentRows" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="12">
        <SectionCard title="接收统计" icon="el-icon-download">
          <InfoTable :rows="recvRows" />
        </SectionCard>
      </el-col>
    </el-row>

    <SectionCard title="实时网络IO" icon="el-icon-time">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <div class="rt-item">
            <div class="rt-item__label">上传速度</div>
            <div class="rt-item__value" style="color: #409eff">{{ realtimeUp }}</div>
            <div class="rt-item__sub">当前上行速率</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12">
          <div class="rt-item">
            <div class="rt-item__label">下载速度</div>
            <div class="rt-item__value" style="color: #67c23a">{{ realtimeDown }}</div>
            <div class="rt-item__sub">当前下行速率</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getServerNetwork } from "@/api/monitor-server";

export default {
  name: "ServerNetworkInfo",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    interfaces() {
      return this.d.interfaces || [];
    },
    upSpeed() {
      return this.d.upSpeed || "-";
    },
    downSpeed() {
      return this.d.downSpeed || "-";
    },
    sentRows() {
      const s = (this.d.totalStats && this.d.totalStats.sent) || {};
      return [
        { label: "发送速度", value: this.d.upSpeed, color: "#409eff" },
        { label: "发送字节", value: s.bytes },
        { label: "发送包数", value: this.fmt(s.packets) },
        { label: "发送错误", value: this.fmt(s.errors) },
        { label: "发送丢包", value: this.fmt(s.drops) },
      ];
    },
    recvRows() {
      const r = (this.d.totalStats && this.d.totalStats.recv) || {};
      return [
        { label: "接收速度", value: this.d.downSpeed, color: "#67c23a" },
        { label: "接收字节", value: r.bytes },
        { label: "接收包数", value: this.fmt(r.packets) },
        { label: "接收错误", value: this.fmt(r.errors) },
        { label: "接收丢包", value: this.fmt(r.drops) },
      ];
    },
    realtimeUp() {
      return (this.d.realtime && this.d.realtime.upSpeed) || "-";
    },
    realtimeDown() {
      return (this.d.realtime && this.d.realtime.downSpeed) || "-";
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
    fmt(v) {
      return typeof v === "number" && Math.abs(v) >= 1000 ? v.toLocaleString() : (v == null ? "-" : v);
    },
    interfaceRows(itf) {
      return [
        { label: "接口名称", value: itf.name },
        { label: "状态", value: itf.status, color: itf.status === "up" ? "#67c23a" : "#909399" },
        { label: "速率", value: itf.speed },
        { label: "MTU", value: itf.mtu },
        { label: "发送字节", value: itf.sentBytes },
        { label: "接收字节", value: itf.recvBytes },
        { label: "发送包数", value: this.fmt(itf.sentPackets) },
        { label: "接收包数", value: this.fmt(itf.recvPackets) },
        { label: "发送错误", value: this.fmt(itf.sentErrors) },
        { label: "接收错误", value: this.fmt(itf.recvErrors) },
      ];
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getServerNetwork(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.rt-item {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;

  &__label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
  &__value {
    font-size: 24px;
    font-weight: 600;
  }
  &__sub {
    margin-top: 6px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
