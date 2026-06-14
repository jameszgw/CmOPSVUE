<template>
  <el-dialog
    v-model="visible"
    :title="`新增${typeLabel}设备`"
    width="560px"
    @open="onOpen"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="主机地址" prop="ip">
        <el-input v-model="form.ip" placeholder="如 10.20.30.11" />
      </el-form-item>
      <el-form-item label="端口" prop="port">
        <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" />
      </el-form-item>

      <!-- 服务器专有 -->
      <template v-if="deviceType === 'SERVER'">
        <el-form-item label="服务器类别" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio-button label="PHYSICAL">物理服务器</el-radio-button>
            <el-radio-button label="VM">虚拟机</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.category === 'VM'" label="虚拟化类型" prop="vmType">
          <el-select v-model="form.vmType" placeholder="请选择">
            <el-option
              v-for="t in (options.vmTypes || []).filter((v) => v !== 'NONE')"
              :key="t"
              :label="vmLabel(t)"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作系统" prop="osType">
          <el-select v-model="form.osType" placeholder="请选择">
            <el-option v-for="t in options.osTypes" :key="t" :label="osLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统名称" prop="osName">
          <el-input v-model="form.osName" placeholder="如 CentOS Linux 7.9" />
        </el-form-item>
        <el-form-item label="采集模式" prop="collectMode">
          <el-radio-group v-model="form.collectMode">
            <el-radio-button label="AGENT">含 Agent</el-radio-button>
            <el-radio-button label="AGENTLESS">无 Agent</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- Redis 专有 -->
      <template v-if="deviceType === 'REDIS'">
        <el-form-item label="Redis 版本" prop="redisVersion">
          <el-input v-model="form.redisVersion" placeholder="如 7.2.4" />
        </el-form-item>
        <el-form-item label="运行模式" prop="redisMode">
          <el-select v-model="form.redisMode">
            <el-option label="standalone" value="standalone" />
            <el-option label="cluster" value="cluster" />
            <el-option label="sentinel" value="sentinel" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="redisRole">
          <el-select v-model="form.redisRole">
            <el-option label="master" value="master" />
            <el-option label="slave" value="slave" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 数据库专有 -->
      <template v-if="deviceType === 'DATABASE'">
        <el-form-item label="数据库类型" prop="dbType">
          <el-select v-model="form.dbType">
            <el-option v-for="t in options.dbTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据库名" prop="dbName">
          <el-input v-model="form.dbName" placeholder="如 demo-zq-platform" />
        </el-form-item>
        <el-form-item label="版本" prop="dbVersion">
          <el-input v-model="form.dbVersion" placeholder="如 PostgreSQL 16.2" />
        </el-form-item>
      </template>

      <!-- K8s 集群专有 -->
      <template v-if="deviceType === 'K8S'">
        <el-form-item label="集群版本" prop="k8sVersion">
          <el-input v-model="form.k8sVersion" placeholder="如 v1.29.3" />
        </el-form-item>
        <el-form-item label="发行版" prop="k8sDistro">
          <el-select v-model="form.k8sDistro">
            <el-option v-for="t in options.k8sDistros" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="容器运行时" prop="k8sRuntime">
          <el-select v-model="form.k8sRuntime">
            <el-option v-for="t in options.k8sRuntimes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="CNI 插件" prop="k8sCni">
          <el-select v-model="form.k8sCni">
            <el-option v-for="t in options.k8sCnis" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="节点数" prop="nodeCount">
          <el-input-number v-model="form.nodeCount" :min="1" :max="500" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 消息中间件专有 -->
      <template v-if="deviceType === 'MQ'">
        <el-form-item label="类型" prop="mqType">
          <el-select v-model="form.mqType">
            <el-option v-for="t in options.mqTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="mqVersion">
          <el-input v-model="form.mqVersion" placeholder="如 3.7.0" />
        </el-form-item>
        <el-form-item label="Broker 数" prop="brokerCount">
          <el-input-number v-model="form.brokerCount" :min="1" :max="100" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 负载均衡专有 -->
      <template v-if="deviceType === 'LB'">
        <el-form-item label="类型" prop="lbType">
          <el-select v-model="form.lbType">
            <el-option v-for="t in options.lbTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="lbVersion">
          <el-input v-model="form.lbVersion" placeholder="如 1.25.4" />
        </el-form-item>
      </template>

      <!-- 存储专有 -->
      <template v-if="deviceType === 'STORAGE'">
        <el-form-item label="类型" prop="storageType">
          <el-select v-model="form.storageType">
            <el-option v-for="t in options.storageTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商/型号" prop="storageVendor">
          <el-input v-model="form.storageVendor" placeholder="如 Ceph Reef / NetApp" />
        </el-form-item>
      </template>

      <!-- 网络设备专有 -->
      <template v-if="deviceType === 'NETDEV'">
        <el-form-item label="类型" prop="netDevType">
          <el-select v-model="form.netDevType">
            <el-option v-for="t in options.netDevTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商" prop="netDevVendor">
          <el-input v-model="form.netDevVendor" placeholder="如 Cisco / 华为" />
        </el-form-item>
        <el-form-item label="型号" prop="netDevModel">
          <el-input v-model="form.netDevModel" placeholder="如 Nexus 9300" />
        </el-form-item>
      </template>

      <!-- GPU 专有 -->
      <template v-if="deviceType === 'GPU'">
        <el-form-item label="厂商" prop="gpuVendor">
          <el-select v-model="form.gpuVendor">
            <el-option v-for="t in options.gpuVendors" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号" prop="gpuModel">
          <el-input v-model="form.gpuModel" placeholder="如 A100-SXM4-80GB" />
        </el-form-item>
        <el-form-item label="GPU 数" prop="gpuCount">
          <el-input-number v-model="form.gpuCount" :min="1" :max="256" controls-position="right" />
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { addDevice, getDeviceOptions } from "@/api/monitor-device";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  deviceType: { type: String, default: "SERVER" },
});
const emit = defineEmits(["update:modelValue", "added"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "K8s集群",
  MQ: "消息中间件", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
};
const typeLabel = computed(() => TYPE_LABEL[props.deviceType] || "");

const DEFAULT_PORT = {
  SERVER: 22, REDIS: 6379, DATABASE: 3306, K8S: 6443,
  MQ: 9092, LB: 80, STORAGE: 6789, NETDEV: 161, GPU: 8080,
};

const formRef = ref();
const submitting = ref(false);
const options = ref({});

const form = reactive({
  name: "",
  ip: "",
  port: 22,
  category: "PHYSICAL",
  vmType: "KVM",
  osType: "LINUX",
  osName: "",
  collectMode: "AGENT",
  redisVersion: "7.2.4",
  redisMode: "standalone",
  redisRole: "master",
  dbType: "MYSQL",
  dbName: "",
  dbVersion: "",
  k8sVersion: "v1.29.0",
  k8sDistro: "VANILLA",
  k8sRuntime: "CONTAINERD",
  k8sCni: "CALICO",
  nodeCount: 3,
  mqType: "KAFKA",
  mqVersion: "3.7.0",
  brokerCount: 3,
  lbType: "NGINX",
  lbVersion: "1.25.0",
  storageType: "CEPH",
  storageVendor: "",
  netDevType: "SWITCH",
  netDevVendor: "",
  netDevModel: "",
  gpuVendor: "NVIDIA",
  gpuModel: "Tesla T4",
  gpuCount: 1,
});

const rules = {
  name: [{ required: true, message: "请输入设备名称", trigger: "blur" }],
  ip: [{ required: true, message: "请输入主机地址", trigger: "blur" }],
};

const vmLabel = (t) =>
  ({ KVM: "KVM", VMWARE: "VMware", HYPER_V: "Hyper-V", XEN: "Xen", VIRTUALBOX: "VirtualBox", OPENSTACK: "OpenStack", CLOUD_ECS: "云主机 ECS", APPLE_VZ: "Apple 虚拟化", PARALLELS: "Parallels", VMWARE_FUSION: "VMware Fusion" }[t] || t);

const osLabel = (t) =>
  ({ LINUX: "Linux", UNIX: "Unix", WINDOWS: "Windows", MACOS: "macOS" }[t] || t);

const onOpen = async () => {
  form.port = DEFAULT_PORT[props.deviceType] || 22;
  if (!options.value.osTypes) {
    try {
      const res = await getDeviceOptions();
      options.value = res.content || {};
    } catch (e) {
      /* 接口层已提示 */
    }
  }
};

watch(
  () => props.deviceType,
  () => {
    form.port = DEFAULT_PORT[props.deviceType] || 22;
  }
);

const submit = () => {
  formRef.value.validate(async (ok) => {
    if (!ok) return;
    submitting.value = true;
    try {
      const payload = { name: form.name, ip: form.ip, port: form.port, type: props.deviceType };
      if (props.deviceType === "SERVER") {
        Object.assign(payload, {
          category: form.category,
          vmType: form.category === "VM" ? form.vmType : "NONE",
          osType: form.osType,
          osName: form.osName,
          collectMode: form.collectMode,
        });
      } else if (props.deviceType === "REDIS") {
        Object.assign(payload, {
          redisVersion: form.redisVersion,
          redisMode: form.redisMode,
          redisRole: form.redisRole,
        });
      } else if (props.deviceType === "DATABASE") {
        Object.assign(payload, {
          dbType: form.dbType,
          dbName: form.dbName,
          dbVersion: form.dbVersion,
        });
      } else if (props.deviceType === "K8S") {
        Object.assign(payload, {
          k8sVersion: form.k8sVersion,
          k8sDistro: form.k8sDistro,
          k8sRuntime: form.k8sRuntime,
          k8sCni: form.k8sCni,
          nodeCount: form.nodeCount,
        });
      } else if (props.deviceType === "MQ") {
        Object.assign(payload, {
          mqType: form.mqType,
          mqVersion: form.mqVersion,
          brokerCount: form.brokerCount,
        });
      } else if (props.deviceType === "LB") {
        Object.assign(payload, { lbType: form.lbType, lbVersion: form.lbVersion });
      } else if (props.deviceType === "STORAGE") {
        Object.assign(payload, {
          storageType: form.storageType,
          storageVendor: form.storageVendor,
        });
      } else if (props.deviceType === "NETDEV") {
        Object.assign(payload, {
          netDevType: form.netDevType,
          netDevVendor: form.netDevVendor,
          netDevModel: form.netDevModel,
        });
      } else if (props.deviceType === "GPU") {
        Object.assign(payload, {
          gpuVendor: form.gpuVendor,
          gpuModel: form.gpuModel,
          gpuCount: form.gpuCount,
        });
      }
      const res = await addDevice(payload);
      if (res.success) {
        ElMessage.success("新增成功");
        visible.value = false;
        emit("added", res.content);
        formRef.value.resetFields();
      }
    } finally {
      submitting.value = false;
    }
  });
};
</script>
