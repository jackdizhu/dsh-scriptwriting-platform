---
name: typescript
description: TypeScript/ESM 代码规范，整合自 deepseek-harness 根 AGENTS.md、packages/AGENTS.md、tsconfig.base.json、oxlint 配置与防御性模式。编写或审查任何 TS 代码时加载。
---

# TypeScript 代码规范

来源：`github-projects/deepseek-harness/AGENTS.md`、`packages/AGENTS.md`、`tsconfig.base.json`、`.oxlintrc.json`、`docs/defensive-patterns/`、`dsh-error-handling` skill。本仓库为树外插件，编译配置按自身包设定，但下列**代码纪律**全部适用。

## 1. 编译与模块

- 严格模式：`strict: true` + `noImplicitAny`；Harness 还开启 `noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`noImplicitOverride`、`noFallthroughCasesInSwitch`、`noUnusedLocals`、`noUnusedParameters`。新代码应按同等严格度编写，剩余 `any` 必须说明为何无法收窄。
- ESM everywhere（`"type": "module"`）。跨包用包名引用；本地相对导入写显式 `.ts` 后缀（编译产物改写为 `.js`）。
- 一个 tsconfig 只服务一个编译面；源码面与产物面（src vs lib）绝不混用。测试放包级 `tests/`，不放 `src/__tests__/`。
- `src/types.ts` 只放类型，不含运行时代码。

## 2. 类型纪律

- **判别标签分支**：闭合联合以 `assertNever` 收尾；可合并扩展的联合落到有文档的默认分支。
- **不新增 `as unknown` / `<unknown>`**；用类型化值或校验替代，保持或缩小既有基线。
- **跨边界 id 用品牌类型**：`Branded<B>`（`dsh-brand`），不用裸 `string`。
- **同进程类型化边界信任 TS**：静态接口已保证的值，不额外加运行时校验、回退或敌意输入测试。在解析/配置、队列、模型与工具 JSON、持久化/文件、worker、进程、wire 边界才做校验。
- **显式优于隐式**：默认值是拥有方一个显式的 `resolve(request): Spec` 步骤，不是 `run()` 里隐藏的 `?? default`。
- **共享状态有 owner**：挂在服务或实例上；禁止模块级缓存、单例、全局 `WeakMap`、`globalThis` / `window.__X__` 绕过，不新增全局 `current`/`active`/`selection`。
- **一个异步操作一个生命周期控制器或事务**：readiness、取消、dispose、reservation、sentinel 等分离状态需各自 owner 或 settlement 点。
- **在做出决策的操作里执行决策**：schema 省略、提示词过滤、facade、wrapper、监听器顺序都不构成强制；测试要经由执行器验证拒绝。
- **状态只在提交点发布**：操作成功后再发通知、更新派生（缓存、提示词、UI 回显、回放、查询视图）。
- **边界施加完整结果约束**：字节、token、条目、时间限制针对含包装与元数据的完整输出；覆盖极小值、恰好边界、超大单块、多字节。

## 3. 错误处理

- 预期失败用声明类型、稳定判别与结构化细节；**不要靠解析消息路由**。
- 带机器码的错误类继承 `HarnessError`（`dsh-error`，`dsh-llm` 亦再导出），`code` 为稳定 `UPPER_SNAKE_CASE`，通常带域名前缀。`name` 为类名（取消除外）。优先一个包/域一个类，仅在调用方按类型捕获或携带专属结构字段时才拆类。
- 外部错误在拥有依赖处转换（Node errno、SDK、协议、native、worker、跨 realm），保留原错误为 `cause`；外部数值/厂商码放消息而非 `code`。进程/worker 边界传输 `name` 与 `code` 并重建错误。
- 工具预期失败一律抛 `HarnessError`（手检参数 `ToolArgsError`/`INVALID_ARGS`；缺上下文 `ToolContextUnavailableError`；取消用信号 reason 或 `AbortError`/`ABORTED`；依赖失败按域映射）。策略拒绝须带 `info`（含 `name`/`code`）。`error.name`/`code` 会进 Session 日志与遥测，重命名属破坏性变更，需升级指南。
- 空 `catch` 三条件：`try` 只含一个语句；绑定命名预期失败（`catch (_cleanupFailed)`，不用 `catch {}` 或 `catch (_)`）；注释说明为何可安全丢弃（写在 catch 块内或 `}` 同行）。只接受部分失败时用非空 catch 校验 `code`/`name` 并重抛其余。
- 捕获只限制异常传播，不限制副作用。只有状态 owner 能确立安全继续；否则停止依赖工作、丢弃无效状态或上报。"记日志"不是恢复。重试需可安全重复、可取消、有明确 owner 与预算。
- 最终报告含可读摘要、受影响操作、安全下一步；不可信状态或未知结果必须通过 UI 或默认开启的日志可见，持久无效状态需持久可见。

## 4. 注释、JSDoc 与文档

- 每个模块与导出有简洁 JSDoc 覆盖非显然契约；函数式导出含 `@param`/`@returns`（由 `verify-export-jsdoc` 强制）。类型化事件 JSDoc 需 `@mode` 与 payload `@param`。公共服务方法记录参数与非 void 返回。
- 注释只陈述完整契约与上下文，不复述代码、不写推理过程/测试走查/评审历史；保留行为、失败、时序、归属、安全使用事实，理由用链接。
- 不用比喻。写 `response fields` / `JSON validation` / `ESM exports`，不用 `response shape` / `validation boundary` / `module shape`。`contract` 只用于前置/后置/不变量/兼容承诺等义务。
- 英文文案与插件标题用 sentence case。客户端 UI 文案走本地化字典与 `t`，禁止硬编码产品文案。
- TODO 标记按紧急度：`FIXME` / `TODO` / `XXX`。文件末尾恰好一个换行。

## 5. Cordis 特有约束（改插件代码时同时适用）

- 注册即效果：一切贡献走 `ctx.effect()` / `ctx.on()`；registry 的 `register()` 返回 disposer。函数插件具名导出 `name`/`inject`/`Config`/`apply`，**无 default export**；服务包 default-export 服务类；两者混用会让 Loader 丢弃命名空间。
- 可选服务用 `ctx.get(name)`，`ctx.<name>` 只留给已声明注入。
- waterfall 监听器必须调用 `next()`；不调用即短路。
- 遵守 HMR 可处置性：dispose fiber 后观测注册被移除；清理依赖必须在消费者结束前释放。
