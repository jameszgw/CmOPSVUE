# 监控模块实现规范（vue2 / vue3）

本规范用于补全"系统监控"三个页面（Server / Redis / 数据库）的各标签页组件。
后端为 CmOPS（Spring Boot，模拟数据），响应体统一 `{ success, code, msg, content }`，
前端 `request()` 已自动解包到 `res.content`。所有指标接口入参为 `deviceId`。

## 1. 目录与命名

- vue3 标签页：`vue3/src/views/monitor/{server|redis|database}/*.vue`（`<script setup>` + Element Plus）
- vue2 标签页：`vue2/src/views/monitor/{server|redis|database}/*.vue`（Options API + Element UI 2.x）
- 共享组件（两套各一份，已就绪）：`components/monitor/{StatCard,SectionCard,InfoTable,MonitorLayout,AddDeviceDialog}.vue`
- API（已就绪）：`api/monitor-server.js`、`api/monitor-redis.js`、`api/monitor-database.js`

## 2. 组件契约（已实现，直接复用）

- **StatCard** props：`icon`（vue3=Element Plus 图标组件名字符串，如 `"Cpu"`；vue2=Element UI 字体类，如 `"el-icon-cpu"`）、
  `label`、`value`、`sub`、`tag`、`percent`（传则显示进度条）、`color`。
- **SectionCard** props：`title`、`icon`；具名插槽 `extra`（右上角说明文字）+ 默认插槽。
- **InfoTable** props：`rows`（`[{label,value,color?,tag?}]`）、`columns`（每行标签/值对数，默认 1，可设 2）。

## 3. 数据加载模式（必须遵循）

每个标签页接收 props：`deviceId:String`、`device:Object`、`refreshToken:Number`。
挂载时加载，`deviceId` 或 `refreshToken` 变化时重新加载。

**vue3（script setup）**：
```js
const props = defineProps({ deviceId:{type:String,default:""}, device:{type:Object,default:()=>({})}, refreshToken:{type:Number,default:0} });
const loading = ref(false); const data = ref({}); const d = computed(()=>data.value||{});
const load = async () => { if(!props.deviceId) return; loading.value=true; try { const res = await getXxx(props.deviceId); data.value=res.content||{}; } finally { loading.value=false; } };
watch(()=>[props.deviceId, props.refreshToken], load); onMounted(load);
```
**vue2（Options API）**：`props` 同上；`data(){return{loading:false,d:{}}}`；
`watch:{deviceId(){this.load()},refreshToken(){this.load()}}`；`mounted(){this.load()}`；
`methods.load()` 内 `this.d = res.content||{}`。

外层根元素加 `v-loading="loading"`，class 用 `tab-pane`。
ECharts 用法见参考实现（`init` + `setOption`，`beforeDestroy/onBeforeUnmount` 中 `dispose`）。

## 4. 参考实现（已完成，请对照风格）

- 服务器 系统信息：`views/monitor/server/SystemInfo.vue`（统计卡 + 双 InfoTable + echarts 面积图 + el-table）
- 服务器 CPU：`views/monitor/server/CpuInfo.vue`（统计卡 + InfoTable + 进度条网格 + 指标网格）

## 5. 布局约定

- 顶部一排统计卡：`<el-row :gutter="12" class="stat-row">` + `<el-col :xs="24" :sm="12" :lg="6">`（3 卡用 `:sm="8"`），
  `.stat-row .el-col{margin-bottom:12px}`。
- 各区块用 SectionCard 包裹；两列并排用 `<el-col :xs="24" :lg="12">`。
- 表格用 `el-table size="small" stripe`；vue3 列模板 `#default="{ row }"`，vue2 用 `slot-scope="{ row }"`。
- 不要写死 4K 宽度，使用响应式栅格即可。

## 6. 各接口 content 字段（用于渲染，字段已确定）

### 服务器 monitor-server.js

`getServerMemory(deviceId)` —— 对应截图 `Server监控——内存详情.png`
```
{ total, used, available, usage(数字%), peak,
  ram:{ total,used,free,available,cached,buffers,shared,usage },
  swap:{ total,used,free,usage },
  distribution:{ used,cached,buffers,free,shared,available },
  realtime:{ total,available,cached,free } }
```
卡片：内存使用率(usage,进度条)/已使用(used)/可用(available)/内存峰值(peak)。
区块：虚拟内存(RAM) InfoTable(columns=2)、交换分区(Swap)、内存分布(distribution 用卡片或 InfoTable)、实时内存详情。

`getServerDisk(deviceId)` —— 截图 `Server监控——磁盘信息.png`
```
{ readSpeed, writeSpeed, totalCapacity, totalWritten,
  partitions:[ { mount,device,fs,total,used,free,usage(数字%) } ],
  ioStats:{ read:{count,bytes,time}, write:{count,bytes,time} },
  realtime:{ readSpeed, writeSpeed } }
```
卡片：读取速度/写入速度/总容量/总写入。每个分区一个 SectionCard：`磁盘空间` 进度条(usage)+设备/文件系统/总容量/可用 InfoTable。再加 磁盘IO统计(读/写)与实时磁盘IO。

