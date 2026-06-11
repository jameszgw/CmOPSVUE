<template>
  <div class="page-container">
    <el-card v-if="appDetail" class="detail-card">
      <div slot="header" class="card-header">
        <span>{{ appDetail.appName }} 详情页</span>
        <div>
          <el-button
            :disabled="!appDetail.appEnvList || appDetail.appEnvList.length === 0"
            @click="handleDeploy"
          >
            立即部署
          </el-button>
          <el-button style="margin-left: 16px" @click="switchMemberDrawer">项目成员</el-button>
        </div>
      </div>

      <el-descriptions title="应用基础详情" :column="3" border>
        <el-descriptions-item label="应用名称">
          {{ appDetail.appName || "--" }}
          <i class="el-icon-document-copy copy-icon" @click="copyText(appDetail.appName)" />
        </el-descriptions-item>
        <el-descriptions-item label="仓库">
          {{ appDetail.repo }}
          <i class="el-icon-document-copy copy-icon" @click="copyText(appDetail.repo)" />
        </el-descriptions-item>
        <el-descriptions-item label="语言">{{ appDetail.language }}</el-descriptions-item>
        <el-descriptions-item label="默认分支">{{ appDetail.defaultBranch }}</el-descriptions-item>
        <el-descriptions-item label="开发模式">{{ appDetail.developMode }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ appDetail.department }}</el-descriptions-item>
        <el-descriptions-item label="部门缩写">{{ appDetail.departmentAbbreviation }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(appDetail.gmtCreate) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(appDetail.gmtModified) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="detail-card">
      <div slot="header" class="card-header">
        <span>环境信息</span>
        <el-button @click="switchDrawer">添加环境</el-button>
      </div>
      <el-row v-if="appDetail" :gutter="16">
        <el-col v-for="appEnv in appDetail.appEnvList || []" :key="appEnv.envId" :span="8">
          <el-card class="env-card" shadow="never">
            <div slot="header">{{ appEnv.envName }}</div>
            <p>环境: {{ appEnv.env }}</p>
            <p>
              环境状态:
              <el-tag :type="appEnv.status === '0' ? 'success' : 'danger'">
                {{ appEnv.status === "0" ? "已启用" : "已停用" }}
              </el-tag>
            </p>
            <div style="margin-top: 16px">
              <h5>资源策略</h5>
              <el-descriptions :column="1" border size="mini">
                <el-descriptions-item label="副本数">
                  {{ appEnv.resourceStrategy && appEnv.resourceStrategy.replicas }}
                </el-descriptions-item>
                <el-descriptions-item label="CPU">
                  {{ appEnv.resourceStrategy && appEnv.resourceStrategy.cpu }}
                </el-descriptions-item>
                <el-descriptions-item label="内存">
                  {{ appEnv.resourceStrategy && appEnv.resourceStrategy.memory }}
                </el-descriptions-item>
                <el-descriptions-item label="最大CPU">
                  {{ appEnv.resourceStrategy && appEnv.resourceStrategy.maxCpu }}
                </el-descriptions-item>
                <el-descriptions-item label="最大内存">
                  {{ appEnv.resourceStrategy && appEnv.resourceStrategy.maxMemory }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <CreateEnvDrawer
      :visible="drawerVisible"
      :cluster-list="clusterList"
      @close="switchDrawer"
      @finish="onFinish"
    />
    <TeamMemberDrawer
      :visible="teamMembersDrawerVisible"
      :app-members="appMemberPage"
      :app-id="id"
      @close="switchMemberDrawer"
      @changed="pageAppMembers"
    />
  </div>
</template>

<script>
import dayjs from "dayjs";
import { getAppDetail, createAppEnv, pageAppMembers } from "@/api/app";
import { listAll } from "@/api/cluster";
import { copyToClipboard } from "@/utils/release-utils";
import CreateEnvDrawer from "./components/CreateEnvDrawer.vue";
import TeamMemberDrawer from "./components/TeamMemberDrawer.vue";

export default {
  name: "AppDetail",
  components: { CreateEnvDrawer, TeamMemberDrawer },
  data() {
    return {
      appDetail: null,
      pagination: { pageNo: 1, pageSize: 10 },
      drawerVisible: false,
      teamMembersDrawerVisible: false,
      clusterList: [],
      appMemberPage: { items: [], total: 0 },
    };
  },
  computed: {
    id() {
      return this.$route.params.id;
    },
  },
  created() {
    this.getAppDetail();
    this.pageAppMembers();
    this.fetchClusterList();
  },
  methods: {
    formatTime(time) {
      return time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "--";
    },
    copyText(text) {
      copyToClipboard(text).then(() => this.$message.success("复制成功"));
    },
    async getAppDetail() {
      const res = await getAppDetail(this.id);
      this.appDetail = res.content;
    },
    async fetchClusterList() {
      const res = await listAll();
      this.clusterList = res.content || [];
    },
    async pageAppMembers() {
      const res = await pageAppMembers({ ...this.pagination, appId: this.id });
      this.appMemberPage = res.content || { items: [], total: 0 };
    },
    switchDrawer() {
      this.drawerVisible = !this.drawerVisible;
    },
    switchMemberDrawer() {
      this.teamMembersDrawerVisible = !this.teamMembersDrawerVisible;
      if (this.teamMembersDrawerVisible) {
        this.pageAppMembers();
      }
    },
    async onFinish(values) {
      await createAppEnv({
        appId: this.id,
        env: {
          env: values.env,
          clusterId: values.clusterId,
          envName: values.envName,
          customBuildScript: values.customBuildScript,
          needApproval: values.needApproval,
          autoScaling: values.autoScaling,
          domains: [],
          resourceStrategy: {
            replicas: values.replicas,
            cpu: values.cpu,
            memory: values.memory,
            maxCpu: values.maxCpu,
            maxMemory: values.maxMemory,
          },
        },
      });
      this.$message.success("应用环境创建成功");
      this.drawerVisible = false;
      this.getAppDetail();
    },
    handleDeploy() {
      this.$router.push(`/devops/ci/app/deploy/${this.id}`);
    },
  },
};
</script>

<style lang="less" scoped>
.detail-card {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.env-card {
  width: 100%;
  max-width: 300px;
  margin-bottom: 16px;
}
.copy-icon {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
}
</style>
