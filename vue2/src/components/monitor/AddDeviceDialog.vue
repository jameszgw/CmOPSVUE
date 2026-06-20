<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="visible"
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

      <!-- 编辑模式：允许修改设备类型（纠正创建时选错的类型） -->
      <el-form-item v-if="isEdit" label="设备类型" prop="type">
        <el-select v-model="currentType" placeholder="请选择设备类型">
          <el-option v-for="(label, k) in TYPE_LABEL" :key="k" :label="label" :value="k" />
        </el-select>
      </el-form-item>

      <!-- 服务器专有 -->
      <template v-if="currentType === 'SERVER'">
        <el-form-item label="服务器类别" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio-button label="PHYSICAL">物理服务器</el-radio-button>
            <el-radio-button label="VM">虚拟机</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.category === 'VM'" label="虚拟化类型" prop="vmType">
          <el-select v-model="form.vmType" placeholder="请选择">
            <el-option
              v-for="t in vmTypeOptions"
              :key="t"
              :label="vmLabel(t)"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作系统" prop="osType">
          <el-select v-model="form.osType" placeholder="请选择">
            <el-option v-for="t in (options.osTypes || [])" :key="t" :label="osLabel(t)" :value="t" />
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
      <template v-if="currentType === 'REDIS'">
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
      <template v-if="currentType === 'DATABASE'">
        <el-form-item label="数据库类型" prop="dbType">
          <el-select v-model="form.dbType">
            <el-option v-for="t in (options.dbTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
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
      <template v-if="currentType === 'K8S'">
        <el-form-item label="集群版本" prop="k8sVersion">
          <el-input v-model="form.k8sVersion" placeholder="如 v1.29.3" />
        </el-form-item>
        <el-form-item label="发行版" prop="k8sDistro">
          <el-select v-model="form.k8sDistro">
            <el-option v-for="t in (options.k8sDistros || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="容器运行时" prop="k8sRuntime">
          <el-select v-model="form.k8sRuntime">
            <el-option v-for="t in (options.k8sRuntimes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="CNI 插件" prop="k8sCni">
          <el-select v-model="form.k8sCni">
            <el-option v-for="t in (options.k8sCnis || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="节点数" prop="nodeCount">
          <el-input-number v-model="form.nodeCount" :min="1" :max="500" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 消息中间件专有 -->
      <template v-if="currentType === 'MQ'">
        <el-form-item label="类型" prop="mqType">
          <el-select v-model="form.mqType">
            <el-option v-for="t in (options.mqTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
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
      <template v-if="currentType === 'LB'">
        <el-form-item label="类型" prop="lbType">
          <el-select v-model="form.lbType">
            <el-option v-for="t in (options.lbTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" prop="lbVersion">
          <el-input v-model="form.lbVersion" placeholder="如 1.25.4" />
        </el-form-item>
      </template>

      <!-- 存储专有 -->
      <template v-if="currentType === 'STORAGE'">
        <el-form-item label="类型" prop="storageType">
          <el-select v-model="form.storageType">
            <el-option v-for="t in (options.storageTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商/型号" prop="storageVendor">
          <el-input v-model="form.storageVendor" placeholder="如 Ceph Reef / NetApp" />
        </el-form-item>
      </template>

      <!-- 网络设备专有 -->
      <template v-if="currentType === 'NETDEV'">
        <el-form-item label="类型" prop="netDevType">
          <el-select v-model="form.netDevType">
            <el-option v-for="t in (options.netDevTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
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
      <template v-if="currentType === 'GPU'">
        <el-form-item label="厂商" prop="gpuVendor">
          <el-select v-model="form.gpuVendor">
            <el-option v-for="t in (options.gpuVendors || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="型号" prop="gpuModel">
          <el-input v-model="form.gpuModel" placeholder="如 A100-SXM4-80GB" />
        </el-form-item>
        <el-form-item label="GPU 数" prop="gpuCount">
          <el-input-number v-model="form.gpuCount" :min="1" :max="256" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 电能监控专有 -->
      <template v-if="currentType === 'POWER'">
        <el-form-item label="类型" prop="powerType">
          <el-select v-model="form.powerType">
            <el-option v-for="t in (options.powerTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商" prop="powerVendor">
          <el-input v-model="form.powerVendor" placeholder="如 华为 / 施耐德" />
        </el-form-item>
        <el-form-item label="额定功率(kW)" prop="ratedPower">
          <el-input-number v-model="form.ratedPower" :min="0" :max="100000" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 储能监控专有 -->
      <template v-if="currentType === 'ESS'">
        <el-form-item label="类型" prop="essType">
          <el-select v-model="form.essType">
            <el-option v-for="t in (options.essTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="厂商" prop="essVendor">
          <el-input v-model="form.essVendor" placeholder="如 宁德时代 / 比亚迪" />
        </el-form-item>
        <el-form-item label="容量(kWh)" prop="essCapacity">
          <el-input-number v-model="form.essCapacity" :min="0" :max="1000000" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 物联感知专有 -->
      <template v-if="currentType === 'IOT'">
        <el-form-item label="类型" prop="iotType">
          <el-select v-model="form.iotType">
            <el-option v-for="t in (options.iotTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="协议" prop="iotProtocol">
          <el-select v-model="form.iotProtocol">
            <el-option v-for="t in (options.iotProtocols || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="频段" prop="iotBand">
          <el-select v-model="form.iotBand">
            <el-option v-for="t in (options.iotBands || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 单板机专有 -->
      <template v-if="currentType === 'SBC'">
        <el-form-item label="板型" prop="boardModel">
          <el-select v-model="form.boardModel" placeholder="请选择">
            <el-option v-for="t in (options.boardModels || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="SoC 型号" prop="socModel">
          <el-input v-model="form.socModel" placeholder="如 BCM2712 / RK3588" />
        </el-form-item>
        <el-form-item label="CPU 架构" prop="cpuArch">
          <el-select v-model="form.cpuArch" placeholder="请选择">
            <el-option v-for="t in (options.cpuArchs || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 安卓多开专有 -->
      <template v-if="currentType === 'ANDROID'">
        <el-form-item label="系统类型" prop="androidType">
          <el-select v-model="form.androidType" placeholder="请选择">
            <el-option v-for="t in (options.androidTypes || [])" :key="t" :label="optLabel(t)" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="安卓版本" prop="androidVersion">
          <el-select v-model="form.androidVersion" placeholder="请选择">
            <el-option v-for="t in (options.androidVersions || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="实例容量" prop="instanceCap">
          <el-input-number v-model="form.instanceCap" :min="1" :max="2000" controls-position="right" />
        </el-form-item>
      </template>

      <!-- 采集配置（无探针 agentless 凭据） -->
      <el-divider content-position="left">采集配置</el-divider>
      <el-form-item label="采集方式" prop="collectVia">
        <el-select v-model="form.collectVia" placeholder="请选择">
          <el-option label="模拟数据" value="NONE" />
          <template v-if="directProfile.label">
            <el-option :label="directProfile.label" value="DIRECT" />
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
        <el-form-item v-if="directProfile.showUser" label="用户名" prop="collectUser">
          <el-input v-model="form.collectUser" :placeholder="directProfile.userPh" />
        </el-form-item>
        <el-form-item v-if="directProfile.showPass" label="密码" prop="collectSecret">
          <el-input v-model="form.collectSecret" type="password" show-password :placeholder="directProfile.passPh" />
        </el-form-item>
        <el-form-item v-if="directProfile.showToken" label="Token" prop="collectSecret">
          <el-input v-model="form.collectSecret" type="textarea" :rows="2" :placeholder="directProfile.passPh" />
        </el-form-item>
        <el-form-item v-if="directProfile.showPath" label="状态页路径" prop="collectUser">
          <el-input v-model="form.collectUser" :placeholder="directProfile.userPh" />
        </el-form-item>
        <el-form-item label=" ">
          <span style="color: #909399; font-size: 12px; line-height: 1.5">{{ directProfile.hint }}</span>
        </el-form-item>
      </template>
    </el-form>

    <div slot="footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addDevice, updateDevice, getDeviceOptions } from "@/api/monitor-device";

