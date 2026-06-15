<template>
  <div v-loading="loading" class="tab-pane">
    <el-row :gutter="12" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Sunny" label="SoC温度" :value="`${num(d.socTemp)}°C`"
          :color="tempColor(d.socTemp)" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="WindPower" label="风扇转速" :value="`${d.fanRpm ?? '-'} rpm`"
          :sub="`占空比 ${d.fanDutyPct ?? '-'}%`" color="#409eff" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Lightning" label="供电" :value="`${num(d.supplyVoltage)} V`"
          :sub="`${num(d.supplyCurrent)} A · ${num(d.powerWatt)} W`" :color="powerColor" />
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <StatCard icon="Warning" label="电源状态"
          :value="statusText" :color="statusCardColor" />
      </el-col>
    </el-row>

    <SectionCard title="电源/限频状态" icon="Cpu">
      <div class="tag-row">
        <el-tag :type="d.underVoltage ? 'danger' : 'success'" effect="dark">
          欠压：{{ d.underVoltage ? "是" : "否" }}
        </el-tag>
        <el-tag :type="d.throttledNow ? 'warning' : 'success'" effect="dark">
          当前降频：{{ d.throttledNow ? "是" : "否" }}
        </el-tag>
        <el-tag :type="d.throttledEver ? 'warning' : 'info'" effect="plain">
          曾经降频：{{ d.throttledEver ? "是" : "否" }}
        </el-tag>
        <el-tag :type="d.freqCapped ? 'warning' : 'success'" effect="dark">
          限频：{{ d.freqCapped ? "是" : "否" }}
        </el-tag>
      </div>
    </SectionCard>

    <SectionCard title="板级操作" icon="Operation" class="action-card">
      <el-form inline class="action-form" @submit.prevent>
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
            <template #reference>
              <el-button type="danger" size="small" :loading="acting">执行</el-button>
            </template>
          </el-popconfirm>
          <el-button v-else type="primary" size="small" :loading="acting" @click="onAction">执行</el-button>
        </el-form-item>
      </el-form>
    </SectionCard>

    <SectionCard title="下发历史" icon="Tickets">
      <template #extra>共 {{ history.length }} 条</template>
      <el-empty v-if="!history.length" description="暂无下发记录" />
      <el-table v-else :data="history" size="small" stripe>
        <el-table-column prop="taskType" label="任务类型" min-width="120">
          <template #default="{ row }">{{ row.taskType || "-" }}</template>
        </el-table-column>
        <el-table-column prop="scope" label="范围" min-width="140">
          <template #default="{ row }">{{ row.scope || "-" }}</template>
        </el-table-column>
        <el-table-column label="来源" width="130" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === 'agent' ? 'success' : 'info'">
              {{ row.source === "agent" ? "真实·agent" : "模拟·simulated" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="result" label="结果" min-width="120">
          <template #default="{ row }">{{ row.result || "-" }}</template>
        </el-table-column>
        <el-table-column label="影响" width="100" align="center">
          <template #default="{ row }">{{ row.affected ?? "-" }}</template>
        </el-table-column>
        <el-table-column prop="gmtCreate" label="时间" min-width="170">
          <template #default="{ row }">{{ row.gmtCreate || "-" }}</template>
        </el-table-column>
      </el-table>
    </SectionCard>

    <SectionCard title="热区传感器" icon="Sunny">
      <template #extra>共 {{ thermals.length }} 个热区</template>
      <el-empty v-if="!thermals.length" description="暂无数据" />
      <el-table v-else :data="thermals" size="small" stripe>
        <el-table-column prop="zone" label="热区" min-width="160">
          <template #default="{ row }">{{ row.zone || "-" }}</template>
        </el-table-column>
        <el-table-column label="温度" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: tempColor(row.temp), fontWeight: 600 }">
              {{ row.temp != null ? `${row.temp}°C` : "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="thermalTagType(row.status)" size="small">{{ row.status || "-" }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import StatCard from "@/components/monitor/StatCard.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { getSbcBoardSensors, dispatchBoardAction } from "@/api/monitor-sbc";
import { getDispatchHistory } from "@/api/monitor-dispatch";

const props = defineProps({
  deviceId: { type: String, default: "" },
  device: { type: Object, default: () => ({}) },
  refreshToken: { type: Number, default: 0 },
});

const loading = ref(false);
const data = ref({});
const d = computed(() => data.value || {});
const thermals = computed(() => d.value.thermals || []);

const acting = ref(false);
const action = reactive({ taskType: "reboot", payload: "" });
const history = ref([]);

const num = (v) => (v === undefined || v === null ? "-" : Number(v).toFixed(1));
const tempColor = (v) => {
  const n = Number(v) || 0;
  if (n >= 85) return "#f56c6c";
  if (n >= 75) return "#e6a23c";
  return "#409eff";
};
const powerColor = computed(() => (d.value.underVoltage ? "#f56c6c" : "#67c23a"));
const abnormal = computed(
  () => d.value.underVoltage || d.value.throttledNow || d.value.freqCapped
);
const statusText = computed(() => (abnormal.value ? "异常" : "正常"));
const statusCardColor = computed(() => (abnormal.value ? "#f56c6c" : "#67c23a"));
const thermalTagType = (s) => {
  if (["normal", "OK", "正常"].includes(s)) return "success";
  if (["warning", "警告"].includes(s)) return "warning";
  if (["critical", "alert", "异常"].includes(s)) return "danger";
  return "info";
};

const load = async () => {
  if (!props.deviceId) return;
  loading.value = true;
  try {
    const res = await getSbcBoardSensors(props.deviceId);
    data.value = res.content || {};
  } finally {
    loading.value = false;
  }
};

const loadHistory = async () => {
  if (!props.deviceId) return;
  try {
    const res = await getDispatchHistory({ deviceId: props.deviceId, pageNo: 1, pageSize: 10 });
    history.value = res.content?.items || [];
  } catch (e) {
    history.value = [];
  }
};

const loadAll = () => {
  load();
  loadHistory();
};

const onAction = async () => {
  if (!props.deviceId) {
    ElMessage.warning("缺少设备ID，无法执行");
    return;
  }
  acting.value = true;
  try {
    const res = await dispatchBoardAction({
      deviceId: props.deviceId,
      taskType: action.taskType,
      payload: action.payload,
    });
    const c = res.content || {};
    if (c.source === "agent") {
      ElMessage.success("已真实执行");
    } else {
      ElMessage.success(`已受理(模拟)：${c.note || "-"}`);
    }
    await loadHistory();
  } finally {
    acting.value = false;
  }
};

watch(() => [props.deviceId, props.refreshToken], loadAll);
onMounted(loadAll);
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";
.stat-row {
  margin-bottom: 4px;
}
.stat-row .el-col {
  margin-bottom: 12px;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.action-card {
  margin-bottom: 12px;
}
.action-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}
</style>
