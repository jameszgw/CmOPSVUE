<template>
  <div class="page-container">
    <div class="monitor-config">
      <div class="monitor-config__head">
        <h1>监控开关</h1>
        <div class="monitor-config__note">
          这些开关运行时生效（个别项 remark 标注“重启生效”），优先级高于配置文件。
        </div>
      </div>

      <div v-loading="loading">
        <section-card
          v-for="g in groups"
          :key="g.name"
          :title="g.name"
          icon="el-icon-setting"
          class="monitor-config__group"
        >
          <div
            v-for="item in g.items"
            :key="item.key"
            class="config-item"
          >
            <div class="config-item__main">
              <span class="config-item__label">{{ item.label }}</span>
              <el-switch
                v-if="item.type === 'BOOL'"
                v-model="item.value"
                :disabled="saving[item.key]"
                @change="(val) => handleChange(item, val)"
              />
              <el-input-number
                v-else-if="item.type === 'INT'"
                v-model="item.value"
                :min="0"
                :disabled="saving[item.key]"
                size="small"
                controls-position="right"
                @change="(val) => handleChange(item, val)"
              />
            </div>
            <div v-if="item.remark" class="config-item__remark">{{ item.remark }}</div>
          </div>
        </section-card>

        <el-empty v-if="!loading && !groups.length" description="暂无配置项" />
      </div>
    </div>
  </div>
</template>

<script>
import SectionCard from "@/components/monitor/SectionCard.vue";
import { listMonitorConfig, updateMonitorConfig } from "@/api/monitor-config";

export default {
  name: "MonitorConfig",
  components: { SectionCard },
  data() {
    return {
      loading: false,
      saving: {},
      groups: [],
    };
  },
  created() {
    this.fetchList();
  },
  methods: {
    async fetchList() {
      this.loading = true;
      try {
        const res = await listMonitorConfig();
        const list = (res && res.content) || [];
        const map = {};
        const order = [];
        list.forEach((item) => {
          const group = item.group || "其他";
          if (!map[group]) {
            map[group] = [];
            order.push(group);
          }
          map[group].push({ ...item, __prev: item.value });
        });
        this.groups = order.map((name) => ({ name, items: map[name] }));
      } finally {
        this.loading = false;
      }
    },
    async handleChange(item, value) {
      const prev = item.__prev;
      this.$set(this.saving, item.key, true);
      try {
        const res = await updateMonitorConfig(item.key, value);
        this.$message.success((res && res.msg) || "已保存");
        item.__prev = value;
      } catch (e) {
        // 失败回滚到上一次成功的值
        item.value = prev;
      } finally {
        this.$set(this.saving, item.key, false);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.monitor-config {
  padding: 16px;

  &__head {
    margin-bottom: 16px;

    h1 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 500;
      color: var(--cm-text-primary, rgba(0, 0, 0, 0.85));
    }
  }

  &__note {
    color: var(--cm-text-secondary, rgba(0, 0, 0, 0.45));
    font-size: 13px;
    line-height: 1.5;
  }

  &__group {
    height: auto;
  }
}

.config-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--cm-border-light, #f0f2f5);

  &:last-child {
    border-bottom: none;
  }

  &__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__label {
    font-size: 14px;
    color: var(--cm-text-primary, rgba(0, 0, 0, 0.85));
  }

  &__remark {
    margin-top: 4px;
    color: var(--cm-text-secondary, rgba(0, 0, 0, 0.45));
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
