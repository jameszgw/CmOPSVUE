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