`getServerNetwork(deviceId)` —— 截图 `Server监控——网络信息.png`
```
{ upSpeed, downSpeed, totalSent, totalRecv,
  interfaces:[ { name,status,speed,mtu,sentBytes,recvBytes,sentPackets,recvPackets,sentErrors,recvErrors } ],
  totalStats:{ sent:{bytes,packets,errors,drops}, recv:{bytes,packets,errors,drops} },
  realtime:{ upSpeed, downSpeed } }
```
卡片：上传速度/下载速度/总发送/总接收。每个接口一个 SectionCard 的 InfoTable(columns=2)。网络总计统计(发送/接收)+实时网络IO。

`getServerProcess(deviceId)` —— 截图 `Server监控——进程信息.png`
```
{ total, running, sleeping, other, limited(bool), limitNote,
  topProcess:[ {pid,name,cpu,mem,status,createTime} ],
  statusDist:{ running,sleeping,other,total },
  resourceRank:[ {rank,name,pid,cpu,mem} ] }
```
卡片：总进程数/运行中/休眠中/其他状态。Top进程 el-table。进程状态分布(列表+占比)。资源使用排行(带 PID 的排行卡片列表)。
若 `limited` 为真，顶部用 `el-alert` 展示 `limitNote`（无 Agent 提示）。

### Redis monitor-redis.js

`getRedisOverview(deviceId)` —— 截图 `Redis监控——概览信息.png`
```
{ memoryUsage, connectedClients, blockedClients, hitRate,
  basic:{ version,mode,role,address,arch,tcpPort,uptime,uptimeDays,connStatus },
  memory:{ usedMemory,datasetMemory,rssMemory,maxMemory,peakMemory,fragmentation,totalSystemMemory,fragRatio },
  connStats:{ total,rejected,blocked,monitor },
  cmdStats:{ totalProcessed,opsPerSec,keyspaceHits,keyspaceMisses },
  keyspace:[ {name,index,keys,expires,avgTtl,expireRate} ],
  netInput:{ totalBytes,perSec }, netOutput:{ totalBytes,perSec } }
```
卡片：内存使用率(进度条)/连接客户端/阻塞客户端/命中率(进度条)。Redis基础信息 InfoTable(columns=2 或 3)。内存信息 InfoTable(columns=2)。连接统计/命令统计(卡片)。键空间信息。网络输入/输出。

`getRedisMemory(deviceId)` —— 截图 `Redis监控——内存信息.png`
```
{ usage, peak, fragRatio,
  detail:{ usedMemory,rssMemory,peakMemory,totalSystemMemory,datasetMemory,allocatorAllocated,allocatorActive,fragRatio },
  policy:{ maxMemory,maxMemoryDesc,evictionPolicy },
  trend:{ times:[], values:[] } }
```
卡片：内存使用率/内存峰值/内存碎片率。内存使用详情 InfoTable(columns=2)。内存策略配置(最大内存限制+淘汰策略)+淘汰策略说明(静态文案 noeviction/allkeys-lru/volatile-lru/allkeys-random/volatile-random/volatile-ttl)。内存使用趋势 echarts 折线(times/values)。

`getRedisClients(deviceId)` —— 截图 `Redis监控——客户端.png`
```
{ connectedClients, blockedClients, totalConnections,
  clients:[ {id,addr,name,db,status,idle,idleTime,outputBuffer,lastCmd} ] }
```
卡片：连接客户端/阻塞客户端/总连接数。客户端连接列表 el-table（客户端ID/地址/名称/数据库/状态/空闲时间(idleTime)/输出缓冲(outputBuffer)/最后命令(lastCmd)）。

`getRedisKeyspace(deviceId)` —— 截图 `Redis监控—键空间.png`
```
{ totalKeys, expiredKeys, avgTtl,
  databases:[ {name,index,keys,expires,avgTtl,expireRate} ] }
```
卡片：总键数/过期键数/平均TTL。数据库列表：每个 DB 一张卡片(键数量 keys 进度/过期键 expires/平均TTL)。字段说明(静态文案)。

`getRedisStatistics(deviceId)` —— 截图 `Redis监控——统计信息.png`
```
{ opsPerSec, hitRate, totalCommands, totalConnections,
  cmdStats:{ totalCommands,opsPerSec,keyspaceHits,keyspaceMisses,hitRate },
  connStats:{ totalConnections,rejectedConnections,totalInputBytes,totalOutputBytes,netInputRate,netOutputRate },
  keyOps:{ expiredKeys,evictedKeys,keyspaceHits,keyspaceMisses },
  syncStats:{ fullSync,partialOk,partialErr,masterReplOffset,lastForkUsec } }
```
卡片：每秒操作数/缓存命中率/总命令数/总连接数。命令统计/连接统计/键操作统计/同步统计 各 InfoTable。指标说明(静态)。

`getRedisSlowlog(deviceId)` —— 截图 `Redis监控——慢日志.png`
```
{ total, avgTime, maxTime, avgTimeUs, maxTimeUs,
  logs:[ {id,time,command,clientIp,clientName,costUs,costMs,ratio} ] }
```
卡片：慢日志总数/平均耗时(avgTime)/最大耗时(maxTime)。慢日志列表：每条一张卡片（#序号 + ID + time + 命令 command + 客户端 clientIp/clientName + 耗时占比 ratio 进度条）。慢日志说明(静态)。`total=0` 时 el-empty。

