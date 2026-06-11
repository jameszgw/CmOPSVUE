<template>
  <el-space direction="vertical" fill style="width: 100%" size="default">
    <el-card header="负载" shadow="never">
      <el-row>
        <el-col :span="8">
          <el-statistic title="1分钟" :value="basicMetricVO?.load?.oneMinuteLoad || 0" suffix="%" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="5分钟" :value="basicMetricVO?.load?.fiveMinuteLoad || 0" suffix="%" />
        </el-col>
        <el-col :span="8">
          <el-statistic
            title="15分钟"
            :value="basicMetricVO?.load?.fifteenMinuteLoad || 0"
            suffix="%"
          />
        </el-col>
      </el-row>
    </el-card>

    <el-form inline :model="filterForm" @submit.prevent>
      <el-form-item label="数据粒度">
        <el-select v-model="filterForm.granularity" placeholder="请选择数据粒度" style="width: 120px">
          <el-option :value="10" label="10秒" />
          <el-option :value="12" label="30秒" />
          <el-option :value="20" label="1分钟" />
          <el-option :value="22" label="5分钟" />
          <el-option :value="24" label="10分钟" />
          <el-option :value="26" label="30分钟" />
          <el-option :value="30" label="1小时" />
          <el-option :value="32" label="6小时" />
          <el-option :value="34" label="12小时" />
          <el-option :value="40" label="1天" />
          <el-option :value="50" label="1周" />
        </el-select>
      </el-form-item>
      <el-form-item label="选择时间范围">
        <el-date-picker
          v-model="filterForm.timeRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="applyFilter">查询</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="24">
      <el-col :span="12">
        <el-carousel height="110px" autoplay>
          <el-carousel-item v-for="item in cpuCards" :key="item.title">
            <MetricCard :item="item" />
          </el-carousel-item>
        </el-carousel>
        <div ref="cpuChartRef" class="chart" />
      </el-col>
      <el-col :span="12">
        <el-carousel height="110px" autoplay>
          <el-carousel-item v-for="item in memoryCards" :key="item.title">
            <MetricCard :item="item" />
          </el-carousel-item>
        </el-carousel>
        <div ref="memoryChartRef" class="chart" />
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :span="12">
        <el-carousel height="110px" autoplay>
          <el-carousel-item v-for="item in netCards" :key="item.title">
            <MetricCard :item="item" />
          </el-carousel-item>
        </el-carousel>
        <div ref="netChartRef" class="chart" />
      </el-col>
      <el-col :span="12">
        <el-carousel height="110px" autoplay>
          <el-carousel-item v-for="item in diskCards" :key="item.title">
            <MetricCard :item="item" />
          </el-carousel-item>
        </el-carousel>
        <div ref="diskChartRef" class="chart" />
      </el-col>
    </el-row>

    <!-- 系统进程 -->
    <el-table size="small" :data="basicMetricVO?.processes || []" row-key="pid" style="width: 100%">
      <el-table-column prop="pid" label="进程" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="user" label="用户" />
      <el-table-column prop="port" label="端口" />
      <el-table-column prop="cpuUsage" label="cpu使用率" />
      <el-table-column prop="memoryUsage" label="使用内存" />
      <el-table-column prop="openFile" label="句柄数" />
      <el-table-column prop="upTime" label="启用时长" />
      <el-table-column label="命令行" min-width="200">
        <template #default="{ row }">
          <span class="command-line" :title="row.commandLine" @click="copyText(row.commandLine)">
            {{ row.commandLine }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <el-row :gutter="24">
      <el-col :span="8">
        <el-table size="small" :data="disks || []" style="width: 100%">
          <el-table-column prop="name" label="硬盘名称" />
          <el-table-column prop="seq" label="硬盘序列" />
        </el-table>
      </el-col>
      <el-col :span="16">
        <el-table size="small" :data="basicMetricVO?.disks || []" style="width: 100%">
          <el-table-column prop="name" label="硬盘名称" />
          <el-table-column prop="totalSpace" label="硬盘总空间" />
          <el-table-column prop="usageSpace" label="使用空间" />
          <el-table-column prop="freeSpace" label="空闲空间" />
          <el-table-column label="使用率">
            <template #default="{ row }">{{ row.usage }}%</template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </el-space>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount, h } from "vue";
import * as echarts from "echarts";
import dayjs from "dayjs";
import { ElMessage, ElCard, ElRow, ElCol, ElStatistic } from "element-plus";
import {
  getCpuStatistics,
  getMemoryStatistics,
  getNetStatistics,
  getDiskStatistics,
} from "@/api/host-monitor";

const props = defineProps({
  hostId: {
    type: String,
    default: "",
  },
  disks: {
    type: Array,
    default: () => [],
  },
  basicMetricVO: {
    type: Object,
    default: null,
  },
});

// 指标统计卡片（平均/最小/最大）
const MetricCard = (cardProps) => {
  const item = cardProps.item;
  return h(
    ElCard,
    { header: `${item.title}(${item.suffix})`, shadow: "never" },
    {
      default: () =>
        h(ElRow, { gutter: 12 }, () => [
          h(ElCol, { span: 8 }, () =>
            h(ElStatistic, { title: "平均值", value: item.data?.avg ?? 0 })
          ),
          h(ElCol, { span: 8 }, () =>
            h(ElStatistic, { title: "最小值", value: item.data?.min ?? 0 })
          ),
          h(ElCol, { span: 8 }, () =>
            h(ElStatistic, { title: "最大值", value: item.data?.max ?? 0 })
          ),
        ]),
    }
  );
};
MetricCard.props = { item: { type: Object, required: true } };

const cpuChartRef = ref(null);
const memoryChartRef = ref(null);
const netChartRef = ref(null);
const diskChartRef = ref(null);

let chartInstances = [];

const cpuStatisticsVO = ref(null);
const memoryStatisticsVO = ref(null);
const netStatisticsVO = ref(null);
const diskStatisticsVO = ref(null);

const defaultTimeRange = () => [dayjs().subtract(1, "day").toDate(), new Date()];

const filterForm = reactive({
  granularity: 20, // 1分钟
  timeRange: defaultTimeRange(),
});

const monitorFilter = reactive({
  granularity: 20,
  startRange: Math.floor(dayjs().subtract(1, "day").valueOf() / 1000),
  endRange: Math.floor(Date.now() / 1000),
});

const cpuCards = computed(() => [
  { title: "CPU使用率", data: cpuStatisticsVO.value?.usage, suffix: "%" },
]);
const memoryCards = computed(() => [
  { title: "内存使用率", data: memoryStatisticsVO.value?.usage, suffix: "%" },
  { title: "内存使用量", data: memoryStatisticsVO.value?.size, suffix: "MB" },
]);
const netCards = computed(() => [
  { title: "上行速率", data: netStatisticsVO.value?.sentSpeed, suffix: "mbp/s" },
  { title: "下行速率", data: netStatisticsVO.value?.recvSpeed, suffix: "mbp/s" },
  { title: "上行包数", data: netStatisticsVO.value?.sentPacket, suffix: "个/s" },
  { title: "下行包数", data: netStatisticsVO.value?.recvPacket, suffix: "个/s" },
]);
const diskCards = computed(() => [
  { title: "硬盘读速度", data: diskStatisticsVO.value?.readSpeed, suffix: "kb/s" },
  { title: "硬盘写速度", data: diskStatisticsVO.value?.writeSpeed, suffix: "kb/s" },
  { title: "硬盘读次数", data: diskStatisticsVO.value?.readCount, suffix: "次/s" },
  { title: "硬盘写次数", data: diskStatisticsVO.value?.writeCount, suffix: "次/s" },
  { title: "使用时间", data: diskStatisticsVO.value?.usageTime, suffix: "ms" },
]);

const getLineChartOption = (data, labels) => ({
  tooltip: { trigger: "axis" },
  legend: { data: labels },
  xAxis: {
    type: "category",
    data: (data[labels[0]]?.metrics || []).map((item) =>
      dayjs(item.time * 1000).format("YYYY-MM-DD HH:mm:ss")
    ),
  },
  yAxis: { type: "value" },
  series: labels.map((label) => ({
    name: label,
    data: (data[label]?.metrics || []).map((metric) => metric.value),
    type: "line",
    smooth: true,
  })),
});

const renderChart = (el, dataMap, labels) => {
  if (!el) {
    return;
  }
  let instance = echarts.getInstanceByDom(el);
  if (!instance) {
    instance = echarts.init(el);
    chartInstances.push(instance);
  }
  instance.setOption(getLineChartOption(dataMap, labels));
};

const renderCharts = () => {
  nextTick(() => {
    renderChart(cpuChartRef.value, { CPU使用率: cpuStatisticsVO.value?.usage }, ["CPU使用率"]);
    renderChart(
      memoryChartRef.value,
      {
        内存使用率: memoryStatisticsVO.value?.usage,
        内存使用量: memoryStatisticsVO.value?.size,
      },
      ["内存使用率", "内存使用量"]
    );
    renderChart(
      netChartRef.value,
      {
        上行速率: netStatisticsVO.value?.sentSpeed,
        下行速率: netStatisticsVO.value?.recvSpeed,
        上行包数: netStatisticsVO.value?.sentPacket,
        下行包数: netStatisticsVO.value?.recvPacket,
      },
      ["上行速率", "下行速率", "上行包数", "下行包数"]
    );
    renderChart(
      diskChartRef.value,
      {
        硬盘读速度: diskStatisticsVO.value?.readSpeed,
        硬盘写速度: diskStatisticsVO.value?.writeSpeed,
        硬盘读次数: diskStatisticsVO.value?.readCount,
        硬盘写次数: diskStatisticsVO.value?.writeCount,
        使用时间: diskStatisticsVO.value?.usageTime,
      },
      ["硬盘写速度", "硬盘读速度", "硬盘读次数", "硬盘写次数", "使用时间"]
    );
  });
};

const loadStatistics = async () => {
  if (!props.hostId) {
    return;
  }
  const payload = {
    hostId: props.hostId,
    granularity: monitorFilter.granularity,
    startRange: monitorFilter.startRange,
    endRange: monitorFilter.endRange,
  };
  const [cpuRes, memoryRes, diskRes, netRes] = await Promise.all([
    getCpuStatistics(payload),
    getMemoryStatistics(payload),
    getDiskStatistics(payload),
    getNetStatistics(payload),
  ]);
  cpuStatisticsVO.value = cpuRes.content;
  memoryStatisticsVO.value = memoryRes.content;
  diskStatisticsVO.value = diskRes.content;
  netStatisticsVO.value = netRes.content;
  renderCharts();
};

const applyFilter = () => {
  monitorFilter.granularity = filterForm.granularity;
  if (filterForm.timeRange && filterForm.timeRange.length === 2) {
    monitorFilter.startRange = Math.floor(new Date(filterForm.timeRange[0]).valueOf() / 1000);
    monitorFilter.endRange = Math.floor(new Date(filterForm.timeRange[1]).valueOf() / 1000);
  } else {
    monitorFilter.startRange = undefined;
    monitorFilter.endRange = undefined;
  }
  loadStatistics();
};

const resetFilter = () => {
  filterForm.granularity = 20;
  filterForm.timeRange = defaultTimeRange();
  applyFilter();
};

const copyText = (text) => {
  if (!text) {
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success("复制成功");
  });
};

watch(
  () => props.hostId,
  (val) => {
    if (val) {
      loadStatistics();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  chartInstances.forEach((instance) => instance.dispose());
  chartInstances = [];
});
</script>

<style lang="less" scoped>
.chart {
  height: 400px;
  width: 100%;
}

.command-line {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  vertical-align: middle;
}
</style>
