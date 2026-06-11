<template>
  <div class="page-container">
    <h2 class="page-title">集群管理</h2>
    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" @click="handleCreateClusterDrawer">新增集群</el-button>
      </div>

      <CreateClusterDrawer
        :create-cluster-visible="createClusterVisible"
        @submit="handleCreateCluster"
        @connect="connectCluster"
        @close="handleCreateClusterDrawer"
      />

      <el-table :data="pagedClusterList" row-key="clusterId" style="width: 100%">
        <el-table-column prop="clusterName" label="集群名称" />
        <el-table-column prop="version" label="版本" />
        <el-table-column prop="clusterType" label="集群类型" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'danger'">
              {{ row.status === "0" ? "正常" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签">
          <template #default="{ row }">
            <el-space wrap>
              <el-tag v-for="(tag, index) in row.tags || []" :key="index">{{ tag }}</el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column label="操作" />
      </el-table>

      <el-pagination
        class="pagination"
        background
        layout="total, prev, pager, next"
        :total="clusterList.length"
        :current-page="pageNo"
        :page-size="pageSize"
        @current-change="(page) => (pageNo = page)"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
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
.title {
  background: rgb(160, 242, 121);
}

.page-title {
  margin: 0 0 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