### 数据库 monitor-database.js

`getDatabaseOverview(deviceId)` —— 截图 `数据库监控——概临信息.png`
```
{ connUsage, dbSize, hitRate, activeConnections,
  basic:{ dbType,host,dbName,version,uptime,timezone,charset },
  connection:{ total,max,active,idle,usage },
  storage:{ sizeGb,sizeMb,sizeBytes },
  performance:{ hitRate,commits,rollbacks,tuplesReturned } }
```
卡片：连接使用率(进度条)/数据库大小(dbSize)/缓存命中率(进度条)/活动连接。基本信息 InfoTable。连接信息 InfoTable。存储信息 InfoTable。性能统计 InfoTable。

`getDatabaseConnection(deviceId)` —— 截图 `数据库监控——连接信息.png`
```
{ total, max, active, idle,
  pool:{ usage,active,idle,total,capacityUsed,capacityMax,state },
  detail:{ total,max,active,idle,used,usage,available,state } }
```
卡片：总连接数/最大连接数/活动连接/空闲连接。连接pool状态(连接使用率进度条 + 连接分布列表 + 连接pool容量 capacityUsed/capacityMax 进度条)。连接详细信息 InfoTable。连接说明(静态)。

`getDatabasePerformance(deviceId)` —— 截图 `数据库监控——性能统计.png`
```
{ hitRate, commits, rollbacks,
  txStats:{ commits,rollbacks,commitRate,hitRate },
  tupleOps:{ returned,fetched,inserted,updated,deleted } }
```
卡片：缓存命中率(进度条)/事务提交(commits)/事务回滚(rollbacks)。事务统计 InfoTable(可带进度条行：提交率 commitRate、命中率 hitRate)。元组操作 InfoTable。性能指标说明(静态)。

`getDatabaseTables(deviceId)` —— 截图 `数据库监控——表统计.png`
```
{ tableCount, totalRows, totalSize,
  topTables:[ {rank,schema,name,rows,size} ],
  allTables:[ {schema,name,rows,size,sizeBytes,inserts,updates,deletes,deadTuples} ] }
```
卡片：表数量/总行数(totalRows)/总大小(totalSize)。Top 10 最大的表 el-table。所有表详情：每张表一张卡片(行数/大小/插入/更新/删除/死元组)用响应式栅格。

## 7. 验收

- vue3：`cd vue3 && npm run build` 通过；vue2：`cd vue2 && npm run build` 通过。
- 与对应截图布局一致（统计卡在顶部、分区清晰、表格/进度条/图表齐全）。
- 字段缺失需空值兜底（`?.` 或 `&&`），避免渲染报错。

---

## 8. v4.0 深化:P0 深度指标 + 告警阈值中心(新增)

### 8.1 Redis 持久化/复制 `getRedisPersistence(deviceId)` → redis/Persistence.vue
```
{ rdbOk, aofOk, aofEnabled, connectedSlaves, maxSlaveLagHuman,
  rdb:{ lastSaveTime, changesSinceSave, lastBgsaveStatus, bgsaveInProgress, lastBgsaveTimeSec, rdbSize },
  aof:{ enabled, lastWriteStatus, lastRewriteStatus, rewriteInProgress, aofSize, aofBaseSize },
  replication:{ role, mode, connectedSlaves, masterReplOffset, maxSlaveLagBytes, maxSlaveLagHuman,
                masterLinkStatus, slaves:[ {id,addr,state,offset,lagBytes,lagHuman} ] },
  sentinelEvents:[ {time,type,detail} ] }
```
卡片:RDB 状态(rdbOk)/AOF 状态(aofOk/aofEnabled)/从节点数(connectedSlaves)/最大主从偏移(maxSlaveLagHuman)。
区块:RDB 持久化 InfoTable、AOF 持久化 InfoTable、复制状态(主信息 + slaves el-table)、哨兵切换事件(sentinelEvents 时间线/表;为空显示 el-empty)。

