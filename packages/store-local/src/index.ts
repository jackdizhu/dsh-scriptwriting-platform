/**
 * 剧本领域声明（薄封装）。不实现数据库：复用 harness 的 SQLite storage seam。
 *
 * 装配责任在 bundle：先 storage → storage-sqlite → storage-domain，
 * 再由本包注入 ctx.storageDomain 打开下列领域 spec。
 * 参考：github-projects/deepseek-harness/docs/subsystems/storage.zh.md
 */

// TODO: 用 defineDomain + domainTable 声明剧本领域 spec（大纲/章节、世界地图、
//       人物关系、时间线、物体能力），字段 schema 见本决策记录遗留项 2。
// TODO: 导出 openScriptwritingDomains(ctx) —— 调 ctx.storageDomain.open(spec)，
//       在 ctx.effect 中持有句柄，disposer 调 Domain.close()。
export {}
