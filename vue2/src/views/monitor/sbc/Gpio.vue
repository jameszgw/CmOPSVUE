<template>
  <div v-loading="loading" class="tab-screen">
    <card-grid class="fill" min="420px" gap="8px">
      <SectionCard dense scrollable title="GPIO 引脚" icon="el-icon-connection"
        body-class="dense-table fill" class="fill">
        <template #extra>共 {{ num0(d.pinCount) }} 个引脚</template>
        <el-table :data="items" class="dense-table" height="100%" size="small" stripe>
          <el-table-column prop="pin" label="Pin" width="80" align="center" />
          <el-table-column prop="name" label="名称" min-width="140" />
          <el-table-column prop="mode" label="模式" width="110" align="center" />
          <el-table-column label="电平" width="100" align="center">
            <template slot-scope="{ row }">
              <el-tag size="mini" :type="levelTag(row.level)" effect="dark">{{ levelText(row.level) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="pull" label="上下拉" width="110" align="center">
            <template slot-scope="{ row }">{{ val(row.pull) }}</template>
          </el-table-column>
          <el-table-column prop="func" label="复用功能" min-width="160">
            <template slot-scope="{ row }">{{ val(row.func) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!items.length" description="暂无 GPIO 数据" />
      </SectionCard>
    </card-grid>
  </div>
</template>

<script>
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import { getSbcGpio } from "@/api/monitor-sbc";

export default {
  name: "SbcGpio",
  components: { SectionCard, CardGrid },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return { loading: false, d: {} };
  },
  computed: {
    items() {
      return this.d.items || [];
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
    levelText(v) {
      if (v === undefined || v === null || v === "") return "-";
      const s = String(v).toUpperCase();
      if (s === "1" || s === "HIGH") return "HIGH";
      if (s === "0" || s === "LOW") return "LOW";
      return v;
    },
    levelTag(v) {
      const s = this.levelText(v);
      if (s === "HIGH") return "success";
      if (s === "LOW") return "info";
      return "warning";
    },
    async load() {
      if (!this.deviceId) return;
      const hasData = this.d && (Array.isArray(this.d) ? this.d.length : Object.keys(this.d).length);
      if (!hasData) this.loading = true;
      try {
        const res = await getSbcGpio(this.deviceId);
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
.tab-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
  overflow: hidden;
}
</style>
