// import { defineMock } from "umi";
// import Mock from "mockjs";

// export default defineMock({
//   "GET /api/devops/system/get-thread-metrics": (req, res) => {
//     const threadTypes = [
//       "TERMINAL",
//       "TERMINAL_MONITOR",
//       "BATCH_EXEC",
//       "FILE_TAIL",
//       "TRANSFER_PROGRESS",
//       "FILE_UPLOAD",
//       "FILE_DOWNLOAD",
//       "FILE_PACKAGE",
//       "APP_BUILD",
//       "APP_RELEASE_MAIN",
//       "APP_RELEASE_MACHINE",
//       "SCHEDULER_MAIN",
//       "SCHEDULER_MACHINE",
//       "APP_PIPELINE",
//     ];

//     const metrics = threadTypes.map((type) => ({
//       type,
//       activeThreadCount: Mock.Random.integer(0, 20),
//       totalTaskCount: Mock.Random.integer(100, 10000),
//       completedTaskCount: Mock.Random.integer(50, 9000),
//       queueSize: Mock.Random.integer(0, 50),
//     }));

//     res.json({
//       code: 200,
//       msg: "success",
//       success: true,
//       content: metrics,
//     });
//   },

//   "GET /api/devops/system/about": (req, res) => {
//     res.json({
//       code: 200,
//       msg: "success",
//       success: true,
//       content: {
//         version: "1.2.3",
//         kitVersion: "0.9.1",
//         author: "zhongwang",
//         authorCn: "zhongwang",
//       },
//     });
//   },
// });
