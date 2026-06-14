<template>
  <el-select
    v-model="selected"
    class="global-device-search"
    filterable
    remote
    clearable
    :remote-method="remoteMethod"
    :loading="loading"
    placeholder="搜索设备/服务器…"
    style="width: 240px"
    @change="onChange"
    @focus="onFocus"
  >
    <el-option-group v-for="g in groups" :key="g.type" :label="g.label">
      <el-option v-for="d in g.list" :key="d.id" :label="d.name" :value="d.id">
        <span>{{ d.name }}</span>
        <span class="global-device-search__sub">{{ d.ip }}</span>
      </el-option>
    </el-option-group>
  </el-select>
</template>

<script>
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
};

export default {
  name: "GlobalDeviceSearch",
  data() {
    return {
      selected: "",
      loading: false,
      allDevices: [],
      loaded: false,
      matched: [],
    };
  },
  computed: {
    // 按类型(type)分组匹配结果
    groups() {
      const map = new Map();
      (this.matched || []).forEach((d) => {
        const type = (d && d.type) || "SERVER";
        if (!map.has(type)) {
          map.set(type, []);
        }
        map.get(type).push(d);
      });
      return Array.from(map.keys()).map((type) => ({
        type,
        label: TYPE_LABEL[type] || type,
        list: map.get(type),
      }));
    },
  },
  methods: {
    async ensureLoaded() {
      if (this.loaded) {
        return;
      }
      this.loading = true;
      try {
        const res = await listDevices();
        this.allDevices = (res && res.content) || [];
        this.loaded = true;
      } catch (e) {
        this.$message.error("加载设备列表失败");
      } finally {
        this.loading = false;
      }
    },
    filter(query) {
      const q = (query || "").trim().toLowerCase();
      if (!q) {
        this.matched = this.allDevices.slice(0, 50);
        return;
      }
      this.matched = this.allDevices.filter((d) => {
        const name = (d && d.name ? d.name : "").toLowerCase();
        const ip = (d && d.ip ? d.ip : "").toLowerCase();
        return name.indexOf(q) !== -1 || ip.indexOf(q) !== -1;
      });
    },
    async remoteMethod(query) {
      await this.ensureLoaded();
      this.filter(query);
    },
    async onFocus() {
      await this.ensureLoaded();
      if (!this.matched.length) {
        this.filter("");
      }
    },
    onChange(id) {
      if (!id) {
        return;
      }
      const device = this.allDevices.find((d) => d.id === id);
      if (!device) {
        this.$message.warning("未找到该设备");
        return;
      }
      const route = TYPE_ROUTE[device.type];
      if (!route) {
        this.$message.warning("该设备类型暂不支持");
        return;
      }
      this.$router.push({
        path: "/devops/monitor/" + route,
        query: { deviceId: device.id },
      });
      this.$nextTick(() => {
        this.selected = "";
      });
    },
  },
};
</script>

<style lang="less" scoped>
.global-device-search {
  margin-right: 16px;

  &__sub {
    float: right;
    color: var(--cm-text-placeholder, #c0c4cc);
    font-size: 12px;
  }
}
</style>
