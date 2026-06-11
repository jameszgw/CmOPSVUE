<template>
  <el-form :model="form" label-width="140px" label-position="left" @submit.prevent>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="CPU报警配置" name="cpu">
        <el-form-item>
          <template #label>
            <span>
              报警阈值百分比
              <el-tooltip content="配置CPU使用率报警阈值">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="form.cpuThreshold">
            <template #append>%</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              通知阈值
              <el-tooltip content="CPU使用率连续达到报警阈值N次时则会通知报警联系组">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="form.cpuNotificationThreshold">
            <template #append>次</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              沉默时间
              <el-tooltip content="触发通知后的N分钟内, 再次达到报警阈值则不会触发通知">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="form.cpuSilenceTime">
            <template #append>分钟</template>
          </el-input>
        </el-form-item>
      </el-tab-pane>

      <el-tab-pane label="内存使用率配置" name="memory">
        <el-form-item>
          <template #label>
            <span>
              报警阈值百分比
              <el-tooltip content="设置内存使用率达到多少时触发报警">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="form.memoryThreshold">
            <template #append>%</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              通知阈值
              <el-tooltip content="内存使用率连续达到报警阈值N次时则会通知报警联系组">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="form.memoryNotificationThreshold">
            <template #append>次</template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>
              沉默时间
              <el-tooltip content="触发通知后的N分钟内, 再次达到报警阈值则不会触发通知">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input v-model="form.memorySilenceTime">
            <template #append>分钟</template>
          </el-input>
        </el-form-item>
      </el-tab-pane>

      <el-tab-pane label="报警联系组配置" name="alertGroupIds">
        <el-form-item label="报警联系组">
          <el-select
            v-model="form.alertGroupIds"
            multiple
            placeholder="请选择报警联系组"
            style="width: 100%"
          >
            <el-option
              v-for="alarmGroup in alarmGroups"
              :key="alarmGroup.id"
              :value="alarmGroup.id"
              :label="alarmGroup.groupName"
            />
          </el-select>
        </el-form-item>
      </el-tab-pane>
    </el-tabs>

    <el-form-item>
      <el-button type="primary" @click="emit('submit', { ...form })">保存</el-button>
      <el-button @click="emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch } from "vue";

const props = defineProps({
  initialValues: {
    type: Object,
    default: null,
  },
  alarmGroups: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["submit", "cancel"]);

const activeTab = ref("cpu");

const form = reactive({
  cpuThreshold: undefined,
  cpuNotificationThreshold: undefined,
  cpuSilenceTime: undefined,
  memoryThreshold: undefined,
  memoryNotificationThreshold: undefined,
  memorySilenceTime: undefined,
  alertGroupIds: [],
});

watch(
  () => props.initialValues,
  (val) => {
    const cpu = val?.alarmConfigList?.[0];
    const memory = val?.alarmConfigList?.[1];
    form.cpuThreshold = cpu ? cpu.alarmThreshold * 100 : undefined;
    form.cpuNotificationThreshold = cpu?.triggerThreshold;
    form.cpuSilenceTime = cpu?.notifySilence;
    form.memoryThreshold = memory ? memory.alarmThreshold * 100 : undefined;
    form.memoryNotificationThreshold = memory?.triggerThreshold;
    form.memorySilenceTime = memory?.notifySilence;
    form.alertGroupIds = (val?.alarmGroupList || []).map((group) => group.alarmGroupId);
  },
  { immediate: true }
);
</script>
