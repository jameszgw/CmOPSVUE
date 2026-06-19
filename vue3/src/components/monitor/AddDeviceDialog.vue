<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="560px"
    @open="onOpen"
    @closed="onClosed"
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

      <!-- 电能专有 -->
      <template v-if="deviceType === 'POWER'">
        <el-form-item label="电能类型" prop="powerType">
          <el-select v-model="form.powerType">
            <el-option v-for="t in options.powerTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商" prop="powerVendor">
          <el-input v-model="form.powerVendor" placeholder="如 施耐德 / 华为" />
        </el-form-item>
        <el-form-item label="额定功率(kW)" prop="ratedPower">
          <el-input-number v-model="form.ratedPower" :min="0" :max="100000" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 储能专有 -->
      <template v-if="deviceType === 'ESS'">
        <el-form-item label="储能类型" prop="essType">
          <el-select v-model="form.essType">
            <el-option v-for="t in options.essTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商" prop="essVendor">
          <el-input v-model="form.essVendor" placeholder="如 宁德时代 / 比亚迪" />
        </el-form-item>
        <el-form-item label="容量(kWh)" prop="essCapacity">
          <el-input-number v-model="form.essCapacity" :min="0" :max="1000000" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 物联专有 -->
      <template v-if="deviceType === 'IOT'">
        <el-form-item label="物联类型" prop="iotType">
          <el-select v-model="form.iotType">
            <el-option v-for="t in options.iotTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="协议" prop="iotProtocol">
          <el-select v-model="form.iotProtocol">
            <el-option v-for="t in options.iotProtocols" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="频段" prop="iotBand">
          <el-select v-model="form.iotBand">
            <el-option v-for="t in options.iotBands" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 单板机专有 -->
      <template v-if="deviceType === 'SBC'">
        <el-form-item label="板卡型号" prop="boardModel">
          <el-select v-model="form.boardModel" placeholder="请选择">
            <el-option v-for="t in options.boardModels" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="SoC型号" prop="socModel">
          <el-input v-model="form.socModel" placeholder="如 BCM2712 / RK3588" />
        </el-form-item>
        <el-form-item label="CPU架构" prop="cpuArch">
          <el-select v-model="form.cpuArch" placeholder="请选择">
            <el-option v-for="t in options.cpuArchs" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 安卓多开专有 -->
      <template v-if="deviceType === 'ANDROID'">
        <el-form-item label="安卓类型" prop="androidType">
          <el-select v-model="form.androidType" placeholder="请选择">
            <el-option v-for="t in options.androidTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="安卓版本" prop="androidVersion">
          <el-select v-model="form.androidVersion" placeholder="请选择">
            <el-option v-for="t in options.androidVersions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="实例容量" prop="instanceCap">
          <el-input-number v-model="form.instanceCap" :min="1" :max="1000" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 采集配置（无探针 agentless 凭据） -->
      <el-divider content-position="left">采集配置</el-divider>
      <el-form-item label="采集方式" prop="collectVia">
        <el-select v-model="form.collectVia" placeholder="请选择">
          <el-option label="模拟数据" value="NONE" />
          <template v-if="deviceType === 'REDIS'">
            <el-option label="直连采集(INFO)" value="DIRECT" />
          </template>
          <template v-else>
            <el-option label="Agent探针" value="AGENT" />
            <el-option label="SSH(无探针)" value="SSH" />
            <el-option label="SNMP(无探针)" value="SNMP" />
            <el-option label="WinRM(无探针)" value="WINRM" />
          </template>
        </el-select>
      </el-form-item>
      <template v-if="form.collectVia === 'SSH' || form.collectVia === 'WINRM'">
        <el-form-item label="端口" prop="collectPort">
          <el-input-number v-model="form.collectPort" :min="1" :max="65535" controls-position="right" />
        </el-form-item>
        <el-form-item label="用户名" prop="collectUser">
          <el-input v-model="form.collectUser" placeholder="如 root / ops" />
        </el-form-item>
        <el-form-item label="密码" prop="collectSecret">
          <el-input v-model="form.collectSecret" type="password" show-password placeholder="SSH 登录密码" />
        </el-form-item>
        <el-form-item label=" ">
          <span v-if="form.collectVia === 'WINRM'" style="color: #909399; font-size: 12px; line-height: 1.5">
            Windows WinRM(默认5985/NTLM)，Windows Server 通常默认开启，无需装Agent/OpenSSH
          </span>
          <span v-else style="color: #909399; font-size: 12px; line-height: 1.5">
            需目标主机开放SSH(Linux/Unix，或Windows OpenSSH)；凭据仅用于只读采集
          </span>
        </el-form-item>
      </template>
      <template v-else-if="form.collectVia === 'SNMP'">
        <el-form-item label="端口" prop="collectPort">
          <el-input-number v-model="form.collectPort" :min="1" :max="65535" controls-position="right" />
        </el-form-item>
        <el-form-item label="Community" prop="collectSecret">
          <el-input v-model="form.collectSecret" placeholder="如 public" />
        </el-form-item>
      </template>
      <template v-else-if="form.collectVia === 'DIRECT'">
        <el-form-item label="端口" prop="collectPort">
          <el-input-number v-model="form.collectPort" :min="1" :max="65535" controls-position="right" />
        </el-form-item>
        <el-form-item label="用户名" prop="collectUser">
          <el-input v-model="form.collectUser" placeholder="Redis 6+ ACL 用户名；留空走默认用户/仅密码" />
        </el-form-item>
        <el-form-item label="密码" prop="collectSecret">
          <el-input v-model="form.collectSecret" type="password" show-password placeholder="Redis 访问密码(requirepass 或 ACL 密码)" />
        </el-form-item>
        <el-form-item label=" ">
          <span style="color: #909399; font-size: 12px; line-height: 1.5">
            直连目标 Redis 端口执行 INFO 只读采集；集群/哨兵填任一可达节点，凭据(同一 ACL)对各节点通用
          </span>
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
import { addDevice, updateDevice, getDeviceOptions } from "@/api/monitor-device";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  deviceType: { type: String, default: "SERVER" },
  // 编辑模式：传入设备对象则进入编辑，提交走 updateDevice；为 null 时与原新增逻辑一致
  editDevice: { type: Object, default: null },
});
const emit = defineEmits(["update:modelValue", "added"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "K8s集群",
  MQ: "消息中间件", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
  POWER: "电能", ESS: "储能", IOT: "物联", SBC: "单板机", ANDROID: "安卓多开",
};
const typeLabel = computed(() => TYPE_LABEL[props.deviceType] || "");

// 编辑状态：打开时根据 editDevice 是否存在确定
const isEdit = ref(false);
const editId = ref(null);
const dialogTitle = computed(() =>
  isEdit.value ? "编辑设备" : `新增${typeLabel.value}设备`
);

const DEFAULT_PORT = {
  SERVER: 22, REDIS: 6379, DATABASE: 3306, K8S: 6443,
  MQ: 9092, LB: 80, STORAGE: 6789, NETDEV: 161, GPU: 8080,
  POWER: 502, ESS: 502, IOT: 1883, SBC: 22, ANDROID: 5555,
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
  collectVia: "NONE",
  collectPort: 22,
  collectUser: "",
  collectSecret: "",
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
  powerType: "UPS",
  powerVendor: "",
  ratedPower: 10,
  essType: "BATTERY",
  essVendor: "",
  essCapacity: 100,
  iotType: "GATEWAY",
  iotProtocol: "MQTT",
  iotBand: "2.4G",
  boardModel: "",
  socModel: "",
  cpuArch: "",
  androidType: "",
  androidVersion: "",
  instanceCap: 16,
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
  if (props.editDevice) {
    isEdit.value = true;
    editId.value = props.editDevice.id;
    // 用已有设备数据回填表单（含采集配置字段）
    Object.keys(form).forEach((k) => {
      if (props.editDevice[k] !== undefined && props.editDevice[k] !== null) {
        form[k] = props.editDevice[k];
      }
    });
  } else {
    isEdit.value = false;
    editId.value = null;
    form.port = DEFAULT_PORT[props.deviceType] || 22;
  }
  if (!options.value.osTypes) {
    try {
      const res = await getDeviceOptions();
      options.value = res.content || {};
    } catch (e) {
      /* 接口层已提示 */
    }
  }
};

const onClosed = () => {
  // 关闭后重置编辑状态与表单，下次打开恢复新增默认
  isEdit.value = false;
  editId.value = null;
  formRef.value?.resetFields();
};

watch(
  () => props.deviceType,
  () => {
    form.port = DEFAULT_PORT[props.deviceType] || 22;
  }
);

watch(
  () => form.collectVia,
  (via) => {
    if (via === "SSH") {
      form.collectPort = 22;
    } else if (via === "WINRM") {
      form.collectPort = 5985;
    } else if (via === "SNMP") {
      form.collectPort = 161;
      if (!form.collectSecret) form.collectSecret = "public";
    } else if (via === "DIRECT") {
      form.collectPort = form.port || DEFAULT_PORT[props.deviceType] || 6379;
    }
  }
);

const submit = () => {
  formRef.value.validate(async (ok) => {
    if (!ok) return;
    submitting.value = true;
    try {
      const payload = { name: form.name, ip: form.ip, port: form.port, type: props.deviceType };
      if (isEdit.value && editId.value != null) {
        payload.id = editId.value;
      }
      // 采集配置（无探针 agentless 凭据）
      payload.collectVia = form.collectVia;
      if (form.collectVia === "SSH" || form.collectVia === "WINRM") {
        payload.collectPort = form.collectPort;
        payload.collectUser = form.collectUser;
        payload.collectSecret = form.collectSecret;
      } else if (form.collectVia === "SNMP") {
        payload.collectPort = form.collectPort;
        payload.collectSecret = form.collectSecret;
      } else if (form.collectVia === "DIRECT") {
        payload.collectPort = form.collectPort;
        payload.collectUser = form.collectUser;
        payload.collectSecret = form.collectSecret;
      }
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
      } else if (props.deviceType === "POWER") {
        Object.assign(payload, {
          powerType: form.powerType,
          powerVendor: form.powerVendor,
          ratedPower: form.ratedPower,
        });
      } else if (props.deviceType === "ESS") {
        Object.assign(payload, {
          essType: form.essType,
          essVendor: form.essVendor,
          essCapacity: form.essCapacity,
        });
      } else if (props.deviceType === "IOT") {
        Object.assign(payload, {
          iotType: form.iotType,
          iotProtocol: form.iotProtocol,
          iotBand: form.iotBand,
        });
      } else if (props.deviceType === "SBC") {
        Object.assign(payload, {
          boardModel: form.boardModel,
          socModel: form.socModel,
          cpuArch: form.cpuArch,
        });
      } else if (props.deviceType === "ANDROID") {
        Object.assign(payload, {
          androidType: form.androidType,
          androidVersion: form.androidVersion,
          instanceCap: form.instanceCap,
        });
      }
      const res = isEdit.value
        ? await updateDevice(payload)
        : await addDevice(payload);
      if (res.success) {
        ElMessage.success(isEdit.value ? "保存成功" : "新增成功");
        visible.value = false;
        emit("added", res.content);
        // 表单重置交由 @closed 处理，避免关闭动画期间字段闪烁
      }
    } finally {
      submitting.value = false;
    }
  });
};
</script>
