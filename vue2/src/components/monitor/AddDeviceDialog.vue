<template>
  <el-dialog
    :title="`新增${typeLabel}设备`"
    :visible.sync="visible"
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
              v-for="t in vmTypeOptions"
              :key="t"
              :label="vmLabel(t)"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作系统" prop="osType">
          <el-select v-model="form.osType" placeholder="请选择">
            <el-option v-for="t in (options.osTypes || [])" :key="t" :label="t" :value="t" />
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
            <el-option v-for="t in (options.dbTypes || [])" :key="t" :label="t" :value="t" />
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
            <el-option v-for="t in (options.k8sDistros || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="容器运行时" prop="k8sRuntime">
          <el-select v-model="form.k8sRuntime">
            <el-option v-for="t in (options.k8sRuntimes || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="CNI 插件" prop="k8sCni">
          <el-select v-model="form.k8sCni">
            <el-option v-for="t in (options.k8sCnis || [])" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="节点数" prop="nodeCount">
          <el-input-number v-model="form.nodeCount" :min="1" :max="500" controls-position="right" />
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
import { addDevice, getDeviceOptions } from "@/api/monitor-device";

const TYPE_LABEL = { SERVER: "服务器", REDIS: "Redis", DATABASE: "数据库", K8S: "K8s集群" };
const DEFAULT_PORT = { SERVER: 22, REDIS: 6379, DATABASE: 3306, K8S: 6443 };

export default {
  name: "AddDeviceDialog",
  props: {
    value: { type: Boolean, default: false },
    deviceType: { type: String, default: "SERVER" },
  },
  data() {
    return {
      submitting: false,
      options: {},
      form: {
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
      return TYPE_LABEL[this.deviceType] || "";
    },
    vmTypeOptions() {
      return (this.options.vmTypes || []).filter((v) => v !== "NONE");
    },
  },
  watch: {
    deviceType() {
      this.form.port = DEFAULT_PORT[this.deviceType] || 22;
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
        }[t] || t
      );
    },
    async onOpen() {
      this.form.port = DEFAULT_PORT[this.deviceType] || 22;
      if (!this.options.osTypes) {
        try {
          const res = await getDeviceOptions();
          this.options = res.content || {};
        } catch (e) {
          /* 接口层已提示 */
        }
      }
    },
    submit() {
      this.$refs.formRef.validate(async (ok) => {
        if (!ok) return;
        this.submitting = true;
        try {
          const f = this.form;
          const payload = { name: f.name, ip: f.ip, port: f.port, type: this.deviceType };
          if (this.deviceType === "SERVER") {
            Object.assign(payload, {
              category: f.category,
              vmType: f.category === "VM" ? f.vmType : "NONE",
              osType: f.osType,
              osName: f.osName,
              collectMode: f.collectMode,
            });
          } else if (this.deviceType === "REDIS") {
            Object.assign(payload, {
              redisVersion: f.redisVersion,
              redisMode: f.redisMode,
              redisRole: f.redisRole,
            });
          } else if (this.deviceType === "DATABASE") {
            Object.assign(payload, {
              dbType: f.dbType,
              dbName: f.dbName,
              dbVersion: f.dbVersion,
            });
          } else if (this.deviceType === "K8S") {
            Object.assign(payload, {
              k8sVersion: f.k8sVersion,
              k8sDistro: f.k8sDistro,
              k8sRuntime: f.k8sRuntime,
              k8sCni: f.k8sCni,
              nodeCount: f.nodeCount,
            });
          }
          const res = await addDevice(payload);
          if (res.success) {
            this.$message.success("新增成功");
            this.visible = false;
            this.$emit("added", res.content);
            this.$refs.formRef.resetFields();
          }
        } finally {
          this.submitting = false;
        }
      });
    },
  },
};
</script>
