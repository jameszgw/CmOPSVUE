<template>
  <screen-page :title="appDetail ? `${appDetail.appName} 详情` : '应用详情'" gap="8px">
    <template #header-extra>
      <el-button
        size="small"
        :disabled="!appDetail || !appDetail.appEnvList || appDetail.appEnvList.length === 0"
        @click="handleDeploy"
      >
        立即部署
      </el-button>
      <el-button size="small" style="margin-left: 8px" @click="switchMemberDrawer">
        项目成员
      </el-button>
    </template>

    <section-card
      v-if="appDetail"
      dense
      title="应用基础详情"
      icon="el-icon-info"
      class="basic-card"
    >
      <el-descriptions :column="3" size="small" border>
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
    </section-card>

    <section-card
      dense
      scrollable
      class="fill"
      title="环境信息"
      icon="el-icon-coordinate"
    >
      <template #extra>
        <el-button type="text" @click="switchDrawer">添加环境</el-button>
      </template>
      <card-grid v-if="appDetail" min="280px" gap="8px">
        <el-card
          v-for="appEnv in appDetail.appEnvList || []"
          :key="appEnv.envId"
          class="env-card"
          shadow="never"
        >
          <div slot="header" class="env-card__header">
            <span>{{ appEnv.envName }}</span>
            <el-tag :type="appEnv.status === '0' ? 'success' : 'danger'" size="mini">
              {{ appEnv.status === "0" ? "已启用" : "已停用" }}
            </el-tag>
          </div>
          <p class="env-card__env">环境: {{ appEnv.env }}</p>
          <h5 class="env-card__sub">资源策略</h5>
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
        </el-card>
      </card-grid>
    </section-card>

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
  </screen-page>
</template>

<script>
import dayjs from "dayjs";
import { getAppDetail, createAppEnv, pageAppMembers } from "@/api/app";
import { listAll } from "@/api/cluster";
import { copyToClipboard } from "@/utils/release-utils";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import CreateEnvDrawer from "./components/CreateEnvDrawer.vue";
import TeamMemberDrawer from "./components/TeamMemberDrawer.vue";

export default {
  name: "AppDetail",
  components: {
    ScreenPage,
    SectionCard,
    CardGrid,
    CreateEnvDrawer,
    TeamMemberDrawer,
  },
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
.basic-card {
  flex-shrink: 0;
}
.env-card {
  width: 100%;
}
.env-card /deep/ .el-card__header {
  padding: 8px 12px;
}
.env-card /deep/ .el-card__body {
  padding: 10px 12px;
}
.env-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.env-card__env {
  margin: 0 0 8px;
  font-size: 13px;
}
.env-card__sub {
  margin: 0 0 8px;
  font-size: 13px;
}
.copy-icon {
  margin-left: 6px;
  color: #409eff;
  cursor: pointer;
}
</style>
