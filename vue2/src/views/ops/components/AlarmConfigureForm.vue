<template>
  <el-form ref="form" :model="form" label-width="140px" label-position="left">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="CPU报警配置" name="cpu">
        <el-form-item prop="cpuThreshold">
          <template #label>
            <span>
              报警阈值百分比
              <el-tooltip content="配置CPU使用率报警阈值" placement="top">
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model.number="form.cpuThreshold">
            <template #append>%</template>
          </el-input>
          <div class="form-extra">配置CPU使用率报警阈值</div>
        </el-form-item>
        <el-form-item prop="cpuNotificationThreshold">
          <template #label>
            <span>
              通知阈值
              <el-tooltip content="CPU使用率连续达到报警阈值N次时则会通知报警联系组" placement="top">
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model.number="form.cpuNotificationThreshold">
            <template #append>次</template>
          </el-input>
          <div class="form-extra">CPU使用率连续达到报警阈值N次时则会通知报警联系组</div>
        </el-form-item>
        <el-form-item prop="cpuSilenceTime">
          <template #label>
            <span>
              沉默时间
              <el-tooltip content="触发通知后的N分钟内, 再次达到报警阈值则不会触发通知" placement="top">
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model.number="form.cpuSilenceTime">
            <template #append>分钟</template>
          </el-input>
          <div class="form-extra">触发通知后的N分钟内, 再次达到报警阈值则不会触发通知</div>
        </el-form-item>
      </el-tab-pane>

      <el-tab-pane label="内存使用率配置" name="memory">
        <el-form-item prop="memoryThreshold">
          <template #label>
            <span>
              报警阈值百分比
              <el-tooltip content="设置内存使用率达到多少时触发报警" placement="top">
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model.number="form.memoryThreshold">
            <template #append>%</template>
          </el-input>
          <div class="form-extra">设置内存使用率达到多少时触发报警</div>
        </el-form-item>
        <el-form-item prop="memoryNotificationThreshold">
          <template #label>
            <span>
              通知阈值
              <el-tooltip content="内存使用率连续达到报警阈值N次时则会通知报警联系组" placement="top">
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model.number="form.memoryNotificationThreshold">
            <template #append>次</template>
          </el-input>
          <div class="form-extra">内存使用率连续达到报警阈值N次时则会通知报警联系组</div>
        </el-form-item>
        <el-form-item prop="memorySilenceTime">
          <template #label>
            <span>
              沉默时间
              <el-tooltip content="触发通知后的N分钟内, 再次达到报警阈值则不会触发通知" placement="top">
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          </template>
          <el-input v-model.number="form.memorySilenceTime">
            <template #append>分钟</template>
          </el-input>
          <div class="form-extra">触发通知后的N分钟内, 再次达到报警阈值则不会触发通知</div>
        </el-form-item>
      </el-tab-pane>

      <el-tab-pane label="报警联系组配置" name="alertGroupIds">
        <el-form-item label="报警联系组" prop="alertGroupIds">
          <el-select
            v-model="form.alertGroupIds"
            multiple
            placeholder="请选择报警联系组"
            style="width: 100%"
          >
            <el-option
              v-for="alarmGroup in alarmGroups"
              :key="alarmGroup.id"
              :label="alarmGroup.groupName"
              :value="alarmGroup.id"
            />
          </el-select>
        </el-form-item>
      </el-tab-pane>
    </el-tabs>

    <el-form-item label-width="0">
      <el-button type="primary" @click="$emit('submit', { ...form })">保存</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: "AlarmConfigureForm",
  props: {
    initialValues: {
      type: Object,
      default: null,
    },
    alarmGroups: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      activeTab: "cpu",
      form: this.buildForm(),
    };
  },
  watch: {
    initialValues: {
      immediate: true,
      handler() {
        this.form = this.buildForm();
      },
    },
  },
  methods: {
    buildForm() {
      const init = this.initialValues || {};
      const configList = init.alarmConfigList || [];
      const cpu = configList[0] || {};
      const memory = configList[1] || {};
      return {
        cpuThreshold: cpu.alarmThreshold != null ? cpu.alarmThreshold * 100 : null, // CPU报警阈值百分比
        cpuNotificationThreshold: cpu.triggerThreshold, // CPU通知阈值
        cpuSilenceTime: cpu.notifySilence, // CPU沉默时间
        memoryThreshold: memory.alarmThreshold != null ? memory.alarmThreshold * 100 : null, // 内存报警阈值百分比
        memoryNotificationThreshold: memory.triggerThreshold, // 内存通知阈值
        memorySilenceTime: memory.notifySilence, // 内存沉默时间
        alertGroupIds: (init.alarmGroupList || []).map((group) => group.alarmGroupId), // 报警联系组
      };
    },
  },
};
</script>

<style lang="less" scoped>
.form-extra {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
