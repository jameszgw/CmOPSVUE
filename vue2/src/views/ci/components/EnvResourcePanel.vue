<template>
  <div class="env-resource-panel">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="副本数" name="replicas">
        <el-form
          :model="replicasForm"
          label-width="100px"
          style="max-width: 600px; margin-bottom: 16px"
        >
          <el-form-item label="副本数">
            <el-input
              v-model.number="replicasForm.replicas"
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
        <el-form
          :model="resourceForm"
          label-width="100px"
          style="max-width: 600px; margin-bottom: 16px"
        >
          <el-form-item label="CPU">
            <div class="range-row">
              <el-input v-model="resourceForm.cpu" placeholder="最小CPU，毫核">
                <template slot="suffix">M</template>
              </el-input>
              <span class="range-sep">-</span>
              <el-input v-model="resourceForm.maxCpu" placeholder="最大CPU，毫核">
                <template slot="suffix">M</template>
              </el-input>
            </div>
          </el-form-item>
          <el-form-item label="Memory">
            <div class="range-row">
              <el-input v-model="resourceForm.memory" placeholder="最小内存">
                <template slot="suffix">M</template>
              </el-input>
              <span class="range-sep">-</span>
              <el-input v-model="resourceForm.maxMemory" placeholder="最大内存">
                <template slot="suffix">M</template>
              </el-input>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="modifyAppResources">更新资源配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { scale, modifyAppEnvResource } from "@/api/app";

export default {
  name: "EnvResourcePanel",
  props: {
    resourceStrategy: { type: Object, default: null },
    selectedEnvironment: { type: [String, Number], default: null },
  },
  data() {
    return {
      activeTab: "replicas",
      replicasForm: { replicas: "" },
      resourceForm: { cpu: "", maxCpu: "", memory: "", maxMemory: "" },
    };
  },
  watch: {
    resourceStrategy: {
      immediate: true,
      handler(val) {
        if (val) {
          this.replicasForm = { replicas: val.replicas };
          this.resourceForm = {
            cpu: val.cpu,
            maxCpu: val.maxCpu,
            memory: val.memory,
            maxMemory: val.maxMemory,
          };
        }
      },
    },
  },
  methods: {
    async scale() {
      if (this.replicasForm.replicas === "" || this.replicasForm.replicas === null) {
        this.$message.error("请输入副本数");
        return;
      }
      if (this.replicasForm.replicas > 10) {
        this.$message.error("副本数不得超过10");
        return;
      }
      await scale({
        envId: this.selectedEnvironment,
        replicas: this.replicasForm.replicas,
      });
      this.$message.success("更新成功");
      this.$emit("updated");
    },
    async modifyAppResources() {
      await modifyAppEnvResource({
        envId: this.selectedEnvironment,
        resourceStrategyDTO: { ...this.resourceForm },
      });
      this.$message.success("更新成功");
      this.$emit("updated");
    },
  },
};
</script>

<style lang="less" scoped>
.range-row {
  display: flex;
  align-items: center;
  .el-input {
    width: 45%;
  }
  .range-sep {
    width: 30px;
    text-align: center;
  }
}
</style>