const TYPE_LABEL = {
  SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "K8s集群",
  MQ: "消息中间件", LB: "负载均衡", STORAGE: "存储", NETDEV: "网络设备", GPU: "GPU",
  POWER: "电能", ESS: "储能", IOT: "物联感知", SBC: "单板机", ANDROID: "安卓多开",
};

// 枚举下拉项的中文标签映射：非专业用户难以辨识 SWITCH/FIREWALL 等原始枚举值
const OPT_LABEL = {
  // 网络设备
  SWITCH: "交换机", FIREWALL: "防火墙", ROUTER: "路由器",
  // 消息中间件 / 负载均衡（技术名保留原写法）
  KAFKA: "Kafka", ROCKETMQ: "RocketMQ", RABBITMQ: "RabbitMQ",
  NGINX: "Nginx", HAPROXY: "HAProxy", ALB: "应用型负载均衡(ALB)", F5: "F5 硬件负载均衡",
  // 存储
  CEPH: "Ceph 分布式存储", SAN: "SAN 块存储", NAS: "NAS 文件存储", MINIO: "MinIO 对象存储",
  // GPU 厂商
  NVIDIA: "英伟达 NVIDIA", AMD: "AMD", HUAWEI: "华为昇腾",
  // 电能
  UPS: "UPS 不间断电源", PDU: "PDU 机柜配电", METER: "电力计量表",
  // 储能
  LFP: "磷酸铁锂 LFP", NCM: "三元锂 NCM", LTO: "钛酸锂 LTO",
  // 物联类型/协议
  INFRARED: "红外感知", ENV: "环境监测", RF_GW: "射频网关", CAMERA: "摄像头",
  LORA: "LoRa", ZIGBEE: "ZigBee", MQTT: "MQTT", MODBUS: "Modbus", NB_IOT: "NB-IoT",
  // K8s 发行版/运行时/CNI
  VANILLA: "原生 Kubernetes", OPENSHIFT: "OpenShift", RANCHER: "Rancher", EKS: "AWS EKS", AKS: "Azure AKS", GKE: "Google GKE", K3S: "K3s",
  CONTAINERD: "containerd", DOCKER: "Docker", CRIO: "CRI-O",
  CALICO: "Calico", FLANNEL: "Flannel", CILIUM: "Cilium", WEAVE: "Weave",
  // 数据库
  MYSQL: "MySQL", MARIADB: "MariaDB", POSTGRESQL: "PostgreSQL", ORACLE: "Oracle", SQLSERVER: "SQL Server", DM: "达梦 DM", KINGBASE: "人大金仓 KingbaseES", GAUSSDB: "华为 GaussDB", OPENGAUSS: "openGauss", TIDB: "TiDB", MONGODB: "MongoDB", CLICKHOUSE: "ClickHouse",
  // 安卓多开
  CLOUD_PHONE: "云手机", EMULATOR: "模拟器", REAL_FARM: "真机农场",
};
const DEFAULT_PORT = {
  SERVER: 22, REDIS: 6379, DATABASE: 3306, K8S: 6443,
  MQ: 9092, LB: 80, STORAGE: 6789, NETDEV: 161, GPU: 8080,
  POWER: 502, ESS: 502, IOT: 1883, SBC: 22, ANDROID: 5555,
};

