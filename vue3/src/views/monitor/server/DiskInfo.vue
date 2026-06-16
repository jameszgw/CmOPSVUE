<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Download" label="读取速度" :value="d.readSpeed || '-'"
          sub="当前磁盘读取" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Upload" label="写入速度" :value="d.writeSpeed || '-'"
          sub="当前磁盘写入" color="#67c23a" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Files" label="总容量" :value="d.totalCapacity || '-'"
          sub="所有分区总容量" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="DataLine" label="总写入" :value="d.totalWritten || '-'"
          sub="累计写入数据" color="#909399" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Timer" label="磁盘最大 await" :value="`${num(d.maxAwait)} ms`"
          sub="分区最大 IO 时延" color="#e6a23c" />
      </el-col>
    </el-row>

    <SectionCard v-for="(p, i) in d.partitions || []" :key="i" :title="p.mount || `分区 ${i + 1}`"
      icon="Coin">
      <template #extra>
        <el-tag v-if="i === 0" size="small" :type="['agent','ssh','snmp','winrm','redis'].includes(d.source) ? 'success' : 'info'" style="margin-right: 6px">
          {{ {agent:"真实采集·Agent",ssh:"真实采集·SSH",snmp:"真实采集·SNMP",winrm:"真实采集·WinRM",redis:"真实采集·Redis"}[d.source] || "模拟数据" }}
        </el-tag>
        <el-tag v-if="p.slow" size="small" type="danger" effect="dark" class="part-slow-tag">慢盘</el-tag>
        {{ p.used || '-' }} / {{ p.total || '-' }}
      </template>
      <div class="part-usage">
        <span class="part-usage__label">磁盘空间</span>
        <el-progress :percentage="clamp(p.usage)" :stroke-width="12"
          :color="usageColor(p.usage)" class="part-usage__bar" />
      </div>
      <div v-if="p.inodeUsage !== undefined && p.inodeUsage !== null" class="part-usage">
        <span class="part-usage__label">inode 使用率</span>
        <el-progress :percentage="clamp(p.inodeUsage)" :stroke-width="12"
          :color="usageColor(p.inodeUsage)" class="part-usage__bar" />
      </div>
      <InfoTable :rows="partitionRows(p)" :columns="2" />
    </SectionCard>

    <SectionCard title="磁盘 IO 统计" icon="DataAnalysis">
      <el-row :gutter="12">
        <el-col :xs="24" :lg="12">
          <div class="io-block">
            <div class="io-block__head">读取统计</div>
            <InfoTable :rows="readRows" />
          </div>
        </el-col>
        <el-col :xs="24" :lg="12">
          <div class="io-block">
            <div class="io-block__head">写入统计</div>
            <InfoTable :rows="writeRows" />
          </div>
        </el-col>
      </el-row>
    </SectionCard>

    <SectionCard title="实时磁盘 IO" icon="Histogram">
      <el-row :gutter="12">
        <el-col :xs="24" :sm="12">
          <div class="grid-metric">
            <div class="grid-metric__label">读取速度</div>
            <div class="grid-metric__value" style="color: #409eff">{{ d.realtime?.readSpeed || '-' }}</div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12">
          <div class="grid-metric">
            <div class="grid-metric__label">写入速度</div>
            <div class="grid-metric__value" style="color: #67c23a">{{ d.realtime?.writeSpeed || '-' }}</div>
          </div>
        </el-col>
      </el-row>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getServerDisk } from "@/api/monitor-server";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const usageColor = (v) => (v > 85 ? "#f56c6c" : v > 60 ? "#e6a23c" : "#409eff");

const partitionRows = (p) => [
  { label: "设备", value: p.device },
  { label: "挂载点", value: p.mount, color: "#409eff" },
  { label: "文件系统", value: p.fs },
  { label: "总容量", value: p.total },
  { label: "已使用", value: p.used },
  { label: "可用空间", value: p.free, color: "#67c23a" },
  { label: "inode 总数", value: p.inodeTotal },
  {
    label: "await",
    value: `${num(p.await)} ms`,
    color: p.slow ? "#f56c6c" : undefined,
    tag: p.slow ? "慢盘" : undefined,
  },
  { label: "平均队列", value: num(p.avgQueue) },
  { label: "利用率", value: `${num(p.util)}%`, color: usageColor(p.util) },
];

const readRows = computed(() => {
  const r = d.value.ioStats?.read || {};
  return [
    { label: "读取次数", value: r.count },
    { label: "读取字节", value: r.bytes },
    { label: "读取耗时", value: r.time },
    { label: "读取 await", value: `${num(r.await)} ms`, color: "#e6a23c" },
  ];
});

const writeRows = computed(() => {
  const w = d.value.ioStats?.write || {};
  return [
    { label: "写入次数", value: w.count },
    { label: "写入字节", value: w.bytes },
    { label: "写入耗时", value: w.time },
    { label: "写入 await", value: `${num(w.await)} ms`, color: "#e6a23c" },
  ];
});

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getServerDisk(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], load);
onMounted(load);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.part-slow-tag {
  margin-right: 8px;
}
.part-usage {
  margin-bottom: 16px;
  &__label {
    display: block;
    font-size: 13px;
    color: var(--cm-text-regular);
    margin-bottom: 6px;
  }
}
.io-block {
  margin-bottom: 12px;
  &__head {
    font-size: 13px;
    font-weight: 600;
    color: var(--cm-text-primary);
    margin-bottom: 10px;
  }
}
.grid-metric {
  border: 1px solid var(--cm-bg-page);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  &__label {
    font-size: 12px;
    color: var(--cm-text-secondary);
    margin-bottom: 6px;
  }
  &__value {
    font-size: 20px;
    font-weight: 600;
    color: var(--cm-text-primary);
  }
}
</style>
