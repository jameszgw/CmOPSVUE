<template>
  <ScreenPage title="集群管理" gap="8px">
    <template #header-extra>
      <el-button type="primary" size="small" @click="handleCreateClusterDrawer">新增集群</el-button>
    </template>

    <CreateClusterDrawer
      :create-cluster-visible="createClusterVisible"
      @submit="handleCreateCluster"
      @connect="connectCluster"
      @close="handleCreateClusterDrawer"
    />

    <SectionCard
      dense
      bodyClass="dense-table fill table-pane"
      class="fill"
      title="集群列表"
      icon="Connection"
    >
      <el-table class="dense-table fill" height="100%" :data="pagedClusterList" row-key="clusterId" size="small" stripe>
        <el-table-column prop="clusterName" label="集群名称" />
        <el-table-column prop="version" label="版本" />
        <el-table-column prop="clusterType" label="集群类型" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
              {{ row.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="(tag, index) in row.tags || []" :key="index" size="small">{{ tag }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="操作" />
      </el-table>

      <el-pagination
        class="pagination"
        background
        small
        layout="total, prev, pager, next"
        :total="clusterList.length"
        :current-page="pageNo"
        :page-size="pageSize"
        @current-change="(page) => (pageNo = page)"
      />
    </SectionCard>
  </ScreenPage>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CreateClusterDrawer from "./components/CreateClusterDrawer.vue";
import { listAll, createCluster, connect } from "@/api/cluster";

const createClusterVisible = ref(false);
const clusterList = ref([]);
const pageNo = ref(1);
const pageSize = ref(10);

const pagedClusterList = computed(() =>
  clusterList.value.slice((pageNo.value - 1) * pageSize.value, pageNo.value * pageSize.value)
);

const fetchClusterList = async () => {
  const res = await listAll();
  clusterList.value = res.content || [];
};

const handleCreateClusterDrawer = () => {
  createClusterVisible.value = !createClusterVisible.value;
};

const handleCreateCluster = async (values) => {
  const res = await createCluster(values);
  if (res.content) {
    ElMessage.success("创建成功");
  } else {
    ElMessage.error("创建失败");
  }
  handleCreateClusterDrawer();
  fetchClusterList();
};

const connectCluster = async (values) => {
  const res = await connect(values);
  if (res.content) {
    ElMessage.success("连接成功");
  } else {
    ElMessage.error("连接失败");
  }
};

onMounted(() => {
  fetchClusterList();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

:deep(.table-pane) {
  display: flex;
  flex-direction: column;
}

.pagination {
  margin-top: @space-sm;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