// 「直连采集」凭据档案：按设备类型驱动采集方式标签、默认端口与所需凭据字段
// （统一复用 collectUser/collectSecret/collectPort，后端门控为 collectVia 非 NONE/AGENT）。
const DIRECT_PROFILE = {
  REDIS: {
    label: "直连采集(INFO)", port: 6379, showUser: true, showPass: true,
    userPh: "Redis 6+ ACL 用户名；留空走默认用户/仅密码",
    passPh: "Redis 访问密码(requirepass 或 ACL 密码)",
    hint: "直连目标 Redis 端口执行 INFO 只读采集；集群/哨兵填任一可达节点，凭据(同一 ACL)对各节点通用",
  },
  DATABASE: {
    label: "直连采集(JDBC)", port: 3306, showUser: true, showPass: true,
    userPh: "数据库账号(只读权限即可)",
    passPh: "数据库密码",
    hint: "通过 JDBC 直连执行只读统计查询；库名取上方「数据库名」。当前支持 MySQL/MariaDB、PostgreSQL，其余类型回落模拟",
  },
  MQ: {
    label: "直连采集", port: 15672, showUser: true, showPass: true,
    userPh: "RabbitMQ 管理用户(Kafka 可留空)",
    passPh: "RabbitMQ 管理密码(Kafka 可留空)",
    hint: "RabbitMQ 走管理 API(默认15672)需账号密码；Kafka 走 AdminClient(默认9092)无需账号密码，端口改填 9092 即可",
  },
  K8S: {
    label: "直连采集(apiserver)", port: 6443, showToken: true,
    passPh: "ServiceAccount Bearer Token",
    hint: "以 ServiceAccount Bearer Token 直连 apiserver(默认6443)只读采集节点/Pod；建议为其绑定只读 ClusterRole",
  },
  LB: {
    label: "直连采集(状态页)", port: 80, showPath: true,
    userPh: "状态页路径(选填，如 /nginx_status)",
    hint: "抓取 Nginx stub_status / HAProxy CSV 状态页(默认80)；Nginx 可用「状态页路径」覆盖默认探测路径",
  },
};

