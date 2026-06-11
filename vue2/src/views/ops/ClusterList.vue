<template>
  <div class="page-container">
    <h2 class="title">集群管理</h2>
    <el-card shadow="never">
      <el-button type="primary" style="margin-bottom: 16px" @click="handleCreateClusterDrawer">
        新增集群
      </el-button>

      <create-cluster-drawer
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
            <el-tag
              v-for="(tag, index) in row.tags || []"
              :key="index"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" />
      </el-table>

      <el-pagination
        style="margin-top: 12px; text-align: right"
        layout="total, prev, pager, next"
        :total="clusterList.length"
        :current-page="pageNo"
        :page-size="10"
        @current-change="(page) => (pageNo = page)"
      />
    </el-card>
  </div>
</template>

<script>
import CreateClusterDrawer from "./components/CreateClusterDrawer.vue";
import { listAll, createCluster, connect } from "@/api/cluster";

export default {
  name: "ClusterList",
  components: {
    CreateClusterDrawer,
  },
  data() {
    return {
      createClusterVisible: false,
      clusterList: [],
      pageNo: 1,
    };
  },
  computed: {
    pagedClusterList() {
      const start = (this.pageNo - 1) * 10;
      return this.clusterList.slice(start, start + 10);
    },
  },
  created() {
    this.fetchClusterList();
  },
  methods: {
    async fetchClusterList() {
      const res = await listAll();
      this.clusterList = res.content || [];
    },
    handleCreateClusterDrawer() {
      this.createClusterVisible = !this.createClusterVisible;
    },
    async handleCreateCluster(values) {
      try {
        const res = await createCluster(values);
        if (res.content) {
          this.$message.success("创建成功");
        } else {
          this.$message.error("创建失败");
        }
      } finally {
        this.handleCreateClusterDrawer();
        this.fetchClusterList();
      }
    },
    async connectCluster(values) {
      const res = await connect(values);
      if (res.content) {
        this.$message.success("连接成功");
      } else {
        this.$message.error("连接失败");
      }
    },
  },
};
</script>

<style lang="less" scoped>
.title {
  background: rgb(160, 242, 121);
}
</style>
