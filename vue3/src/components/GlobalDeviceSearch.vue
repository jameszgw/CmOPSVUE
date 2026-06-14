<template>
  <el-select
    v-model="selected"
    class="global-device-search"
    placeholder="搜索设备/服务器…"
    filterable
    remote
    clearable
    :remote-method="onSearch"
    :loading="loading"
    style="width: 240px"
    @focus="ensureLoaded"
    @change="onSelect"
  >
    <el-option-group
      v-for="g in groupedOptions"
      :key="g.type"
      :label="g.label"
    >
      <el-option
        v-for="d in g.list"
        :key="d.id"
        :label="d.name"
        :value="d.id"
      >
        <span>{{ d.name }}</span>
        <span class="global-device-search__sub">
          {{ TYPE_LABEL[d.type] || d.type }} · {{ d.ip }}
        </span>
      </el-option>
    </el-option-group>
  </el-select>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { listDevices } from "@/api/monitor-device";

const TYPE_LABEL = {
  SERVER: "服务器",
  REDIS: "Redis",
  DATABASE: "数据库",
  K8S: "容器",
  MQ: "消息队列",
  LB: "负载均衡",
  STORAGE: "存储",
  NETDEV: "网络设备",
  GPU: "GPU",
  POWER: "电能",
  ESS: "储能",
  IOT: "物联",
  SBC: "单板机",
  ANDROID: "安卓",
};

const TYPE_ROUTE = {
  SERVER: "server",
  REDIS: "redis",
  DATABASE: "database",
  K8S: "k8s",
  MQ: "mq",
  LB: "lb",
  STORAGE: "storage",
  NETDEV: "netdev",
  GPU: "gpu",
  POWER: "power",
  ESS: "ess",
  IOT: "iot",
  SBC: "sbc",
  ANDROID: "android",
};

const router = useRouter();

const selected = ref("");
const loading = ref(false);
const keyword = ref("");
const allDevices = ref([]);
let loaded = false;

const ensureLoaded = async () => {
  if (loaded) return;
  loading.value = true;
  try {
    const res = await listDevices();
    allDevices.value = res?.content || [];
    loaded = true;
  } catch (e) {
    ElMessage.error("加载设备列表失败");
  } finally {
    loading.value = false;
  }
};

const onSearch = async (query) => {
  keyword.value = (query || "").trim();
  await ensureLoaded();
};

const filtered = computed(() => {
  const kw = keyword.value.toLowerCase();
  if (!kw) return allDevices.value;
  return allDevices.value.filter((d) => {
    const name = (d.name || "").toLowerCase();
    const ip = (d.ip || "").toLowerCase();
    return name.includes(kw) || ip.includes(kw);
  });
});

const groupedOptions = computed(() => {
  const map = new Map();
  for (const d of filtered.value) {
    const type = d.type || "";
    if (!map.has(type)) {
      map.set(type, []);
    }
    map.get(type).push(d);
  }
  return Array.from(map.entries()).map(([type, list]) => ({
    type,
    label: TYPE_LABEL[type] || type,
    list,
  }));
});

const onSelect = (id) => {
  if (!id) return;
  const device = allDevices.value.find((d) => d.id === id);
  if (!device) {
    ElMessage.warning("未找到对应设备");
    selected.value = "";
    return;
  }
  const route = TYPE_ROUTE[device.type];
  if (!route) {
    ElMessage.warning("该设备类型暂不支持跳转");
    selected.value = "";
    return;
  }
  router.push({
    path: "/devops/monitor/" + route,
    query: { deviceId: device.id },
  });
  selected.value = "";
};
</script>

<style lang="less" scoped>
.global-device-search {
  &__sub {
    float: right;
    color: var(--cm-text-placeholder);
    font-size: 12px;
    margin-left: 12px;
  }
}
</style>