export default {
  name: "AddDeviceDialog",
  props: {
    value: { type: Boolean, default: false },
    deviceType: { type: String, default: "SERVER" },
    // 编辑模式：传入设备对象则进入编辑，提交走 updateDevice；为 null 时与原新增逻辑一致
    editDevice: { type: Object, default: null },
  },
  data() {
    return {
      submitting: false,
      options: {},
      isEdit: false,
      editId: null,
      // 当前设备类型：新增取自 props.deviceType；编辑取自 editDevice.type，且允许在编辑时修改
      currentType: this.deviceType,
      TYPE_LABEL,
      form: {
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
        iotBand: "2.4GHz",
        boardModel: "",
        socModel: "",
        cpuArch: "arm64",
        androidType: "",
        androidVersion: "",
        instanceCap: 64,
      },
      rules: {
        name: [{ required: true, message: "请输入设备名称", trigger: "blur" }],
        ip: [{ required: true, message: "请输入主机地址", trigger: "blur" }],
      },
    };
  },
  computed: {
    visible: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
    typeLabel() {
      return TYPE_LABEL[this.currentType] || "";
    },
    // 当前设备类型的「直连采集」凭据档案（无则为空对象，采集方式回落 Agent/SSH/SNMP/WinRM）
    directProfile() {
      return DIRECT_PROFILE[this.currentType] || {};
    },
    dialogTitle() {
      return this.isEdit ? "编辑设备" : `新增${this.typeLabel}设备`;
    },
    vmTypeOptions() {
      return (this.options.vmTypes || []).filter((v) => v !== "NONE");
    },
  },
  watch: {
    deviceType() {
      // 新增模式下外部类型变化时同步当前类型与默认端口（编辑模式由 onOpen 接管）
      if (!this.isEdit) {
        this.currentType = this.deviceType;
      }
      this.form.port = DEFAULT_PORT[this.deviceType] || 22;
    },
    "form.collectVia"(via) {
      if (via === "SSH") {
        this.form.collectPort = 22;
      } else if (via === "WINRM") {
        this.form.collectPort = 5985;
      } else if (via === "SNMP") {
        this.form.collectPort = 161;
        if (!this.form.collectSecret) this.form.collectSecret = "public";
      } else if (via === "DIRECT") {
        const prof = DIRECT_PROFILE[this.currentType];
        let p = prof ? prof.port : this.form.port || DEFAULT_PORT[this.currentType] || 6379;
        // MQ：Kafka 用 9092，RabbitMQ 用管理端口 15672
        if (this.currentType === "MQ") {
          p = String(this.form.mqType || "").toUpperCase().includes("KAFKA") ? 9092 : 15672;
        }
        this.form.collectPort = p;
      }
    },
  },
  methods: {
    vmLabel(t) {
      return (
        {
          KVM: "KVM",
          VMWARE: "VMware",
          HYPER_V: "Hyper-V",
          XEN: "Xen",
          VIRTUALBOX: "VirtualBox",
          OPENSTACK: "OpenStack",
          CLOUD_ECS: "云主机 ECS",
          APPLE_VZ: "Apple 虚拟化",
          PARALLELS: "Parallels",
          VMWARE_FUSION: "VMware Fusion",
        }[t] || t
      );
    },
    osLabel(t) {
      return { LINUX: "Linux", UNIX: "Unix", WINDOWS: "Windows", MACOS: "macOS" }[t] || t;
    },
    optLabel(t) {
      return OPT_LABEL[t] || t;
    },
    async onOpen() {
      if (this.editDevice) {
        this.isEdit = true;
        this.editId = this.editDevice.id;
        // 编辑模式：类型取自设备本身，允许后续修改纠正
        this.currentType = this.editDevice.type || this.deviceType;
        // 用已有设备数据回填表单（含采集配置字段）
        Object.keys(this.form).forEach((k) => {
          if (this.editDevice[k] !== undefined && this.editDevice[k] !== null) {
            this.$set(this.form, k, this.editDevice[k]);
          }
        });
      } else {
        this.isEdit = false;
        this.editId = null;
        this.currentType = this.deviceType;
        this.form.port = DEFAULT_PORT[this.deviceType] || 22;
      }
      if (!this.options.osTypes) {
        try {
          const res = await getDeviceOptions();
          this.options = res.content || {};
        } catch (e) {
          /* 接口层已提示 */
        }
      }
    },
    onClosed() {
      // 关闭后重置编辑状态与表单，下次打开恢复新增默认
      this.isEdit = false;
      this.editId = null;
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields();
      }
    },
    submit() {
      this.$refs.formRef.validate(async (ok) => {
        if (!ok) return;
        this.submitting = true;
        try {
          const f = this.form;
          const payload = { name: f.name, ip: f.ip, port: f.port, type: this.currentType };
          if (this.isEdit && this.editId != null) {
            payload.id = this.editId;
          }
          // 采集配置（无探针 agentless 凭据）
          payload.collectVia = f.collectVia;
          if (f.collectVia === "SSH" || f.collectVia === "WINRM") {
            payload.collectPort = f.collectPort;
            payload.collectUser = f.collectUser;
            payload.collectSecret = f.collectSecret;
          } else if (f.collectVia === "SNMP") {
            payload.collectPort = f.collectPort;
            payload.collectSecret = f.collectSecret;
          } else if (f.collectVia === "DIRECT") {
            payload.collectPort = f.collectPort;
            payload.collectUser = f.collectUser;
            payload.collectSecret = f.collectSecret;
          }
          if (this.currentType === "SERVER") {
            Object.assign(payload, {
              category: f.category,
              vmType: f.category === "VM" ? f.vmType : "NONE",
              osType: f.osType,
              osName: f.osName,
              collectMode: f.collectMode,
            });
          } else if (this.currentType === "REDIS") {
            Object.assign(payload, {
              redisVersion: f.redisVersion,
              redisMode: f.redisMode,
              redisRole: f.redisRole,
            });
          } else if (this.currentType === "DATABASE") {
            Object.assign(payload, {
              dbType: f.dbType,
              dbName: f.dbName,
              dbVersion: f.dbVersion,
            });
          } else if (this.currentType === "K8S") {
            Object.assign(payload, {
              k8sVersion: f.k8sVersion,
              k8sDistro: f.k8sDistro,
              k8sRuntime: f.k8sRuntime,
              k8sCni: f.k8sCni,
              nodeCount: f.nodeCount,
            });
          } else if (this.currentType === "MQ") {
            Object.assign(payload, {
              mqType: f.mqType,
              mqVersion: f.mqVersion,
              brokerCount: f.brokerCount,
            });
          } else if (this.currentType === "LB") {
            Object.assign(payload, { lbType: f.lbType, lbVersion: f.lbVersion });
          } else if (this.currentType === "STORAGE") {
            Object.assign(payload, {
              storageType: f.storageType,
              storageVendor: f.storageVendor,
            });
          } else if (this.currentType === "NETDEV") {
            Object.assign(payload, {
              netDevType: f.netDevType,
              netDevVendor: f.netDevVendor,
              netDevModel: f.netDevModel,
            });
          } else if (this.currentType === "GPU") {
            Object.assign(payload, {
              gpuVendor: f.gpuVendor,
              gpuModel: f.gpuModel,
              gpuCount: f.gpuCount,
            });
          } else if (this.currentType === "POWER") {
            Object.assign(payload, {
              powerType: f.powerType,
              powerVendor: f.powerVendor,
              ratedPower: f.ratedPower,
            });
          } else if (this.currentType === "ESS") {
            Object.assign(payload, {
              essType: f.essType,
              essVendor: f.essVendor,
              essCapacity: f.essCapacity,
            });
          } else if (this.currentType === "IOT") {
            Object.assign(payload, {
              iotType: f.iotType,
              iotProtocol: f.iotProtocol,
              iotBand: f.iotBand,
            });
          } else if (this.currentType === "SBC") {
            Object.assign(payload, {
              boardModel: f.boardModel,
              socModel: f.socModel,
              cpuArch: f.cpuArch,
            });
          } else if (this.currentType === "ANDROID") {
            Object.assign(payload, {
              androidType: f.androidType,
              androidVersion: f.androidVersion,
              instanceCap: f.instanceCap,
            });
          }
          const res = this.isEdit
            ? await updateDevice(payload)
            : await addDevice(payload);
          if (res.success) {
            this.$message.success(this.isEdit ? "保存成功" : "新增成功");
            this.visible = false;
            this.$emit("added", res.content);
            // 表单重置交由 @closed 处理，避免关闭动画期间字段闪烁
          }
        } finally {
          this.submitting = false;
        }
      });
    },
  },
};
</script>
