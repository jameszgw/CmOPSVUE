<template>
  <div class="env-resource-panel">
    <el-tabs>
      <el-tab-pane label="副本数" name="replicas">
        <el-form label-width="100px" class="panel-form">
          <el-form-item label="副本数">
            <el-input
              v-model="replicasForm.replicas"
              type="number"
              :min="0"
              :max="10"
              style="width: 45%"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="scale">扩缩容</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="资源更新" name="resource">
        <el-form label-width="100px" class="panel-form">
          <el-form-item label="CPU">
            <el-input
              v-model="resourceForm.cpu"
              placeholder="最小CPU，毫核"
              style="width: 40%"
            >
              <template #suffix>M</template>
            </el-input>
            <span class="range-split">-</span>
            <el-input
              v-model="resourceForm.maxCpu"
              placeholder="最大CPU，毫核"
              style="width: 40%"
            >
              <template #suffix>M</template>
            </el-input>
          </el-form-item>
          <el-form-item label="Memory">
            <el-input
              v-model="resourceForm.memory"
              placeholder="最小内存"
              style="width: 40%"
            >
              <template #suffix>M</template>
            </el-input>
            <span class="range-split">-</span>
            <el-input
              v-model="resourceForm.maxMemory"
              placeholder="最大内存"
              style="width: 40%"
            >
              <template #suffix>M</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="modifyAppResources">更新资源配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { scale as scaleApi, modifyAppEnvResource } from "@/api/app";

const props = defineProps({
  resourceStrategy: { type: Object, default: null },
  selectedEnvironment: { type: String, default: null },
});

const replicasForm = reactive({ replicas: "" });
const resourceForm = reactive({ cpu: "", maxCpu: "", memory: "", maxMemory: "" });

watch(
  () => props.resourceStrategy,
  (strategy) => {
    if (strategy) {
      replicasForm.replicas = strategy.replicas;
      resourceForm.cpu = strategy.cpu;
      resourceForm.maxCpu = strategy.maxCpu;
      resourceForm.memory = strategy.memory;
      resourceForm.maxMemory = strategy.maxMemory;
    }
  },
  { immediate: true }
);

const scale = async () => {
  if (Number(replicasForm.replicas) > 10) {
    ElMessage.error("副本数不得超过10");
    return;
  }
  await scaleApi({
    envId: props.selectedEnvironment,
    replicas: Number(replicasForm.replicas),
  });
  ElMessage.success("更新成功");
  window.location.reload();
};

const modifyAppResources = async () => {
  await modifyAppEnvResource({
    envId: props.selectedEnvironment,
    resourceStrategyDTO: { ...resourceForm },
  });
  ElMessage.success("更新成功");
  window.location.reload();
};
</script>

<style lang="less" scoped>
.env-resource-panel {
  .panel-form {
    max-width: 600px;
    margin-bottom: 16px;
  }
  .range-split {
    display: inline-flex;
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
  }
}
</style>
