<template>
  <div class="top-progress-table">
    <el-card shadow="never" class="block">
      <template #header>负载</template>
      <el-row>
        <el-col :span="8">
          <div class="statistic">
            <div class="statistic-title">1分钟</div>
            <div class="statistic-value">{{ loadValue("oneMinuteLoad") }}%</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistic">
            <div class="statistic-title">5分钟</div>
            <div class="statistic-value">{{ loadValue("fiveMinuteLoad") }}%</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="statistic">
            <div class="statistic-title">15分钟</div>
            <div class="statistic-value">{{ loadValue("fifteenMinuteLoad") }}%</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-form inline class="block">
      <el-form-item label="数据粒度">
        <el-select v-model="filterForm.granularity" placeholder="请选择数据粒度" style="width: 120px">
          <el-option
            v-for="g in granularities"
            :key="g.value"
            :label="g.label"
            :value="g.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="选择时间范围">
        <el-date-picker
          v-model="filterForm.timeRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="timestamp"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleFilterSubmit">查询</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="24" class="block">
      <el-col :span="12">
        <el-carousel height="110px" indicator-position="none" :autoplay="true">
          <el-carousel-item v-for="card in cpuCards" :key="card.title">
            <el-card shadow="never" :body-style="{ padding: '8px 16px' }">
              <div style="font-size: 13px; margin-bottom: 6px">{{ card.title }}({{ card.suffix }})</div>
              <el-row :gutter="12">
                <el-col :span="8">
                  <div class="statistic-title">平均值</div>
                  <div class="statistic-value">{{ cardValue(card, "avg") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最小值</div>
                  <div class="statistic-value">{{ cardValue(card, "min") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最大值</div>
                  <div class="statistic-value">{{ cardValue(card, "max") }}</div>
                </el-col>
              </el-row>
            </el-card>
          </el-carousel-item>
        </el-carousel>
        <div ref="cpuChart" class="chart" />
      </el-col>
      <el-col :span="12">
        <el-carousel height="110px" indicator-position="none" :autoplay="true">
          <el-carousel-item v-for="card in memoryCards" :key="card.title">
            <el-card shadow="never" :body-style="{ padding: '8px 16px' }">
              <div style="font-size: 13px; margin-bottom: 6px">{{ card.title }}({{ card.suffix }})</div>
              <el-row :gutter="12">
                <el-col :span="8">
                  <div class="statistic-title">平均值</div>
                  <div class="statistic-value">{{ cardValue(card, "avg") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最小值</div>
                  <div class="statistic-value">{{ cardValue(card, "min") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最大值</div>
                  <div class="statistic-value">{{ cardValue(card, "max") }}</div>
                </el-col>
              </el-row>
            </el-card>
          </el-carousel-item>
        </el-carousel>
        <div ref="memoryChart" class="chart" />
      </el-col>
    </el-row>
    <el-row :gutter="24" class="block">
      <el-col :span="12">
        <el-carousel height="110px" indicator-position="none" :autoplay="true">
          <el-carousel-item v-for="card in netCards" :key="card.title">
            <el-card shadow="never" :body-style="{ padding: '8px 16px' }">
              <div style="font-size: 13px; margin-bottom: 6px">{{ card.title }}({{ card.suffix }})</div>
              <el-row :gutter="12">
                <el-col :span="8">
                  <div class="statistic-title">平均值</div>
                  <div class="statistic-value">{{ cardValue(card, "avg") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最小值</div>
                  <div class="statistic-value">{{ cardValue(card, "min") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最大值</div>
                  <div class="statistic-value">{{ cardValue(card, "max") }}</div>
                </el-col>
              </el-row>
            </el-card>
          </el-carousel-item>
        </el-carousel>
        <div ref="netChart" class="chart" />
      </el-col>
      <el-col :span="12">
        <el-carousel height="110px" indicator-position="none" :autoplay="true">
          <el-carousel-item v-for="card in diskCards" :key="card.title">
            <el-card shadow="never" :body-style="{ padding: '8px 16px' }">
              <div style="font-size: 13px; margin-bottom: 6px">{{ card.title }}({{ card.suffix }})</div>
              <el-row :gutter="12">
                <el-col :span="8">
                  <div class="statistic-title">平均值</div>
                  <div class="statistic-value">{{ cardValue(card, "avg") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最小值</div>
                  <div class="statistic-value">{{ cardValue(card, "min") }}</div>
                </el-col>
                <el-col :span="8">
                  <div class="statistic-title">最大值</div>
                  <div class="statistic-value">{{ cardValue(card, "max") }}</div>
                </el-col>
              </el-row>
            </el-card>
          </el-carousel-item>
        </el-carousel>
        <div ref="diskChart" class="chart" />
      </el-col>
    </el-row>

    <el-table
      size="mini"
      :data="(basicMetricVO && basicMetricVO.processes) || []"
      row-key="pid"
      class="block"
    >
      <el-table-column prop="pid" label="进程" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="user" label="用户" />
      <el-table-column prop="port" label="端口" />
      <el-table-column prop="cpuUsage" label="cpu使用率" />
      <el-table-column prop="memoryUsage" label="使用内存" />
      <el-table-column prop="openFile" label="句柄数" />
      <el-table-column prop="upTime" label="启用时长" />
      <el-table-column prop="commandLine" label="命令行" min-width="200" show-overflow-tooltip />
    </el-table>

    <el-row :gutter="24" class="block">
      <el-col :span="8">
        <el-table size="mini" :data="disks || []">
          <el-table-column prop="name" label="硬盘名称" />
          <el-table-column prop="seq" label="硬盘序列" />
        </el-table>
      </el-col>
      <el-col :span="16">
        <el-table size="mini" :data="(basicMetricVO && basicMetricVO.disks) || []">
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
  </div>
</template>

<script>
import * as echarts from "echarts";
import dayjs from "dayjs";
import {
  getCpuStatistics,
  getMemoryStatistics,
  getNetStatistics,
  getDiskStatistics,
} from "@/api/host-monitor";

export default {
  name: "TopProgressTable",
  props: {
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
  },
  data() {
    const now = dayjs().startOf("second");
    return {
      cpuStatisticsVO: null,
      memoryStatisticsVO: null,
      netStatisticsVO: null,
      diskStatisticsVO: null,
      granularities: [
        { value: 10, label: "10秒" },
        { value: 12, label: "30秒" },
        { value: 20, label: "1分钟" },
        { value: 22, label: "5分钟" },
        { value: 24, label: "10分钟" },
        { value: 26, label: "30分钟" },
        { value: 30, label: "1小时" },
        { value: 32, label: "6小时" },
        { value: 34, label: "12小时" },
        { value: 40, label: "1天" },
        { value: 50, label: "1周" },
      ],
      filterForm: {
        granularity: 20, // 1分钟
        timeRange: [now.subtract(1, "day").valueOf(), now.valueOf()],
      },
      monitorFilter: {
        granularity: 20,
        startRange: now.subtract(1, "day").valueOf() / 1000,
        endRange: now.valueOf() / 1000,
      },
    };
  },
  computed: {
    cpuCards() {
      return [
        { title: "CPU使用率", data: this.cpuStatisticsVO && this.cpuStatisticsVO.usage, suffix: "%" },
      ];
    },
    memoryCards() {
      return [
        { title: "内存使用率", data: this.memoryStatisticsVO && this.memoryStatisticsVO.usage, suffix: "%" },
        { title: "内存使用量", data: this.memoryStatisticsVO && this.memoryStatisticsVO.size, suffix: "MB" },
      ];
    },
    netCards() {
      const net = this.netStatisticsVO || {};
      return [
        { title: "上行速率", data: net.sentSpeed, suffix: "mbp/s" },
        { title: "下行速率", data: net.recvSpeed, suffix: "mbp/s" },
        { title: "上行包数", data: net.sentPacket, suffix: "个/s" },
        { title: "下行包数", data: net.recvPacket, suffix: "个/s" },
      ];
    },
    diskCards() {
      const disk = this.diskStatisticsVO || {};
      return [
        { title: "硬盘读速度", data: disk.readSpeed, suffix: "kb/s" },
        { title: "硬盘写速度", data: disk.writeSpeed, suffix: "kb/s" },
        { title: "硬盘读次数", data: disk.readCount, suffix: "次/s" },
        { title: "硬盘写次数", data: disk.writeCount, suffix: "次/s" },
        { title: "使用时间", data: disk.usageTime, suffix: "ms" },
      ];
    },
  },
  watch: {
    hostId: {
      immediate: true,
      handler(val) {
        if (val) {
          this.loadStatistics();
        }
      },
    },
  },
  created() {
    this.charts = {};
  },
  beforeDestroy() {
    Object.keys(this.charts).forEach((key) => {
      if (this.charts[key]) {
        this.charts[key].dispose();
      }
    });
    this.charts = {};
  },
  methods: {
    loadValue(key) {
      const load = this.basicMetricVO && this.basicMetricVO.load;
      return load && load[key] != null ? load[key] : "-";
    },
    cardValue(card, key) {
      return card.data && card.data[key] != null ? card.data[key] : "-";
    },
    handleFilterSubmit() {
      const { granularity, timeRange } = this.filterForm;
      if (timeRange && timeRange.length === 2) {
        this.monitorFilter = {
          granularity,
          startRange: Math.floor(timeRange[0] / 1000),
          endRange: Math.floor(timeRange[1] / 1000),
        };
      } else {
        this.monitorFilter = {
          granularity,
          startRange: undefined,
          endRange: undefined,
        };
      }
      if (this.hostId) {
        this.loadStatistics();
      }
    },
    resetFilter() {
      const now = dayjs().startOf("second");
      this.filterForm = {
        granularity: 20,
        timeRange: [now.subtract(1, "day").valueOf(), now.valueOf()],
      };
    },
    async loadStatistics() {
      const params = {
        hostId: this.hostId,
        granularity: this.monitorFilter.granularity,
        startRange: this.monitorFilter.startRange,
        endRange: this.monitorFilter.endRange,
      };
      try {
        const [cpuRes, memRes, diskRes, netRes] = await Promise.all([
          getCpuStatistics(params),
          getMemoryStatistics(params),
          getDiskStatistics(params),
          getNetStatistics(params),
        ]);
        this.cpuStatisticsVO = cpuRes.content;
        this.memoryStatisticsVO = memRes.content;
        this.diskStatisticsVO = diskRes.content;
        this.netStatisticsVO = netRes.content;
        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (e) {
        // 错误已由拦截器提示
      }
    },
    getLineChartOption(data, labels) {
      const first = data[labels[0]];
      return {
        tooltip: { trigger: "axis" },
        legend: { data: labels },
        xAxis: {
          type: "category",
          data:
            (first &&
              first.metrics &&
              first.metrics.map((item) =>
                dayjs(item.time * 1000).format("YYYY-MM-DD HH:mm:ss")
              )) ||
            [],
        },
        yAxis: { type: "value" },
        series: labels.map((label) => ({
          name: label,
          data: (data[label] && data[label].metrics && data[label].metrics.map((m) => m.value)) || [],
          type: "line",
          smooth: true,
        })),
      };
    },
    renderChart(refName, data, labels) {
      const el = this.$refs[refName];
      if (!el) return;
      if (!this.charts[refName]) {
        this.charts[refName] = echarts.init(el);
      }
      this.charts[refName].setOption(this.getLineChartOption(data, labels));
    },
    renderCharts() {
      const cpu = this.cpuStatisticsVO || {};
      const mem = this.memoryStatisticsVO || {};
      const net = this.netStatisticsVO || {};
      const disk = this.diskStatisticsVO || {};
      this.renderChart("cpuChart", { CPU使用率: cpu.usage }, ["CPU使用率"]);
      this.renderChart(
        "memoryChart",
        { 内存使用率: mem.usage, 内存使用量: mem.size },
        ["内存使用率", "内存使用量"]
      );
      this.renderChart(
        "netChart",
        {
          上行速率: net.sentSpeed,
          下行速率: net.recvSpeed,
          上行包数: net.sentPacket,
          下行包数: net.recvPacket,
        },
        ["上行速率", "下行速率", "上行包数", "下行包数"]
      );
      this.renderChart(
        "diskChart",
        {
          硬盘读速度: disk.readSpeed,
          硬盘写速度: disk.writeSpeed,
          硬盘读次数: disk.readCount,
          硬盘写次数: disk.writeCount,
          使用时间: disk.usageTime,
        },
        ["硬盘写速度", "硬盘读速度", "硬盘读次数", "硬盘写次数", "使用时间"]
      );
    },
  },
};
</script>

<style lang="less" scoped>
.top-progress-table {
  width: 100%;
  padding: 0 16px 16px;

  .block {
    margin-bottom: 16px;
  }

  .chart {
    height: 400px;
    width: 100%;
  }

  .statistic {
    .statistic-title {
      font-size: 13px;
      color: #909399;
    }

    .statistic-value {
      font-size: 22px;
    }
  }
}
</style>
