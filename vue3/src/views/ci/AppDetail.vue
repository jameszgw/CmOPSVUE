<template>
  <ScreenPage :title="appDetail ? `${appDetail.appName} 详情` : '应用详情'" gap="8px">
    <template #header-extra>
      <div class="head-tools">
        <el-button
          size="small"
          type="primary"
          :disabled="!appDetail || !appDetail.appEnvList || appDetail.appEnvList.length === 0"
          @click="handleDeploy"
        >
          立即部署
        </el-button>
        <el-button size="small" @click="switchMemberDrawer">项目成员</el-button>
        <el-button size="small" @click="switchDrawer">添加环境</el-button>
      </div>
    </template>

    <div class="detail-body">
      <!-- 应用基础详情 -->
      <SectionCard v-if="appDetail" dense title="应用基础详情" icon="Document" class="detail-base">
        <el-descriptions border :column="3" size="small">
          <el-descriptions-item label="应用名称">
            {{ appDetail.appName ?? "--" }}
            <el-icon class="copy-icon" @click="copyText(appDetail.appName)"><CopyDocument /></el-icon>
          </el-descriptions-item>
          <el-descriptions-item label="仓库">
            {{ appDetail.repo }}
            <el-icon class="copy-icon" @click="copyText(appDetail.repo)"><CopyDocument /></el-icon>
          </el-descriptions-item>
          <el-descriptions-item label="语言">{{ appDetail.language }}</el-descriptions-item>
          <el-descriptions-item label="默认分支">{{ appDetail.defaultBranch }}</el-descriptions-item>
          <el-descriptions-item label="开发模式">{{ appDetail.developMode }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ appDetail.department }}</el-descriptions-item>
          <el-descriptions-item label="部门缩写">{{ appDetail.departmentAbbreviation }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(appDetail.gmtCreate) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatTime(appDetail.gmtModified) }}</el-descriptions-item>
        </el-descriptions>
      </SectionCard>

      <!-- 环境信息 -->
      <SectionCard dense title="环境信息" icon="Connection" class="detail-env">
        <el-empty
          v-if="!(appDetail?.appEnvList || []).length"
          description="暂无环境"
          :image-size="60"
        />
        <CardGrid v-else min="280px" gap="8px">
          <el-card
            v-for="appEnv in appDetail?.appEnvList || []"
            :key="appEnv.envId"
            class="env-card"
            shadow="never"
          >
            <template #header>{{ appEnv.envName }}</template>
            <p>环境: {{ appEnv.env }}</p>
            <p>
              环境状态:
              <el-tag :type="appEnv.status === '0' ? 'success' : 'danger'" size="small">
                {{ appEnv.status === "0" ? "已启用" : "已停用" }}
              </el-tag>
            </p>
            <div class="resource-block">
              <h5>资源策略</h5>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="副本数">
                  {{ appEnv.resourceStrategy?.replicas }}
                </el-descriptions-item>
                <el-descriptions-item label="CPU">
                  {{ appEnv.resourceStrategy?.cpu }}
                </el-descriptions-item>
                <el-descriptions-item label="内存">
                  {{ appEnv.resourceStrategy?.memory }}
                </el-descriptions-item>
                <el-descriptions-item label="最大CPU">
                  {{ appEnv.resourceStrategy?.maxCpu }}
                </el-descriptions-item>
                <el-descriptions-item label="最大内存">
                  {{ appEnv.resourceStrategy?.maxMemory }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>
        </CardGrid>
      </SectionCard>
    </div>

    <CreateEnvDrawer
      :open="drawerVisible"
      :cluster-list="clusterList"
      @close="switchDrawer"
      @finish="onFinish"
    />
    <TeamMemberDrawer
      :open="teamMembersDrawerVisible"
      :app-members="appMemberPage"
      @close="switchMemberDrawer"
    />
  </ScreenPage>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import { copyToClipboard } from "@/utils/release-utils";
import { getAppDetail, createAppEnv, pageAppMembers as pageAppMembersApi } from "@/api/app";
import { listAll } from "@/api/cluster";
import ScreenPage from "@/components/monitor/ScreenPage.vue";
import CardGrid from "@/components/monitor/CardGrid.vue";
import SectionCard from "@/components/monitor/SectionCard.vue";
import CreateEnvDrawer from "./components/CreateEnvDrawer.vue";
import TeamMemberDrawer from "./components/TeamMemberDrawer.vue";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const appDetail = ref(null);
const pagination = reactive({ pageNo: 1, pageSize: 10 });
const drawerVisible = ref(false);
const teamMembersDrawerVisible = ref(false);
const clusterList = ref([]);
const appMemberPage = ref(null);

const formatTime = (t) => (t ? dayjs(t).format("YYYY-MM-DD HH:mm:ss") : "--");

const copyText = async (text) => {
  try {
    await copyToClipboard(text);
    ElMessage.success("复制成功");
  } catch (e) {
    ElMessage.error("复制失败");
  }
};

const fetchAppDetail = async () => {
  const res = await getAppDetail(id);
  appDetail.value = res.content;
};

const fetchClusterList = async () => {
  const res = await listAll();
  clusterList.value = res.content || [];
};

const pageAppMembers = async () => {
  const res = await pageAppMembersApi({ ...pagination, appId: id });
  appMemberPage.value = res.content;
};

// 显示环境抽屉
const switchDrawer = () => {
  drawerVisible.value = !drawerVisible.value;
};

// 成员抽屉
const switchMemberDrawer = () => {
  teamMembersDrawerVisible.value = !teamMembersDrawerVisible.value;
};

// 成员抽屉打开/关闭时刷新成员列表（对齐原版 useEffect 行为）
watch(teamMembersDrawerVisible, () => {
  pageAppMembers();
});

// 提交添加环境表单
const onFinish = async (values) => {
  await createAppEnv({
    appId: id,
    env: {
      env: values.env,
      clusterId: values.clusterId,
      envName: values.envName,
      needApproval: values.needApproval,
      autoScaling: values.autoScaling,
      domains: [],
      resourceStrategy: {
        replicas: values.replicas,
        cpu: values.cpu,
        memory: values.memory,
        maxCpu: values.maxCpu,
        maxMemory: values.maxCpu,
      },
    },
  });
  ElMessage.success("应用环境成功");
  switchDrawer();
  fetchAppDetail();
};

const handleDeploy = () => {
  router.push(`/devops/ci/app/deploy/${id}`);
};

onMounted(() => {
  fetchAppDetail();
  pageAppMembers();
  fetchClusterList();
});
</script>

<style lang="less" scoped>
@import (reference) "@/styles/variables.less";

.head-tools {
  display: flex;
  align-items: center;
  gap: @space-sm;
}

.detail-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: @space-sm;
}

.detail-base {
  flex-shrink: 0;
}

.copy-icon {
  margin-left: 4px;
  cursor: pointer;
  color: var(--el-color-primary);
  vertical-align: middle;
}

.env-card {
  margin-bottom: 0;

  p {
    margin: 0 0 8px;
    font-size: 13px;
  }

  .resource-block {
    margin-top: 12px;

    h5 {
      margin: 0 0 8px;
    }
  }
}
</style>
