<template>
  <screen-page v-loading="loading" title="自愈修复" gap="8px" class="remediation-page">
    <template #header-extra>
      <div class="ctrl-row">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog">新增规则</el-button>
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="refreshAll">刷新</el-button>
      </div>
    </template>

    <div class="tab-body">
      <!-- 自愈规则表 -->
      <section-card
        dense
        scrollable
        body-class="dense-table fill"
        class="fill"
        title="自愈规则"
        icon="el-icon-magic-stick"
      >
        <template #extra>共 {{ rules.length }} 条</template>
        <el-table class="dense-table" height="100%" :data="rules" size="small" stripe>
          <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
          <el-table-column label="设备类型" width="110">
            <template slot-scope="{ row }">
              <el-tag size="small" type="info" effect="plain">{{ typeLabel(row.deviceType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="metricKey" label="指标" min-width="110" show-overflow-tooltip />
          <el-table-column label="级别" width="90">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="levelTagType(row.alertLevel)" effect="dark">
                {{ levelText(row.alertLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="动作类型" width="110">
            <template slot-scope="{ row }">
              <el-tag size="small" type="primary" effect="plain">{{ row.actionType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="actionTarget" label="动作目标" min-width="160" show-overflow-tooltip />
          <el-table-column label="冷却秒" width="90">
            <template slot-scope="{ row }">{{ num(row.cooldownSec) }}</template>
          </el-table-column>
          <el-table-column label="触发次数" width="90">
            <template slot-scope="{ row }">{{ num(row.fireCount) }}</template>
          </el-table-column>
          <el-table-column label="启用" width="70">
            <template slot-scope="{ row }">
              <el-switch v-model="row.enabled" @change="onToggle(row, $event)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template slot-scope="{ row }">
              <el-button type="text" size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button type="text" size="small" class="btn-danger" @click="onDelete(row)">删除</el-button>
            </template>
          </el-table-column>
          <template slot="empty">
            <el-empty description="暂无自愈规则" :image-size="60" />
          </template>
        </el-table>
      </section-card>

      <!-- 执行历史 -->
      <section-card
        dense
        scrollable
        body-class="dense-table fill"
        class="fill"
        title="执行历史"
        icon="el-icon-time"
      >
        <template #extra>最近 {{ history.length }} 条</template>
        <el-table class="dense-table" height="100%" :data="history" size="small" stripe>
          <el-table-column prop="gmtCreate" label="时间" width="170" />
          <el-table-column prop="deviceName" label="设备" min-width="120" show-overflow-tooltip />
          <el-table-column label="动作类型" width="110">
            <template slot-scope="{ row }">
              <el-tag size="small" type="primary" effect="plain">{{ row.taskType || "-" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="结果" width="90">
            <template slot-scope="{ row }">
              <el-tag size="small" :type="resultType(row.result)" effect="dark">
                {{ resultText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="说明" min-width="200" show-overflow-tooltip />
          <template slot="empty">
            <el-empty description="暂无执行历史" :image-size="60" />
          </template>
        </el-table>
      </section-card>
    </div>

    <!-- 新增/编辑规则弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑自愈规则' : '新增自愈规则'"
      :visible.sync="dialogVisible"
      width="600px"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" size="small">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="规则名称" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="设备类型">
              <el-select v-model="form.deviceType" placeholder="请选择" class="full-width">
                <el-option label="服务器" value="SERVER" />
                <el-option label="Redis" value="REDIS" />
                <el-option label="数据库" value="DATABASE" />
                <el-option label="容器" value="K8S" />
                <el-option label="消息队列" value="MQ" />
                <el-option label="负载均衡" value="LB" />
                <el-option label="存储" value="STORAGE" />
                <el-option label="网络设备" value="NETDEV" />
                <el-option label="GPU" value="GPU" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指标键">
              <el-input v-model="form.metricKey" placeholder="如 cpuUsage" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="告警级别">
              <el-select v-model="form.alertLevel" placeholder="请选择" class="full-width">
                <el-option label="警告" value="warning" />
                <el-option label="严重" value="critical" />
                <el-option label="任意" value="any" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="动作类型" prop="actionType">
              <el-select v-model="form.actionType" placeholder="请选择" class="full-width">
                <el-option label="Webhook" value="WEBHOOK" />
                <el-option label="通知" value="NOTIFY" />
                <el-option label="派单" value="DISPATCH" />
                <el-option label="脚本" value="SCRIPT" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="动作目标" prop="actionTarget">
          <el-input v-model="form.actionTarget" placeholder="如 Webhook URL / 脚本名 / 接收人" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="冷却(秒)">
              <el-input-number v-model="form.cooldownSec" :min="0" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button size="small" @click="dialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import {
  getRemediationRules,
  addRemediationRule,
  updateRemediationRule,
  deleteRemediationRule,
  toggleRemediationRule,
  getRemediationHistory,
} from "@/api/monitor-ops";

const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息队列",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
};

function emptyForm() {
  return {
    id: null,
    name: "",
    deviceType: "SERVER",
    metricKey: "",
    alertLevel: "warning",
    actionType: "WEBHOOK",
    actionTarget: "",
    cooldownSec: 300,
    enabled: true,
  };
}

export default {
  name: "MonitorRemediation",
  components: { ScreenPage, SectionCard },
  data() {
    return {
      loading: false,
      rules: [],
      history: [],
      dialogVisible: false,
      isEdit: false,
      saving: false,
      form: emptyForm(),
      formRules: {
        name: [{ required: true, message: "请输入名称", trigger: "blur" }],
        actionType: [{ required: true, message: "请选择动作类型", trigger: "change" }],
        actionTarget: [{ required: true, message: "请输入动作目标", trigger: "blur" }],
      },
    };
  },
  mounted() {
    this.refreshAll();
  },
  methods: {
    typeLabel(t) {
      return TYPE_LABEL[t] || t || "-";
    },
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    levelTagType(l) {
      if (l === "critical") return "danger";
      if (l === "warning") return "warning";
      return "info";
    },
    levelText(l) {
      if (l === "critical") return "严重";
      if (l === "warning") return "警告";
      if (l === "any") return "任意";
      return l || "-";
    },
    resultType(r) {
      const k = String(r || "").toUpperCase();
      if (k === "SUCCESS" || k === "OK") return "success";
      if (k === "FAIL" || k === "FAILED" || k === "ERROR") return "danger";
      return "info";
    },
    resultText(r) {
      const k = String(r || "").toUpperCase();
      if (k === "SUCCESS" || k === "OK") return "成功";
      if (k === "FAIL" || k === "FAILED" || k === "ERROR") return "失败";
      return r || "-";
    },
    refreshAll() {
      this.loadRules();
      this.loadHistory();
    },
    async loadRules() {
      this.loading = true;
      try {
        const res = await getRemediationRules();
        this.rules = res.content || [];
      } finally {
        this.loading = false;
      }
    },
    async loadHistory() {
      try {
        const res = await getRemediationHistory(50);
        this.history = res.content || [];
      } catch (e) {
        // 静默
      }
    },
    async onToggle(row, val) {
      try {
        await toggleRemediationRule(row.id, val);
        this.$message.success(val ? "已启用" : "已停用");
      } catch (e) {
        row.enabled = !val;
        this.$message.error("操作失败");
      }
    },
    openAddDialog() {
      this.isEdit = false;
      this.form = emptyForm();
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate();
      });
    },
    openEditDialog(row) {
      this.isEdit = true;
      this.form = Object.assign(emptyForm(), row);
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef && this.$refs.formRef.clearValidate();
      });
    },
    submitForm() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return;
        this.saving = true;
        try {
          const payload = Object.assign({}, this.form);
          if (this.isEdit) {
            await updateRemediationRule(payload);
            this.$message.success("更新成功");
          } else {
            delete payload.id;
            await addRemediationRule(payload);
            this.$message.success("新增成功");
          }
          this.dialogVisible = false;
          this.loadRules();
        } catch (e) {
          this.$message.error("保存失败");
        } finally {
          this.saving = false;
        }
      });
    },
    onDelete(row) {
      this.$confirm(`确认删除规则「${row.name}」？`, "提示", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      })
        .then(async () => {
          try {
            await deleteRemediationRule(row.id);
            this.$message.success("删除成功");
            this.loadRules();
          } catch (e) {
            this.$message.error("删除失败");
          }
        })
        .catch(() => {});
    },
  },
};
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.ctrl-row {
  display: flex;
  align-items: center;
  gap: @space-sm;
}
.tab-body {
  display: flex;
  gap: @space-sm;
  height: 100%;
  min-height: 0;
  flex: 1;

  > .section-card {
    flex: 1;
    min-width: 0;
  }
}
.btn-danger {
  color: #f56c6c;
}
.full-width {
  width: 100%;
}
</style>
