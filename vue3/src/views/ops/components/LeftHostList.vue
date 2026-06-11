<template>
  <div class="left-host-list">
    <el-input
      v-model="searchText"
      placeholder="搜索主机名称"
      clearable
      class="search-input"
      @input="handleSearch"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <ul class="host-list">
      <li
        v-for="host in hosts.items"
        :key="host.hostId"
        class="host-item"
        :class="{ selected: host.hostId === selectedHostId }"
        @click="handleItemClick(host.hostId)"
      >
        <div class="host-name">{{ host.name }}</div>
        <div class="host-addr">IP:{{ host.serverAddr }}</div>
      </li>
      <li v-if="!hosts.items.length" class="empty">暂无数据</li>
    </ul>
    <el-pagination
      small
      layout="prev, pager, next"
      :total="hosts.total"
      :current-page="pagination.pageNo"
      :page-size="pagination.pageSize"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { fetchHosts } from "@/api/host";

const emit = defineEmits(["item-click"]);

const searchText = ref("");
const pagination = reactive({ pageNo: 1, pageSize: 10 });
const selectedHostId = ref("");
const hosts = reactive({ items: [], total: 0 });

const getHosts = async (selectFirst = false) => {
  const res = await fetchHosts({
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
    name: searchText.value,
  });
  hosts.items = res.content?.items || [];
  hosts.total = res.content?.total || 0;
  if (selectFirst && hosts.items.length > 0) {
    selectedHostId.value = hosts.items[0].hostId;
    emit("item-click", hosts.items[0].hostId);
  }
};

const handleSearch = () => {
  pagination.pageNo = 1;
  getHosts();
};

const handlePageChange = (page) => {
  pagination.pageNo = page;
  getHosts();
};

const handleItemClick = (hostId) => {
  selectedHostId.value = hostId;
  emit("item-click", hostId);
};

onMounted(() => {
  getHosts(true);
});
</script>

<style lang="less" scoped>
.left-host-list {
  .search-input {
    margin-bottom: 16px;
  }

  .host-list {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;

    .host-item {
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;

      &.selected {
        background-color: #f0f0f0;
      }

      .host-name {
        font-weight: 600;
      }

      .host-addr {
        color: #999;
        font-size: 12px;
      }
    }

    .empty {
      padding: 16px;
      color: #999;
      text-align: center;
    }
  }
}
</style>
