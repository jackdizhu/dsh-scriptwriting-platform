/**
 * 组合包装配入口。只做装配，不放业务逻辑。
 *
 * 装配顺序（依赖先行，来自 storage.zh.md 的 mount/form 顺序约束）：
 *   1. @deepseek-ai/dsh-storage        （hub / Definition）
 *   2. @deepseek-ai/dsh-storage-sqlite （Provider，注册 backend `sqlite`）
 *   3. @deepseek-ai/dsh-storage-domain （Consumer，`ctx.storageDomain`）
 *   4. dsh-scriptwriting-core / store / tools / ui
 *
 * 注意：backend 与 data-form 的具体加载由 profile 的 bundles/patch 顺序决定，
 * 本入口只装配本平台自有插件；harness 的 storage 三包由 profile 侧保证先行。
 */

// TODO: 导出 apply(ctx)，按上述顺序 ctx.plugin() 装配本平台四个插件。
export {}
