<template>
  <screen-page v-loading="loading" title="监控开关" gap="8px" class="monitor-config">
    <template #header-extra>
      <span class="monitor-config__note">
        这些开关运行时生效（个别项 remark 标注“重启生效”），优先级高于配置文件。
      </span>
    </template>

    <div class="monitor-config__scroll">
      <card-grid min="300px" gap="8px">
        <section-card
          v-for="g in groups"
          :key="g.name"
          dense
          :title="g.name"
          icon="el-icon-setting"
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
                style="width: 120px"
                @change="(val) => handleChange(item, val)"
              />
            </div>
            <div v-if="item.remark" class="config-item__remark">{{ item.remark }}</div>
          </div>
        </section-card>
      </card-grid>

      <el-empty v-if="!loading && !groups.length" description="暂无配置项" />
    </div>
  </screen-page>
</template>

<script>
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import { listMonitorConfig, updateMonitorConfig } from "@/api/monitor-config";

export default {
  name: "MonitorConfig",
  components: { ScreenPage, CardGrid, SectionCard },
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
@import (reference) "@/styles/variables.less";

.monitor-config {
  &__note {
    color: var(--cm-text-secondary, @text-secondary);
    font-size: 12px;
    line-height: 1.4;
  }

  // 卡片不强行拉满，置顶紧凑排布；分组多时整体内部滚动而非整页滚动
  &__scroll {
    overflow: auto;
    flex-shrink: 0;
    max-height: 100%;
  }
}

.config-item {
  padding: @space-xs 0;
  border-bottom: 1px dashed var(--cm-border-light, @border-light);

  &:last-child {
    border-bottom: none;
  }

  &__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: @space-md;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--cm-text-primary, @text-primary);
  }

  &__remark {
    margin-top: 2px;
    color: var(--cm-text-secondary, @text-secondary);
    font-size: 12px;
    line-height: 1.3;
  }
}
</style>
