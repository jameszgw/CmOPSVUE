<template>
  <div class="left-host-list">
    <el-input
      v-model="searchText"
      placeholder="搜索主机名称"
      prefix-icon="el-icon-search"
      clearable
      style="margin-bottom: 16px"
      @input="handleSearch"
    />
    <div class="host-items">
      <div
        v-for="host in items"
        :key="host.hostId"
        :class="['host-item', host.hostId === selectedHostId ? 'is-selected' : '']"
        @click="handleItemClick(host)"
      >
        <div class="host-item-title">{{ host.name }}</div>
        <div class="host-item-desc">IP:{{ host.serverAddr }}</div>
      </div>
    </div>
    <el-pagination
      small
      layout="prev, pager, next"
      :total="total"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script>
import { fetchHosts } from "@/api/host";

export default {
  name: "LeftHostList",
  data() {
    return {
      searchText: "",
      pagination: { pageNo: 1, pageSize: 10 },
      selectedHostId: "",
      items: [],
      total: 0,
    };
  },
  created() {
    this.fetchHosts(true);
  },
  methods: {
    async fetchHosts(selectFirst) {
      const res = await fetchHosts({
        pageNo: this.pagination.pageNo,
        pageSize: this.pagination.pageSize,
        name: this.searchText,
      });
      const page = res.content || {};
      this.items = page.items || [];
      this.total = page.total || 0;
      if (selectFirst && this.items.length > 0) {
        this.selectedHostId = this.items[0].hostId;
        this.$emit("item-click", this.items[0].hostId);
      }
    },
    handleSearch() {
      this.pagination = { pageNo: 1, pageSize: 10 };
      this.fetchHosts(false);
    },
    handlePageChange(page) {
      this.pagination.pageNo = page;
      this.fetchHosts(false);
    },
    handleItemClick(host) {
      this.selectedHostId = host.hostId;
      // 调用父组件传递的点击事件处理函数
      this.$emit("item-click", host.hostId);
    },
  },
};
</script>

<style lang="less" scoped>
.left-host-list {
  width: 100%;
}

.host-item {
  padding: 10px 12px;
  border-bottom: 1px solid var(--cm-border-light);
  cursor: pointer;

  &:hover {
    background-color: var(--cm-bg-soft);
  }

  &.is-selected {
    background-color: var(--cm-border-lighter);
  }

  .host-item-title {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .host-item-desc {
    font-size: 12px;
    color: var(--cm-text-secondary);
  }
}
</style>