### 8.2 数据库引擎指标 `getDatabaseEngine(deviceId)` → database/EngineMetrics.vue
```
{ dbType, engineLabel,
  stats:[ {label, value, unit, level} ],        // level: normal/warning/critical
  groups:[ {title, items:[ {label,value,unit,level} ]} ],
  topSql:[ {rank, sql, calls, avgMs, totalSec, rowsAvg} ] }
```
顶部显示 engineLabel(如 MySQL/PostgreSQL/MongoDB)。`stats` 用响应式指标网格渲染,按 level 上色
(normal 默认 / warning 橙 #e6a23c / critical 红 #f56c6c)。`groups` 每组一个 SectionCard 内含 InfoTable。
`topSql` 用 el-table(排名/SQL/调用次数 calls/平均耗时 avgMs ms/总耗时 totalSec s/平均行数 rowsAvg)。

### 8.3 服务器深度字段(在既有 server 标签页内增量补充)
- **DiskInfo**:`disk.maxAwait`;每个 `partitions[i]` 新增 `inodeUsage`(%)、`inodeTotal`、`await`(ms)、`avgQueue`、`util`(%)、`slow`(bool,await>30 高亮红);`ioStats.read/write.await`。在分区卡片补 inode 进度条与 await/队列;新增"磁盘时延概览"统计卡(maxAwait)。
- **NetworkInfo**:`maxRetransRate`、`maxLossRate`;`interfaces[i].retransRate/lossRate`;新增 `connStates:{established,timeWait,closeWait,listen,synRecv}`。在接口表补重传率/丢包率,新增"TCP 连接状态"SectionCard(各状态计数卡)与"重传/丢包"统计卡。
- **MemoryInfo**:`swapUsage`、`oomKillCount`、`kernel:{oomKillCount,oomLastTime,slab,slabReclaimable,slabUnreclaim,pageTables}`。新增"内核内存与 OOM"SectionCard(InfoTable:OOM 次数/最近 OOM 时间/Slab/可回收/不可回收/页表)。

### 8.4 告警中心 `AlertCenter.vue`(独立页面,非设备标签页)
api(`@/api/monitor-alert`):`getAlertStats / getActiveAlerts(level,deviceType) / getAlertHistory(limit) /
listAlertRules(deviceType) / addAlertRule / updateAlertRule / deleteAlertRule(id) / toggleAlertRule(id,enabled)`。

- **getAlertStats** → `{ activeTotal, critical, warning, historyTotal, resolved, acknowledged, ruleTotal, ruleEnabled, byType:{SERVER,REDIS,DATABASE} }`
- **getActiveAlerts** → `[ {id,ruleName,deviceName,deviceType,metricLabel,value,unit,comparator,threshold,level,levelText,message,status:'firing',firstTime,lastTime,durationMin} ]`
- **getAlertHistory** → 同上 + `{recoverTime,durationMin,status:'resolved'|'acknowledged'}`
- **listAlertRules** → `[ {id,name,deviceType,metricKey,metricLabel,unit,comparator(GT/GTE/LT/LTE),warnValue,criticalValue,durationSec,enabled,sampleMin,sampleMax} ]`

页面布局(`.page-container`,顶部用 el-tabs 切「告警概览 / 阈值规则」):
1. 顶部统计卡:活跃告警 activeTotal、严重 critical(红)、警告 warning(橙)、已恢复 resolved。再加按设备类型分布(byType)小卡或饼图。
2. 「告警概览」标签:活跃告警 el-table(级别 tag 红/橙、设备、指标、当前值+单位、比较符+阈值、message、firstTime、持续时长),
   顶部带 级别(全部/严重/警告)和 设备类型(全部/SERVER/REDIS/DATABASE) 两个 el-select 过滤(改变后重新拉取);下方历史告警 el-table(含恢复时间、状态 tag)。
3. 「阈值规则」标签:规则 el-table(名称/设备类型/指标/比较符+警告+严重阈值/持续/启用 el-switch(调 toggleAlertRule)),
   右上「新增规则」按钮 → el-dialog 表单(名称、设备类型 select、指标 metricKey/metricLabel、单位、comparator select、warnValue、criticalValue、durationSec);行内编辑/删除。
4. 自动刷新:概览数据每 5s 轮询一次(setInterval,卸载清理)。

比较符展示映射:GT→`>`、GTE→`≥`、LT→`<`、LTE→`≤`。级别色:critical `#f56c6c`、warning `#e6a23c`、normal/resolved `#67c23a`。

---

## 9. K8s / 容器集群监控(新增,deviceType="K8S",api `@/api/monitor-k8s`)

页面 `views/monitor/MonitorK8s.vue` 已就绪;标签页文件在 `views/monitor/k8s/*.vue`。状态色:Ready/Healthy/Bound/Running `#67c23a`,Warning/Pending `#e6a23c`,NotReady/Failed/CrashLoop/Unhealthy `#f56c6c`。

### 9.1 集群概览 `getK8sOverview` → k8s/Overview.vue
```
{ clusterName, version, distro, runtime, cni, apiServer,
  nodeTotal, nodeReady, nodeNotReady, podTotal, podRunning, podPending, podFailed, podSucceeded,
  namespaceCount, deploymentCount, statefulSetCount, daemonSetCount, serviceCount,
  cpu:{ capacity, allocatable, requestedPct, usedPct, usedCores },
  memory:{ capacity, allocatable, requestedPct, usedPct, used },
  controlPlane:{ apiserver, etcd, scheduler, controllerManager },   // "Healthy"/"Unhealthy"
  topNodes:[ {name, cpuPct, memPct} ] }
```
卡片:节点(nodeReady/nodeTotal)、Pod(podRunning,sub 显示 pending/failed)、CPU 使用率(cpu.usedPct 进度条)、内存使用率(memory.usedPct 进度条)。
区块:集群基础信息 InfoTable(版本/发行版/运行时/CNI/apiServer/命名空间数)、工作负载汇总(Deployment/StatefulSet/DaemonSet/Service 计数卡)、控制平面健康(4 个状态 tag)、CPU/内存 请求vs使用(进度条)、Top 节点(topNodes 进度条/表)。

### 9.2 节点 `getK8sNodes` → k8s/Nodes.vue
```
{ total, ready, notReady,
  nodes:[ {name, role(control-plane/worker), status(Ready/NotReady), ip, cpuPct, memPct,
           podCount, podCapacity, restarts, memoryPressure, diskPressure, pidPressure,
           kubeletVersion, os, runtime, age} ] }
```
卡片:节点总数/就绪/未就绪。el-table:名称、角色(tag)、状态(tag 红/绿)、CPU%(进度条或文本)、内存%、Pod(podCount/podCapacity)、重启、压力(MemoryPressure/DiskPressure/PIDPressure 为 true 时红色 tag)、kubelet 版本、OS、age。

### 9.3 工作负载 `getK8sPods` → k8s/Pods.vue
```
{ total, running, pending, failed, crashLoop, oomKilledTotal,
  workloads:{ deployments, statefulSets, daemonSets, jobs, cronJobs },
  pods:[ {name, namespace, node, status, ready("1/1"), restarts, cpu("100m"), mem("256Mi"), age, oomKilled} ],
  topRestart:[ {name, namespace, restarts, status} ] }
```
卡片:运行中 running、Pending pending、失败 failed、CrashLoopBackOff crashLoop(可加 OOMKilled oomKilledTotal)。
区块:工作负载类型计数(Deployment/StatefulSet/DaemonSet/Job/CronJob)、Pod 列表 el-table(名称/命名空间/节点/状态 tag/就绪/重启/CPU/内存/age;oomKilled 为 true 显示红色"OOMKilled" tag)、重启 Top(topRestart)。Pod 列表建议带状态筛选(可选)。

### 9.4 控制平面 `getK8sControlPlane` → k8s/ControlPlane.vue
```
{ apiserver:{ health, latencyP50, latencyP99, qps, errorRate, inflightRequests },
  etcd:{ health, hasLeader, dbSize, dbSizeUsagePct, fsyncP99, commitP99, leaderChanges },
  scheduler:{ health, schedulingLatencyP99, pendingPods, scheduleRate },
  controllerManager:{ health, workqueueDepth, workqueueLatencyP99 } }
```
四个组件各一个 SectionCard,标题带 health 状态 tag;内部用 InfoTable 列出各指标(延迟单位 ms,etcd dbSize 直接显示+dbSizeUsagePct 进度条)。

### 9.5 网络与存储 `getK8sNetStorage` → k8s/NetStorage.vue
```
{ network:{ cniPlugin, cniHealth, packetLossPct, podNetworkLatencyMs, serviceCount, endpointCount, networkPolicies },
  imagePull:{ failureRatePct, avgPullSec, totalPulls, failedPulls },
  storage:{ csiDriver, volumeAttachLatencyMs, pvTotal, pvBound, pvAvailable, pvcTotal, pvcBound, pvcPending,
            volumes:[ {name, namespace, status(Bound/Pending), capacity, storageClass, latencyMs} ] } }
```
卡片:CNI 丢包率(packetLossPct)、镜像拉取失败率(failureRatePct)、PV(pvBound/pvTotal)、PVC(pvcBound/pvcTotal)。
区块:网络(CNI 插件/健康/丢包/Pod网络延迟/Service/Endpoint/NetworkPolicy) InfoTable、镜像拉取 InfoTable、存储概况 InfoTable + 卷列表 el-table(volumes)。

### 9.6 事件 `getK8sEvents` → k8s/Events.vue
```
{ total, warningCount, normalCount,
  events:[ {type(Normal/Warning), reason, object, namespace, message, count, lastTime} ] }
```
卡片:事件总数 total、警告 warningCount(橙)、正常 normalCount(绿)。el-table:类型(tag warning/info)、原因 reason、对象 object、命名空间、消息 message、次数 count、最近时间 lastTime。建议默认按 type 可筛选(全部/Warning/Normal)。total=0 显示 el-empty。

---

## 10. P1 扩展设备(消息中间件/负载均衡/存储/网络设备/GPU)

通用约定同前:props `deviceId/device/refreshToken`;`load`+`watch`+`mounted/onMounted`;根 `<div v-loading="loading" class="tab-pane">`;复用 StatCard/SectionCard/InfoTable;统计卡 `<el-row :gutter="12" class="stat-row">`+`<el-col :xs="24" :sm="12" :lg="6">`(3 卡用 `:sm="8"`);状态色 正常/up/online/Established/active `#67c23a`,警告/near-full/degraded `#e6a23c`,异常/down/offline/failed `#f56c6c`。vue3 用 EP 图标名,vue2 用 el-icon-* 类、el-table 用 slot-scope。

### 10.1 消息中间件 `@/api/monitor-mq` → views/monitor/mq/*
- **Overview** `getMqOverview`:`{ mqType, version, address, brokerOnline, brokerTotal, brokerOffline, controllerActive, topicCount, partitionCount, consumerGroupCount, totalMessages, produceRate, consumeRate, totalLag, messageBacklog, underReplicated, offlinePartitions, diskUsagePct, inRate, outRate }`。卡片:Broker(brokerOnline/brokerTotal)、主题数、生产速率 produceRate(msg/s)、消费积压 totalLag。区块:基础信息 InfoTable、吞吐(produce/consume rate、in/out)、健康(underReplicated/offlinePartitions/diskUsagePct 进度条)。
- **Topics** `getMqTopics`:`{ topicCount, partitionCount, skewedCount, topics:[{name,partitions,replicas,messages,size,inRate,outRate,partitionSkewPct,skewed}] }`。卡片+el-table(skewed=true 时 partitionSkewPct 红色/“倾斜”tag)。
- **Consumers** `getMqConsumers`:`{ groupCount, maxLag, totalLag, rebalancingCount, highLagCount, groups:[{groupId,state,members,topics,lag,consumeRate,rebalanceCount,highLag}] }`。卡片+el-table(state tag:Stable 绿/Rebalancing 橙/Empty 灰;highLag=true lag 红)。
- **Brokers** `getMqBrokers`:`{ total, online, offline, brokers:[{id,host,ip,status,controller,cpuPct,memPct,diskPct,leaderPartitions,isrShrinks,underReplicated,flushLatencyMs}] }`。卡片+el-table(status tag,controller 标记,cpu/mem/disk 进度条或文本)。

### 10.2 负载均衡 `@/api/monitor-lb` → views/monitor/lb/*
- **Overview** `getLbOverview`:`{ lbType, version, address, status, uptime, qps, totalRequests, activeConnections, error5xxRate, error4xxRate, avgLatencyMs, upstreamHealthy, upstreamTotal, upstreamUnhealthy, inBytesRate, outBytesRate, sslEnabled, wafBlockedRate }`。卡片:QPS、5xx错误率(error5xxRate)、活动连接、上游(healthy/total)。区块:基础信息、流量、上游健康。
- **Traffic** `getLbTraffic`:`{ qps, trend:{times,qps,latency}, statusDist:{c2xx,c3xx,c4xx,c5xx}, latency:{p50,p90,p99,max}, bytes:{inRate,outRate,totalIn,totalOut} }`。echarts 折线(trend.times/qps);状态码分布(饼或进度条 c2xx/c3xx/c4xx/c5xx %);延迟 InfoTable;流量 InfoTable。
- **Upstreams** `getLbUpstreams`:`{ total, healthy, upstreams:[{name,serverCount,healthy,unhealthy,activeConn,avgResponseMs,members:[{server,status,weight,activeConn,fails,responseMs}]}] }`。每个 upstream 一个 SectionCard:概况 + members el-table(status tag)。
- **Connections** `getLbConnections`:`{ connections:{active,reading,writing,waiting,accepted,handled,droppedRate}, ssl:{handshakeMs,handshakesPerSec,sessionReuseRate,certDaysLeft,handshakeFailRate}, security:{wafBlocked,wafBlockedRate,rateLimited,rateLimitHitRate,sessionStickyFailRate} }`。三个 SectionCard 各一 InfoTable(certDaysLeft<30 橙/<7 红)。

### 10.3 存储 `@/api/monitor-storage` → views/monitor/storage/*
- **Overview** `getStorageOverview`:`{ storageType, vendor, address, health, healthText, totalCapacity, usedCapacity, availableCapacity, usagePct, iops, throughput, avgLatencyMs, poolCount, [Ceph: osdTotal,osdUp,osdDown,pgTotal,pgActiveClean,pgDegraded,scrubErrors,monQuorum] }`。卡片:使用率(usagePct 进度条)、IOPS、吞吐、延迟。区块:基础信息(含 health tag);Ceph 设备额外显示 OSD/PG 区块。
- **Pools** `getStoragePools`:`{ poolCount, nearFullCount, pools:[{name,capacity,used,usagePct,objects,replicas,status,iops}] }`。卡片+el-table(usagePct 进度条;status near-full 橙)。
- **Performance** `getStoragePerformance`:`{ iops:{read,write,total}, throughput:{read,write}, latency:{readMs,writeMs,p99Ms}, queueDepth, cacheHitRate, trend:{times,readIops,writeIops} }`。卡片(总 IOPS/缓存命中率/队列深度)+ IOPS/吞吐/延迟 InfoTable + echarts 折线(trend)。
- **Disks** `getStorageDisks`:`{ type, total, healthy, failed, slowCount, disks:[{id,host,status,capacity,used,usagePct,latencyMs,slow,smartStatus,temperature,reallocatedSectors}] }`。卡片+el-table(status tag、slow=true latency 红、smartStatus warning 橙)。

### 10.4 网络设备 `@/api/monitor-netdev` → views/monitor/netdev/*
- **Overview** `getNetDevOverview`:`{ netDevType, vendor, model, ip, status, uptime, cpuPct, memPct, temperature, portTotal, portUp, portDown, inThroughput, outThroughput, totalPacketLoss, sessionUsagePct, fanStatus, powerStatus }`。卡片:端口(portUp/portTotal)、CPU、丢包率(totalPacketLoss)、会话使用率(sessionUsagePct 进度条)。区块:基础信息(fan/power status tag)。
- **Ports** `getNetDevPorts`:`{ total, up, errorPorts, ports:[{name,status,speed,duplex,utilizationPct,inRate,outRate,inErrors,outErrors,crcErrors,dropsPct,hasError}] }`。卡片+el-table(status tag、hasError=true 红、utilizationPct 进度条)。
- **Sessions** `getNetDevSessions`:`{ isFirewall, sessionTable:{current,max,usagePct,newPerSec,tcpSessions,udpSessions,icmpSessions}, [防火墙: firewall:{policyHits,blockedSessions,blockedRate,threatBlocked,natSessions,vpnTunnels,ipsecTunnelsUp}] }`。会话表 InfoTable + usagePct 进度条;isFirewall 时额外 防火墙 SectionCard。
- **Protocols** `getNetDevProtocols`:`{ bgp:{total,established,down,neighbors:[{neighbor,as,state,uptime,prefixReceived}]}, ospf:{neighbors,areas,state}, lag:{total,degraded,channels:[{name,members,activeMembers,status,totalSpeed}]}, lldp:{neighbors,discoveredDevices} }`。BGP 邻居 el-table(state tag)、OSPF InfoTable、链路聚合 el-table(status degraded 橙)、LLDP InfoTable。

### 10.5 GPU/边缘 `@/api/monitor-gpu` → views/monitor/gpu/*
- **Overview** `getGpuOverview`:`{ vendor, model, driverVersion, cudaVersion, gpuTotal, gpuActive, avgUtilization, avgMemUsage, totalMemory, usedMemory, maxTemperature, totalPower, eccErrors, health, runningJobs, pendingJobs }`。卡片:GPU(gpuActive/gpuTotal)、平均利用率(avgUtilization 进度条)、显存使用率(avgMemUsage 进度条)、最高温(maxTemperature)。区块:基础信息(驱动/CUDA/电源/ECC/health tag)、任务(running/pending)。
- **Gpus** `getGpuCards`:`{ total, hotCount, gpus:[{index,model,utilizationPct,memUsagePct,memUsed,memTotal,temperature,hot,powerW,fanPct,processes,eccErrors,smClockMhz}] }`。每张卡一个 SectionCard 或 el-table(hot=true 温度红;util/mem 进度条)。
- **Workloads** `getGpuWorkloads`:`{ isEdge, inference:{modelCount,totalQps,avgLatencyP99,queueDepth,models:[{name,replicas,qps,latencyP99Ms,gpuMemMB,status}]}, edge:{nodeTotal,online,offline,nodes:[{name,location,status,latencyMs,gpuUtil,lastHeartbeat}]} }`。推理:卡片(modelCount/totalQps/avgLatencyP99)+ models el-table;边缘(isEdge 或 edge.nodeTotal>0 时):卡片(online/offline)+ nodes el-table(status online 绿/offline 红)。

---

## 11. P2 智能增值:监控大盘 + 全链路拓扑与根因

两个独立页面(非设备标签页,根 `<div class="page-container">`,5s 自动刷新,setInterval 卸载清理)。echarts 用法见现有 server/SystemInfo.vue。设备类型中文映射:SERVER 服务器/REDIS Redis/DATABASE 数据库/K8S 容器/MQ 消息队列/LB 负载均衡/STORAGE 存储/NETDEV 网络设备/GPU GPU。状态色:healthy `#67c23a`,warning `#e6a23c`,critical `#f56c6c`。

### 11.1 监控大盘 `getDashboardSummary` → views/monitor/MonitorDashboard.vue
```
{ deviceStats:{ total, online, offline, byType:{SERVER,REDIS,DATABASE,K8S,MQ,LB,STORAGE,NETDEV,GPU} },
  alertStats:{ active, critical, warning, trend:{times:[],critical:[],warning:[]} },
  healthScore(0-100), healthLevel,
  topProblems:[{deviceId,deviceName,type,critical,warning,topIssue}],
  recentAlerts:[{deviceName,deviceType,metricLabel,value,unit,level,levelText,message,firstTime}],
  resource:{avgCpu,avgMemory,avgDisk,avgNetwork} }
```
布局:① 顶部健康评分 echarts 仪表盘(gauge, healthScore, 颜色按分段)+ 4 张统计卡(设备总数/在线/活跃告警/严重)。② 设备类型分布 echarts 饼图(byType,用中文类型名)+ 告警趋势 echarts 折线(trend.times + critical/warning 两条线)。③ 资源水位概览(avgCpu/avgMemory/avgDisk/avgNetwork 四个 el-progress)。④ 问题设备 Top el-table(deviceName/类型/严重 critical/警告 warning/topIssue)。⑤ 最近告警 el-table(级别 tag/设备/指标 metricLabel/描述 message/首次 firstTime)。复用 StatCard/SectionCard。

### 11.2 拓扑与根因 `getTopologyGraph` + `getTopologyRootCause` → views/monitor/MonitorTopology.vue
graph:`{ nodes:[{id,name,type,layer(0..3),layerName,status,ip}], edges:[{source,target,relation,status}], layers:[4个名称], healthy, warning, critical }`
rootcause:`{ incidentCount, incidents:[{id,title,rootDeviceName,rootType,severity,severityText,affectedCount,chain:[{deviceName,type,role,symptom}],recommendation,confidence}] }`
布局:顶部统计卡(节点总数/健康/警告/严重/根因事件数)。主体左右两栏:
- 左(较宽):echarts **graph** 拓扑图。建议 `layout:"none"`,按 `layer` 分列布局节点 x 坐标(接入层→计算层→数据层→基础设施层,layer 0-3 映射到 x),同层节点纵向均分 y;`categories` 按 status 着色(healthy/warning/critical),节点 itemStyle 颜色用状态色,边 lineStyle 颜色按 edge.status;边可显示 relation(routes/depends/stores/network)。图例显示三种状态。两个 echarts(graph 与 dashboard 各图)在 onMounted/refresh 时 setOption,onBeforeUnmount dispose。
- 右(较窄):根因事件列表,每个 incident 一张卡片(SectionCard 或自定义):标题 title + 严重 tag(severityText 红/橙)+ 置信度 confidence% + 受影响 affectedCount;展开传播链 chain(根因→受影响,role 标注,symptom 说明);处置建议 recommendation。incidentCount=0 显示 el-empty“当前无根因事件”。
vue2 用 Options API + Element UI(el-table slot-scope、字体图标),vue3 用 `<script setup>` + Element Plus。

---

## 12. P2 续:智能分析(AIOps) + 韧性与安全

两个独立页面(根 `<div class="page-container">`,用 el-tabs 分区,5s 自动刷新)。设备类型中文映射同 §11。颜色:critical/high/failed `#f56c6c`,warning/medium `#e6a23c`,info/passed/low/正常 `#67c23a`。复用 StatCard/SectionCard/InfoTable。

### 12.1 智能分析 → views/monitor/MonitorAiops.vue
el-tabs 两页:「异常检测」「成本优化」。
- `getAiopsAnomalies` → `{ total, critical, warning, byType, anomalies:[{deviceId,deviceName,deviceType,metric,metricLabel,unit,baseline,currentValue,deviation(%),severity,severityText,detectedTime,method,description,trend:[数值数组]}] }`。
  异常检测页:统计卡(异常总数/严重/警告)+ el-table(设备/类型(中文)/指标 metricLabel/当前值 currentValue+unit/基线 baseline/偏离 deviation% 红橙/级别 tag/检测时间 detectedTime/方法 method)。可选:点击行展开 description + 一个 mini echarts 折线(trend)。
- `getAiopsCost` → `{ totalMonthlyCost, potentialSavings, savingsPct, idleCount, idleResources:[{deviceName,type,reason,idleMetric,monthlyCost,potentialSaving,recommendation}], utilizationByType:[{type,avgUtil,wasteCost}], forecast:{times,actual,predicted,fullInDays} }`(金额已是 "¥123" 字符串)。
  成本优化页:统计卡(月度成本 totalMonthlyCost/可节省 potentialSavings/节省占比 savingsPct%/闲置项 idleCount)+ 资源利用率 SectionCard(utilizationByType:type(中文) avgUtil 进度条 + wasteCost)+ 容量预测 echarts 折线(forecast.times + actual + predicted 两条线,fullInDays 说明“预计 N 天后达上限”)+ 闲置资源 el-table(设备/类型/原因 reason/闲置 idleMetric/月成本 monthlyCost/可节省 potentialSaving/建议 recommendation)。

### 12.2 韧性与安全 → views/monitor/MonitorResilience.vue
el-tabs 两页:「韧性评分」「安全基线」。
- `getResilienceScore` → `{ overallScore, grade(A/B/C/D), dimensions:[{name,score,weight}], drillTotal, drillPassed, drillFailed, drills:[{id,name,desc,status(passed/failed),statusText,lastRun,detectionTimeSec,recoveryTimeSec,alertAccuracy}], improvements:[字符串] }`。
  韧性评分页:左 echarts **雷达图**(dimensions 各维度 score,满分 100)+ 总分大数字(overallScore)与等级 grade tag;右 演练统计卡(通过 drillPassed/未通过 drillFailed)。混沌演练 el-table(场景 name/说明 desc/结果 status tag/最近 lastRun/检测耗时 detectionTimeSec s/恢复耗时 recoveryTimeSec s/告警准确率 alertAccuracy%)。改进建议 improvements 列表。
- `getSecurityDrift` → `{ total, highRisk, mediumRisk, lowRisk, drifts:[{deviceName,deviceType,category,target,baseline,current,risk(high/medium/low),riskText,detectedTime,description,recommendation}] }`。
  安全基线页:统计卡(漂移总数/高危 highRisk 红/中危 mediumRisk 橙/低危 lowRisk)+ el-table(设备/类型(中文)/类别 category/项 target/基线 baseline/当前 current(红)/风险 risk tag/时间 detectedTime/建议 recommendation)。total=0 时 el-empty。

echarts(雷达图/折线/mini 折线)init-once + setOption-on-refresh + dispose(vue3 onBeforeUnmount;vue2 beforeDestroy)。vue2 用 Options API + el-table slot-scope + 字体图标;vue3 用 `<script setup>` + Element Plus。
