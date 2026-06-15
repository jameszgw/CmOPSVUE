<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-sunny" label="SoC 温度"
          :value="`${num0(d.socTemp)}℃`" :sub="`CPU ${num0(d.cpuTemp)}℃ / GPU ${num0(d.gpuTemp)}℃`" color="#f56c6c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-wind-power" label="风扇转速"
          :value="`${num0(d.fanRpm)} RPM`" :sub="`占空比 ${num0(d.fanDutyPct)}%`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-lightning" label="供电"
          :value="`${num2(d.supplyVoltage)} V`" :sub="`${num2(d.supplyCurrent)} A`" color="#e6a23c" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="el-icon-odometer" label="整机功耗"
          :value="`${num1(d.powerWatt)} W`" sub="实时功耗" color="#67c23a" />
      </el-col>
    </el-row>

    <SectionCard title="板级操作" icon="el-icon-set-up" class="action-card">
      <el-form inline class="action-form" @submit.native.prevent>
        <el-form-item label="操作类型">
          <el-select v-model="action.taskType" size="small" style="width: 150px">
            <el-option label="重启" value="reboot" />
            <el-option label="GPIO 控制" value="gpio-set" />
            <el-option label="LED" value="led" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="action.taskType === 'gpio-set'" label="参数">
          <el-input v-model="action.payload" size="small" style="width: 220px"
            placeholder="BCM引脚=电平, 如 17=1" />
        </el-form-item>
        <el-form-item v-else-if="action.taskType === 'led'" label="参数">
          <el-input v-model="action.payload" size="small" style="width: 220px"
            placeholder="on / off" />
        </el-form-item>
        <el-form-item>
          <el-popconfirm v-if="action.taskType === 'reboot'" title="确认重启该单板机？"
            confirm-button-text="确认" cancel-button-text="取消" @confirm="onAction">
            <el-button slot="reference" type="danger" size="small" :loading="acting">执行</el-button>
          </el-popconfirm>
          <el-button v-else type="primary" size="small" :loading="acting" @click="onAction">执行</el-button>
        </el-form-item>
      </el-form>
    </SectionCard>

    <SectionCard title="下发历史" icon="el-icon-tickets">
      <template #extra>共 {{ history.length }} 条</template>
      <el-table :data="history" size="small" stripe>
        <el-table-column prop="taskType" label="任务类型" min-width="120">
          <template slot-scope="{ row }">{{ val(row.taskType) }}</template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" min-width="140">
          <template slot-scope="{ row }">{{ val(row.scope) }}</template>
        </el-table-column>
        <el-table-column label="来源" width="130" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="row.source === 'agent' ? 'success' : 'info'">
              {{ row.source === "agent" ? "真实·agent" : "模拟·simulated" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="结果" min-width="120">
          <template slot-scope="{ row }">{{ val(row.result) }}</template>
        </el-table-column>
        <el-table-column label="影响" width="100" align="center">
          <template slot-scope="{ row }">{{ num0(row.affected) }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="时间" min-width="160">
          <template slot-scope="{ row }">{{ val(row.gmtCreate) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!history.length" description="暂无下发记录" />
    </SectionCard>

    <el-row :gutter="12">
      <el-col :xs="24" :lg="14">
        <SectionCard title="热区状态" icon="el-icon-sunny">
          <template #extra>共 {{ thermals.length }} 个热区</template>
          <el-table :data="thermals" size="small" stripe>
            <el-table-column prop="zone" label="热区" min-width="160" />
            <el-table-column label="温度" width="120" align="center">
              <template slot-scope="{ row }">{{ num1(row.temp) }} ℃</template>
            </el-table-column>
            <el-table-column label="状态" width="120" align="center">
              <template slot-scope="{ row }">
                <el-tag size="mini" :type="zoneTag(row.status)" effect="dark">{{ val(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!thermals.length" description="暂无热区数据" />
        </SectionCard>
      </el-col>
      <el-col :xs="24" :lg="10">
        <SectionCard title="风扇与供电" icon="el-icon-wind-power">
          <InfoTable :rows="fanRows" />
          <div class="flag-grid">
            <div class="flag-grid__item">
              <span class="flag-grid__label">当前欠压</span>
              <el-tag size="small" :type="d.underVoltage ? 'danger' : 'success'">
                {{ d.underVoltage ? "是" : "否" }}
              </el-tag>
            </div>
            <div class="flag-grid__item">
              <span class="flag-grid__label">当前降频</span>
              <el-tag size="small" :type="d.throttledNow ? 'warning' : 'success'">
                {{ d.throttledNow ? "是" : "否" }}
              </el-tag>
            </div>
            <div class="flag-grid__item">
              <span class="flag-grid__label">历史降频</span>
              <el-tag size="small" :type="d.throttledEver ? 'warning' : 'success'">
                {{ d.throttledEver ? "是" : "否" }}
              </el-tag>
            </div>
            <div class="flag-grid__item">
              <span class="flag-grid__label">频率受限</span>
              <el-tag size="small" :type="d.freqCapped ? 'warning' : 'success'">
                {{ d.freqCapped ? "是" : "否" }}
              </el-tag>
            </div>
          </div>
        </SectionCard>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import InfoTable from "@/components/monitor/InfoTable.vue";
import { getSbcBoardSensors, dispatchBoardAction } from "@/api/monitor-sbc";
import { getDispatchHistory } from "@/api/monitor-dispatch";

const ZONE_TAG = {
  Normal: "success", OK: "success", Healthy: "success",
  Warning: "warning", High: "warning",
  Critical: "danger", Hot: "danger",
};

export default {
  name: "SbcBoardSensors",
  components: { StatCard, SectionCard, InfoTable },
  props: {
    deviceId: { type: String, default: "" },
    device: { type: Object, default: () => ({}) },
    refreshToken: { type: Number, default: 0 },
  },
  data() {
    return {
      loading: false,
      d: {},
      acting: false,
      action: { taskType: "reboot", payload: "" },
      history: [],
    };
  },
  computed: {
    thermals() {
      return this.d.thermals || [];
    },
    fanRows() {
      const d = this.d;
      return [
        { label: "风扇转速", value: d.fanRpm == null ? "-" : `${this.num0(d.fanRpm)} RPM`, color: "#409eff" },
        { label: "风扇占空比", value: d.fanDutyPct == null ? "-" : `${this.num0(d.fanDutyPct)} %`, color: "#e6a23c" },
        { label: "供电电压", value: d.supplyVoltage == null ? "-" : `${this.num2(d.supplyVoltage)} V`, color: "#67c23a" },
        { label: "供电电流", value: d.supplyCurrent == null ? "-" : `${this.num2(d.supplyCurrent)} A`, color: "#409eff" },
        { label: "整机功耗", value: d.powerWatt == null ? "-" : `${this.num1(d.powerWatt)} W`, color: "#f56c6c" },
      ];
    },
  },
  watch: {
    deviceId() {
      this.loadAll();
    },
    refreshToken() {
      this.loadAll();
    },
  },
  mounted() {
    this.loadAll();
  },
  methods: {
    val(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    num0(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(0);
    },
    num1(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(1);
    },
    num2(v) {
      return v === undefined || v === null ? "-" : Number(v).toFixed(2);
    },
    zoneTag(s) {
      return ZONE_TAG[s] || "info";
    },
    loadAll() {
      this.load();
      this.loadHistory();
    },
    async load() {
      if (!this.deviceId) return;
      this.loading = true;
      try {
        const res = await getSbcBoardSensors(this.deviceId);
        this.d = res.content || {};
      } finally {
        this.loading = false;
      }
    },
    async loadHistory() {
      if (!this.deviceId) return;
      try {
        const res = await getDispatchHistory({ deviceId: this.deviceId, pageNo: 1, pageSize: 10 });
        this.history = (res && res.content && res.content.items) || [];
      } catch (e) {
        this.history = [];
      }
    },
    async onAction() {
      if (!this.deviceId) {
        this.$message.warning("缺少设备ID，无法执行");
        return;
      }
      this.acting = true;
      try {
        const res = await dispatchBoardAction({
          deviceId: this.deviceId,
          taskType: this.action.taskType,
          payload: this.action.payload,
        });
        const c = (res && res.content) || {};
        if (c.source === "agent") {
          this.$message.success("已真实执行");
        } else {
          this.$message.success(`已受理(模拟)：${c.note || "-"}`);
        }
        await this.loadHistory();
      } finally {
        this.acting = false;
      }
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.action-card {
  margin-bottom: 12px;
}
.action-form ::v-deep .el-form-item {
  margin-bottom: 0;
}
.flag-grid {
  display: flex;
  flex-wrap: wrap;
  margin-top: 12px;
  &__item {
    width: 50%;
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  &__label {
    width: 72px;
    font-size: 13px;
    color: var(--cm-text-regular, @text-regular);
  }
}
</style>
