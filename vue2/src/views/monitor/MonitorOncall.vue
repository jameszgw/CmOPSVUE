<template>
  <screen-page v-loading="loading" title="值班排班" gap="8px" class="oncall-page">
    <template #header-extra>
      <div class="ctrl-row">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openAddDialog">新增排班</el-button>
        <el-button size="small" icon="el-icon-refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </template>

    <!-- 当前值班 -->
    <section-card dense body-class="cur-body" title="当前值班" icon="el-icon-user-solid">
      <template #extra>共 {{ current.length }} 个班表</template>
      <el-empty v-if="!current.length" description="暂无值班信息" :image-size="60" />
      <card-grid v-else min="220px" gap="8px">
        <stat-card
          v-for="c in current"
          :key="c.rosterId"
          dense
          icon="el-icon-user"
          :label="c.rosterName"
          :value="c.onCall || '-'"
          :tag="`${(Number(c.memberIndex) || 0) + 1}/${num(c.memberCount)}`"
          :sub="`下次轮转 ${c.nextRotateTime || '-'}`"
          color="#409eff"
        />
      </card-grid>
    </section-card>

    <!-- 排班表 -->
    <section-card
      dense
      scrollable
      body-class="dense-table fill"
      class="fill"
      title="排班列表"
      icon="el-icon-date"
    >
      <template #extra>共 {{ rosters.length }} 个</template>
      <el-table class="dense-table" height="100%" :data="rosters" size="small" stripe>
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="成员" min-width="200" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ memberText(row.members) }}</template>
        </el-table-column>
        <el-table-column label="轮转周期" width="150">
          <template slot-scope="{ row }">
            {{ num(row.rotationHours) }} 小时
            <el-tag v-if="rotateHint(row.rotationHours)" size="small" type="info"
              effect="plain" class="hint-tag">{{ rotateHint(row.rotationHours) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="70">
          <template slot-scope="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row, $event)" />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.remark || "-" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button type="text" size="small" class="btn-danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template slot="empty">
          <el-empty description="暂无排班" :image-size="60" />
        </template>
      </el-table>
    </section-card>

    <!-- 新增/编辑排班弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑排班' : '新增排班'"
      :visible.sync="dialogVisible"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" size="small">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="排班名称" />
        </el-form-item>
        <el-form-item label="成员" prop="members">
          <el-input v-model="form.members" placeholder="成员姓名，逗号分隔，如 张三,李四,王五" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="轮转周期(小时)">
              <el-input-number v-model="form.rotationHours" :min="1" :controls="false" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用">
              <el-switch v-model="form.enabled" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注（可选）" />
        </el-form-item>
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
import CardGrid from "@/components/monitor/CardGrid.vue";
import StatCard from "@/components/monitor/StatCard.vue";
import {
  getOncallRosters,
  getOncallCurrent,
  addOncallRoster,
  updateOncallRoster,
  deleteOncallRoster,
  toggleOncallRoster,
} from "@/api/monitor-ops";

function emptyForm() {
  return {
    id: null,
    name: "",
    members: "",
    rotationHours: 24,
    remark: "",
    enabled: true,
  };
}

export default {
  name: "MonitorOncall",
  components: { ScreenPage, SectionCard, CardGrid, StatCard },
  data() {
    return {
      loading: false,
      rosters: [],
      current: [],
      dialogVisible: false,
      isEdit: false,
      saving: false,
      form: emptyForm(),
      formRules: {
        name: [{ required: true, message: "请输入名称", trigger: "blur" }],
        members: [{ required: true, message: "请输入成员", trigger: "blur" }],
      },
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    num(v) {
      return v === undefined || v === null || v === "" ? "-" : v;
    },
    memberText(m) {
      if (Array.isArray(m)) return m.join(", ") || "-";
      if (!m) return "-";
      return (
        String(m)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .join(", ") || "-"
      );
    },
    rotateHint(h) {
      const n = Number(h);
      if (n === 24) return "每日";
      if (n === 168) return "每周";
      return "";
    },
    async load() {
      this.loading = true;
      try {
        const [rosterRes, curRes] = await Promise.all([
          getOncallRosters(),
          getOncallCurrent(),
        ]);
        this.rosters = rosterRes.content || [];
        this.current = curRes.content || [];
      } finally {
        this.loading = false;
      }
    },
    async onToggle(row, val) {
      try {
        await toggleOncallRoster(row.id, val);
        this.$message.success(val ? "已启用" : "已停用");
        this.load();
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
      const f = Object.assign(emptyForm(), row);
      if (Array.isArray(row.members)) f.members = row.members.join(",");
      this.form = f;
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
            await updateOncallRoster(payload);
            this.$message.success("更新成功");
          } else {
            delete payload.id;
            await addOncallRoster(payload);
            this.$message.success("新增成功");
          }
          this.dialogVisible = false;
          this.load();
        } catch (e) {
          this.$message.error("保存失败");
        } finally {
          this.saving = false;
        }
      });
    },
    onDelete(row) {
      this.$confirm(`确认删除排班「${row.name}」？`, "提示", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      })
        .then(async () => {
          try {
            await deleteOncallRoster(row.id);
            this.$message.success("删除成功");
            this.load();
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
.hint-tag {
  margin-left: @space-xs;
}
.btn-danger {
  color: #f56c6c;
}
.full-width {
  width: 100%;
}
</style>
