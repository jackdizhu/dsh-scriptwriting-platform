# dsh 插件开发指引（AI Agent 执行手册）

面向后续 AI Agent 的系统性开发文档。目标是在 `dsh-scriptwriting-platform`（剧本创作平台）中，用**一系列 dsh 插件**实现草稿生成、大纲、章节大纲、世界地图、人物关系、时间线与物体能力等完整创作管理功能。

> **给 AI Agent 的首要指令**：本文档自包含，不依赖任何对话上下文。开始任何开发前，先完整读第 0、1、2 节；进入实现前，先按第 5 节产出「功能 → 扩展点 → 插件拆分」对照表并等待人工确认。未经确认不要直接写业务代码。

---

## 0. 执行约定（AI Agent 必读）

### 0.1 事实来源优先级

遇到冲突时，按以下顺序裁决：

1. `deepseek-harness` 源码与源码生成的参考文档（`subsystems/`、`*-catalog`、`capability-seams`、`cordis-api`）
2. 本地 `github-projects/deepseek-harness/docs/` 下的中文文档（`.zh.md`）——`github-projects/deepseek-harness` 是本项目内指向 deepseek-harness 仓库的目录联接
3. 线上文档站（与本地 `github-projects/deepseek-harness/docs/user/` 同源）
4. 本项目 `docs/` 下的决策记录

**禁止**：凭记忆猜测 API 签名、事件名或配置键。查不到就到 `subsystems/<域>.zh.md` 的 `cordis-surface` 区块或源码里找。

### 0.2 本项目的定位：树外插件，不是 monorepo 包

`dsh-scriptwriting-platform` 是独立仓库，主线是**树外插件 + 组合包（bundle）**：

- 遵循 `github-projects/deepseek-harness/docs/user/develop/basic/publish.zh.md` 的 `dsh.bundle` / `dsh.profile` manifest 约定
- **不要**照抄 `github-projects/deepseek-harness/docs/cookbook/adding-a-package.zh.md` 的 workspace 包不变式（`private: true`、版本跟随根包、`lib/` 输出树等）——那是给往 `github-projects/deepseek-harness/packages/` 内加包用的
- 只有确认要修改 Harness 框架本身时才走 monorepo 路径，且需单独决策

### 0.3 工作方式

- **先确认方案，再执行**：每个阶段先给出方案/拆分包/对照表，收到明确放行后再进入下一阶段
- **一决策一记录**：每个已确认的架构决策回写本项目 `docs/` 下的决策记录（模板见第 8 节）
- **本地 git 可由 Agent 执行**（`status`/`add`/`diff`/`log`/`commit`/`reset`）；`push`、`fetch`、`clone` 等远程读写一律由人工执行
- **输出证据化**：结论必须引用具体文件路径、行号、命令输出或 commit

---

## 1. 必须理解的核心概念

### 1.1 Cordis：一切皆插件

dsh 底层是 Cordis。插件向共享上下文 `ctx` 贡献**服务**、**类型化事件**和**可逆副作用**。产品每一部分都是插件——模型适配器、工具注册表、会话日志、agent loop 本身——因此都可从配置替换。

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'my-plugin'
export function apply(ctx: Context) {
  // 通过 ctx 注册能力
}
```

**不存在需要打补丁的特权内核**：扩展方式是把插件挂载到其他插件旁边；所有注册都是 effect，插件卸载时自动撤销。来源：`github-projects/deepseek-harness/docs/architecture.zh.md` § Cordis。

### 1.2 Fiber 生命周期与自动清理

```
PENDING → LOADING → ACTIVE
                 ↘ FAILED
ACTIVE → UNLOADING → DISPOSED
```

- 声明 `inject` 的插件会等待所有必需服务就绪；服务消失时自动 dispose，服务恢复后重载
- `ctx.on()`、`ctx.tools.register()`、`ctx.llm.registerAdapter()` 都由框架追踪并在卸载时撤销
- 需要显式清理的资源（网络连接、定时器）用 `ctx.effect(() => disposer)`
- 多个异步 disposer 并发执行、不保证逐个完成；**有顺序依赖的清理必须放进同一个 `ctx.effect()` 返回的 disposer**
- `ctx.plugin()` 创建子 Fiber，随父插件卸载；`await fiber.dispose()` 递归卸载并等待清理完成

来源：`github-projects/deepseek-harness/docs/user/develop/framework/index.zh.md`。

### 1.3 Profile、Bundle、Patch 层

运行中的 dsh 是启动时按序叠加的一棵插件树。

| 概念 | 定义 | manifest |
|---|---|---|
| profile | 具名组装，存放于 `$DSH_HOME/profiles/<name>`，列出 bundles + 自己的 patch | `dsh.profile.bundles` |
| bundle | 插件代码 + 一个配置层的分发格式 | `dsh.bundle.patch` |
| patch | YAML 数组：带 `id` 的补丁覆盖该行；`insert` 决定插入位置（无 id 追加末尾，有 id 插入该 group） | — |

**层顺序**（后应用者按行胜出）：

1. profile 的 `dsh.profile.bundles` 中各 bundle patch，按列表顺序（`@deepseek-ai/dsh-base` 先行）
2. profile 自己的 `cordis.patch.yml`
3. home 级 `$DSH_HOME/cordis.patch.yml`
4. 每个 `--patch <path>` overlay，按 argv 顺序

**关键陷阱**：patch 按行替换**整个 config 值**，不是深度合并。覆盖一行时必须重述该行需要的每一个键。查看实际启动树：

```sh
dsh --profile web --dump-config
```

来源：`github-projects/deepseek-harness/docs/architecture.zh.md` § Profile 与组合包、`github-projects/deepseek-harness/docs/user/develop/basic/publish.zh.md` § 加载顺序。

### 1.4 能力 Seam 三角色

一个 **seam** 是可替换能力，含三种角色：

| 角色 | 职责 | Bash 案例 |
|---|---|---|
| Service Definition | 声明服务与 Request/Result 类型 | `dsh-shell` |
| Service Provider | 实现该能力 | `dsh-bash-local` |
| Consumer | 把能力暴露给模型/UI | `dsh-tool-bash` |

**Provider 与 Consumer 互不依赖，只依赖 Definition**。只有角色需要独立演进或替换时才拆成不同包；简单工具插件无需预防性拆分。Definition 拥有 Request/Result 类型。

来源：`github-projects/deepseek-harness/docs/user/develop/practice/index.zh.md`、`github-projects/deepseek-harness/docs/architecture.zh.md` § 能力 seam。

### 1.5 事件四模式

| 模式 | 调用 | 语义 |
|---|---|---|
| broadcast | `ctx.emit()` | 所有监听器同步执行，返回值忽略 |
| bail | `ctx.bail()` | 第一个非 `null`/`false`/`undefined` 返回值终止 |
| serial | `ctx.serial()` | 顺序执行并等待异步，首个真值终止；**无 `next()`** |
| waterfall | `ctx.waterfall()` | 每个监听器包装下游返回值，**必须调用 `next()`** |

事件命名遵循 `namespace/action`，如 `agent/pre-step`、`tools/result`、`session/event`。

**两类事件的区分（高频错误）**：
- Cordis 事件：`agent/*`、`tools/*`、`fs/*` 等实时扩展点
- 持久化会话事件：`turn/*`、`step/*`、`tool/call`、`tool/result`、`compaction/*`——观察它们要监听 `session/event` 并检查 `event.type`

来源：`github-projects/deepseek-harness/docs/user/develop/framework/events.zh.md`、`github-projects/deepseek-harness/docs/architecture.zh.md` § 事件。

### 1.6 配置

导出 `Config` 接口与**同名 Schemastery schema**，默认值写在 schema 中：

```ts
import Schema from '@deepseek-ai/schemastery'

export interface Config {
  greeting: string
  maxRetries: number
  verbose?: boolean
}

export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
  maxRetries: Schema.number().default(3),
  verbose: Schema.boolean().default(false),
})

export function apply(ctx: Context, config: Config) { /* ... */ }
```

硬约定：**凡是不同部署可能需要不同值的参数，都必须定义为配置字段**。配置变更触发 HMR（卸载旧实例 + 加载新实例）。

来源：`github-projects/deepseek-harness/docs/user/develop/basic/config.zh.md`。

---

## 2. 文档地图：怎么查文档

本地 `github-projects/deepseek-harness/docs/` 就是线上文档站的内容源，两者一一对应，**不必两份都读**。

### 2.1 线上入口与 URL 规则

| 项 | 值 |
|---|---|
| 站点根 | `https://deepseek-harness.github.io/deepseek-harness/` |
| 中文教程 | `https://deepseek-harness.github.io/deepseek-harness/develop/basic/` |
| 英文教程 | `https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/` |
| 架构参考 | `https://deepseek-harness.github.io/deepseek-harness/en/reference` |
| 扩展实操手册 | `https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/extension-cookbook` |

规则：中文 `/develop/...`，英文 `/en/develop/...`。站点是 JS 渲染的 SPA，直接抓取 HTML 只能拿到标题；**以本地 `.zh.md` 为准**。`capability-seams`、`subsystems`、`cookbook` 等仓库内参考未必全部上线，本地 docs 才是全集。

### 2.2 按问题定位唯一归属

`github-projects/deepseek-harness/docs/AGENTS.md` 是文档宪法，定义「每个事实只有一个归属（one home per fact）」。按下表查：

| 你要解决的问题 | 唯一归属文档 |
|---|---|
| 不知道查哪份 / 文档写作规范 | `github-projects/deepseek-harness/docs/AGENTS.md` |
| 理解系统全貌、改 `packages/` 前 | `github-projects/deepseek-harness/docs/architecture.zh.md` |
| 术语澄清 | `github-projects/deepseek-harness/docs/glossary.zh.md` |
| 我的功能挂哪个扩展点 | `github-projects/deepseek-harness/docs/capability-seams.zh.md`（服务全景 + mermaid 图） |
| 功能 → 机制映射（已交付案例） | `github-projects/deepseek-harness/docs/cookbook/extension-cookbook.zh.md` § 功能→机制映射 |
| 多插件如何分工 | `github-projects/deepseek-harness/docs/user/develop/practice/index.zh.md` |
| 写第一个插件 / 工具 / 配置 / 打包 | `github-projects/deepseek-harness/docs/user/develop/basic/*.zh.md` |
| 生命周期 / 服务 / 事件 | `github-projects/deepseek-harness/docs/user/develop/framework/*.zh.md` |
| LLM 适配器 / 动态 Cordis | `github-projects/deepseek-harness/docs/user/develop/practice/*.zh.md` |
| 类型定义、服务 API、事件签名 | `github-projects/deepseek-harness/docs/subsystems/<域>.zh.md` 的 `cordis-surface` 区块 |
| Cordis 核心 API | `github-projects/deepseek-harness/docs/cordis-api/*.zh.md` |
| 全部配置字段 | `github-projects/deepseek-harness/docs/config-catalog.zh.md`（26 万字符，**只搜不读**） |
| 工具清单 | `github-projects/deepseek-harness/docs/tool-catalog.zh.md` |
| 为什么这么设计（决策理由） | `github-projects/deepseek-harness/.agents/notes/implemented/**`（`archived/` 是冻结历史，非当前权威） |
| 仓库内新增包的逐文件清单 | `github-projects/deepseek-harness/docs/cookbook/adding-a-package.zh.md`（**仅 monorepo 路径**） |

### 2.3 检索技巧

- 用 `Grep` 而不是逐行读大目录：`config-catalog.zh.md` / `persistence-catalog.zh.md` 必须按关键词定位
- 优先读 `.zh.md`；`.i18n.yaml` 是翻译元数据，不是内容
- 生成类文档的英文源由 `pnpm run gen-doc-graphs` 产出，**禁止手改**

---

## 3. 开发工作流（SOP）

### Step 0：环境准备

从源码运行（需要改/调试插件源码时）：

```sh
# 在 github-projects/deepseek-harness 仓库根（即目录联接目标）
pnpm install
pnpm dsh web --patch ./<你的插件目录>/cordis.yml
```

打开 `http://127.0.0.1:3080` 验证插件加载。本地 overlay 的插件路径必须是**绝对路径**；`--patch` 只贡献配置，不改变 loader 解析模块路径的 profile 目录。

### Step 1：功能 → 扩展点映射（不写代码）

1. 打开 `github-projects/deepseek-harness/docs/cookbook/extension-cookbook.zh.md`，读「功能→机制映射」表
2. 打开 `github-projects/deepseek-harness/docs/architecture.zh.md`，读「新行为的归属位置」表
3. 对每个平台功能，写出：功能描述 → 扩展点 → 需要的服务 → 是否需自定义服务
4. 找不到对应项时，到 `github-projects/deepseek-harness/docs/capability-seams.zh.md` 搜索能力 seam

**产出**：第 5 节的对照表草案，等待人工确认。

### Step 2：按三角色决定插件拆分

对每个需要可替换能力的域，判断是否拆成 Definition / Provider / Consumer 三个包。判据：**角色是否需要独立演进或替换**。剧本数据是稳定领域模型 → Definition 独立；存储后端可能切换（本地文件 / DB / 远程）→ Provider 独立；模型工具与 UI 是不同消费形态 → Consumer 独立。

### Step 3：最小插件跑通

按第 4.1 节模板创建插件 + `cordis.yml`，用 `--patch` overlay 启动，确认终端打印加载日志。先跑通空插件，再逐步加能力。

### Step 4：填充能力

按依赖顺序实现：

1. Service Definition（类型 + abstract class + 声明合并）
2. Service Provider（`ctx.plugin(MyProvider)`）
3. Consumer 工具（`ctx.tools.register(defineTool({...}))`）
4. 配置 schema
5. 事件监听（如需观察/拦截）
6. UI 节点（如需在 Web Client 展示）

每加一层都重新跑一次启动验证。

### Step 5：打包为 bundle 并安装进 profile

树外插件的 manifest（`github-projects/deepseek-harness/docs/user/develop/basic/publish.zh.md`）：

```json
{
  "name": "dsh-scriptwriting-platform",
  "version": "0.1.0",
  "type": "module",
  "main": "index.js",
  "files": ["index.js", "cordis.patch.yml"],
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" } },
  "engines": { "dsh": ">=0.2.0 <0.3.0" }
}
```

`cordis.patch.yml`：

```yaml
- insert:
    - id: scriptwriting-platform
      name: dsh-scriptwriting-platform
```

安装与验证：

```sh
dsh plugin --profile demo add ./dsh-scriptwriting-platform
dsh --profile demo --dump-config   # 确认出现 dsh-scriptwriting-platform 层（层内含 id: scriptwriting-platform 的行）
dsh --profile demo
```

**依赖声明规则**：需与宿主共享实例的 dsh 包同时声明在 `peerDependencies` 与 `devDependencies`（相同范围）；需要独立版本的第三方依赖与无状态工具包放 `dependencies`。

**分发方式选择**：
- 发布 npm：`pnpm publish` 时构建好产物，用户 `dsh plugin add <pkg>`
- 交付 tarball：`pnpm pack` → `dsh plugin add ./<pkg>.tgz`
- GitHub 安装：作者必须提供自包含的 `prepare` 脚本生成发布入口；用户需在 profile 的 `pnpm-workspace.yaml` 中加 `allowBuilds: { <pkg>: true }` 授权构建，并锁定 commit。**只对可信源码授权**。

### Step 6：验证与交付

见第 7 节 DoD 清单。

---

## 4. 代码模板（来自官方文档，可直接复制改造）

### 4.1 最小插件 + overlay

`src/my-plugin.ts`：

```ts
import type { Context } from '@deepseek-ai/cordis'

export const name = 'hello-plugin'

export function apply(ctx: Context) {
  console.log('[hello-plugin] plugin loaded!')
}
```

`cordis.yml`（开发用 overlay，路径为绝对路径）：

```yaml
- insert:
    - id: hello
      name: '/absolute/path/to/github-projects/deepseek-harness/scratch-plugin/src/my-plugin.ts'
```

来源：`github-projects/deepseek-harness/docs/user/develop/basic/index.zh.md`。

### 4.2 工具插件

```ts
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'greet-tool'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone by name.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `Hello, ${args.name}!`
    },
  }))
}
```

`inject` 让 Cordis 等待工具注册表就绪；`defineTool` 从 `parameters` 推导并校验 `args`；`execute` 返回 `output.schema` 声明的规范值，`output.render` 转成面向模型的内容。完整 DSL（嵌套 schema、后台工作、策略钩子、PTC mode、UI 卡片）见 `github-projects/deepseek-harness/docs/cookbook/adding-a-tool.zh.md`。

来源：`github-projects/deepseek-harness/docs/user/develop/basic/tool.zh.md`。

### 4.3 服务三角色

Definition：

```ts
import { Service, type Context } from '@deepseek-ai/cordis'

declare module '@deepseek-ai/cordis' {
  interface Context {
    myCap: MyCapService
  }
}

export abstract class MyCapService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'myCap')
  }
  abstract execute(request: MyCapRequest): Promise<MyCapResult>
}
export interface MyCapRequest { input: string }
export interface MyCapResult { output: string }
```

Provider：

```ts
import type { Context } from '@deepseek-ai/cordis'

class MyCapLocal extends MyCapService {
  async execute(request: MyCapRequest): Promise<MyCapResult> {
    return { output: request.input.toUpperCase() }
  }
}

export const name = 'my-cap-local'
export function apply(ctx: Context) {
  ctx.plugin(MyCapLocal)
}
```

Consumer（工具）：

```ts
export const name = 'tool-my-cap'
export const inject = ['tools', 'myCap']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'my_cap',
    description: 'Execute my capability.',
    parameters: { input: { type: 'string', required: true } },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return (await ctx.myCap.execute({ input: args.input })).output
    },
  }))
}
```

在 `cordis.yml` 中组合：

```yaml
- name: '@deepseek-ai/dsh-my-cap-local'
- name: '@deepseek-ai/dsh-tool-my-cap'
```

来源：`github-projects/deepseek-harness/docs/user/develop/practice/index.zh.md`。

### 4.4 钩子插件（waterfall 拦截）

```ts
import type { Context } from '@deepseek-ai/cordis'
import type { PreToolDecision, ToolExecution } from '@deepseek-ai/dsh-tools'

export const name = 'permission-gate'

export function apply(ctx: Context) {
  ctx.on('tools/pre-execute', async (exec, next): Promise<PreToolDecision> => {
    if (!(await isAllowed(exec))) {
      return { kind: 'deny', reason: 'Denied by policy.' }
    }
    return next()   // 必须调用，否则短路整个流水线
  })
}
```

扩展点选择规则：`ctx.tools.guard()` 用于单调最终拒绝；`tools/execute` 包裹分发生命周期（超时/重试/指标，仅 `exec.signal` 可替换）；`tools/post-execute` 显式变换结果；`tools/result` 观察不可变最终结果。见 `github-projects/deepseek-harness/docs/cookbook/adding-a-tool.zh.md` § Execution policy and observation。

来源：`github-projects/deepseek-harness/docs/cookbook/extension-cookbook.zh.md`。

### 4.5 UI 插件（实时流 + 回注）

```ts
export const name = 'my-ui'
export const inject = ['agents']

export function apply(ctx: Context) {
  ctx.on('agent/assistant-stream', ({ frame }) => {
    if (frame.type === 'chunk' && frame.chunk.type === 'text-delta') {
      render(frame.chunk.text)
    }
  })
  onUserInput(text => ctx.agents.get(brandString<SessionId>('client-session'))?.followup(
    createUserMessage({
      content: [{ type: 'text', text }],
      source: { kind: 'user' },
    })
  ))
}
```

向 Web Client 贡献业务行时，注册 `ConversationNodeDefinition` + keyed renderer，见 `github-projects/deepseek-harness/docs/subsystems/conversation.zh.md`。输入回注用 `agent.followup()` / `agent.steer()`。

来源：`github-projects/deepseek-harness/docs/cookbook/extension-cookbook.zh.md`。

### 4.6 服务隔离

同一服务可有多个实例，不同插件组看到不同实例：

```yaml
- id: group-a
  name: '@deepseek-ai/cordis-plugin-group'
  group: true
  isolate:
    shell: true
  config:
    - name: '@deepseek-ai/dsh-bash-local'
      config:
        timeoutMs: 5000
    - name: './src/plugin-a.ts'
```

来源：`github-projects/deepseek-harness/docs/user/develop/framework/service.zh.md`。

---

## 5. 剧本写作平台：功能 → 扩展点 → 插件拆分

> **状态标注**：下表是基于官方扩展点映射提出的**设计建议**，不是已确认决策。每个条目标注了需在探索阶段确认的问题。实施前必须先确认。

### 5.1 候选映射表

| 平台功能 | 候选扩展点 / 机制 | 候选插件角色 | 需确认的问题 |
|---|---|---|---|
| 草稿生成 | 面向模型的工具：`ctx.tools.register()`；如需新增模型提供方则 `ctx.llm` 注册 adapter | Consumer（工具）+ 可选 Provider（LLM adapter） | 复用现有 DeepSeek adapter 还是自建？生成是否需要独立 profile？ |
| 大纲 / 章节大纲 | 工具（读写）+ Service Definition（结构化文档类型） | Definition + Provider + Consumer | 大纲是单一文档还是分章节实体？是否需要版本历史？ |
| 世界地图 | 工具 + Web Client 节点（可视化） | Consumer（工具）+ UI 插件 | 数据模型（节点/边）与渲染方式；是否需要独立 slot |
| 人物关系 | 工具 + Web Client 节点 | 同上 | 与世界地图是否共用图结构 seam |
| 时间发展（时间线） | 工具 + 持久化会话状态 | Consumer + `SessionEvent` 扩展 | 是否需跨会话持久化；用 `ctx.jobs` 还是普通存储 |
| 物体能力 | 工具 + 系统提示词片段 | Consumer + `ctx.systemPrompt.section()` | 能力如何进入模型上下文，是否触发 `agent.inject()` |
| 结构化数据持久化 | 自定义 Service seam | Definition + Provider | 本地文件 / SQLite / 远程后端；是否复用 `ctx.persistence` |
| 内容进入模型上下文 | `ctx.systemPrompt.section()`；运行时注入 `agent.inject()` | Consumer | 静态 section 还是按会话动态注入；注意 KV Cache 影响 |
| 观察生成过程 | `session/event`（持久）+ `agent/assistant-stream`（实时） | UI 插件 | 只做展示还是要做回放；回放需 `sessions.create(id, {seed})` |
| 用户审批 / 确认 | `tools/pre-execute` 返回 `ask` + `ctx.approval` | 钩子插件 | 哪些写操作需审批；是否复用既有 plan mode |
| 定时生成 / 后台任务 | `ctx.jobs` 注册 + `job_*` 工具；`followup(..., {source:{kind:'schedule'}})` | Consumer | 是否需要周期任务；与平台 UI 的状态同步 |
| 命令入口（`/outline` 等） | `ctx.commands` 注册 | Consumer | 命令清单与斜杠命令命名 |
| 结构化输出约束 | `concludeTurn()` + 单调工具守卫 | 钩子插件 | 哪些工具调用可终结轮次 |

### 5.2 建议的最小拆分（待确认）

```
dsh-scriptwriting-core          Service Definition：领域类型 + ctx 键声明
dsh-scriptwriting-store         领域 spec 声明（Provider 由 harness dsh-storage-sqlite 担任）
dsh-scriptwriting-tools         Consumer：面向模型的读写工具
dsh-scriptwriting-ui            UI 插件：Web Client 节点 + 流式展示
dsh-scriptwriting-platform      组合包：cordis.patch.yml 组装上述插件
```

拆分判据仍是「角色是否独立演进」：若存储后端确定只有一种，可先合并 Definition + Provider，避免过度拆分。

### 5.3 上下文影响的强制记录

按 `github-projects/deepseek-harness/docs/cookbook/adding-a-package.zh.md` § Model Experience 约定，任何向模型可见内容贡献 token 的插件，需在包 README 记录：

- What the model sees（精确字段 / 系统提示词原文）
- Token effect（fixed / conditional / capped / zero）
- KV Cache effect（append-only / prefix-stable / replacing / independent，及失效条件）

剧本平台的提示词 section、工具 schema 都会影响 KV Cache 复用，此项不可省略。

---

## 6. 常见坑（按出现频率排序）

1. **waterfall 忘记 `next()`** → 流水线被静默短路。`tools/pre-execute`、`agent/pre-step`、`agent/request`、`llm/stream`、`tools/execute` 都是 waterfall；`agent/turn-stopping` 是 serial，没有 `next()`。
2. **把持久化事件当 Cordis 事件监听** → `turn/*`、`tool/result` 要监听 `session/event` 并检查 `event.type`。
3. **patch 覆盖 config 以为是深合并** → 必须重述整行所有键。
4. **手改生成文档** → `config-catalog`、`capability-seams`、`subsystems` 英文区块、`*-catalog` 全部由源码生成。
5. **Config 导出普通对象** → 必须导出 Schemastery schema（Standard Schema 接口），否则加载失败。
6. **硬编码可调参数** → 能在 `cordis.yml` 改的值就必须做成配置字段。
7. **依赖 dsh 包只放 dependencies** → 需与宿主共享实例的必须同时放 `peerDependencies` 和 `devDependencies`。
8. **有顺序依赖的清理分散在多个 effect** → disposer 并发执行，必须合并进同一个 `ctx.effect()`。
9. **git 安装 TypeScript 插件没有 `lib/`** → 作者提供自包含 `prepare`，用户加 `allowBuilds` 授权并锁 commit。
10. **把 monorepo 包规范套到树外插件** → 两套 manifest 约定不同，见 0.2 节。

---

## 7. 验收清单（DoD）

### 7.1 功能验证

- [ ] `--patch` overlay 启动后终端打印插件加载日志，Web UI 无报错
- [ ] `dsh --profile <name> --dump-config` 能看到自己的配置层
- [ ] 每个工具在 Web UI 中可被模型调用，输入校验与输出渲染符合预期
- [ ] 修改 `cordis.yml` 中 config 后 HMR 生效，旧注册无残留
- [ ] 卸载插件 / 服务提供方消失时，事件监听与工具注册被清理
- [ ] 持久化事件在会话重载后仍可回放

### 7.2 提交前检查（monorepo 路径）

```sh
pnpm install
pnpm run doc-sync
pnpm run constraints && pnpm run typecheck && pnpm run lint
pnpm run build && pnpm run hygiene
```

树外插件按自身 `package.json` 脚本执行对应检查，并遵循 `github-projects/deepseek-harness/docs/testing.zh.md` 的测试政策。

### 7.3 交付文档

- [ ] 每个插件包有 README：服务 API、配置、事件、扩展点、设计说明
- [ ] Model Experience 三个字段已填写（或按 allowlist 声明 None）
- [ ] 「功能 → 扩展点 → 插件」对照表已回写本项目 `docs/`
- [ ] 待确认项有明确状态标注，未把建议写成事实

---

## 8. 决策记录模板

在 `docs/decisions/` 下按 `YYYY-MM-DD-<主题>.md` 创建（目录分区与写入门槛见 `docs/README.md`），内容：

```markdown
# <决策主题>

- 状态：proposed | accepted | superseded
- 日期：YYYY-MM-DD
- 关联功能：<平台功能>

## 背景
<为什么需要做这个决策>

## 选项与取舍
| 选项 | 优点 | 代价 |
|---|---|---|

## 结论
<明确选择，以及放弃了什么>

## 依据
<引用的文档路径 / 源码位置 / 命令输出>

## 验证方式
<如何确认决策已落地>
```

---

## 9. 参考链接速查

**本地（相对路径前缀 `github-projects/deepseek-harness/`；`github-projects/deepseek-harness` 为本项目内的目录联接，指向工作区中的 deepseek-harness 仓库）**

- `github-projects/deepseek-harness/docs/AGENTS.md` — 文档分层与写作标准
- `github-projects/deepseek-harness/docs/architecture.zh.md` — 系统架构、扩展点、新行为归属表
- `github-projects/deepseek-harness/docs/capability-seams.zh.md` — 能力 seam 全景
- `github-projects/deepseek-harness/docs/cookbook/extension-cookbook.zh.md` — 扩展插件形态 + 功能→机制映射
- `github-projects/deepseek-harness/docs/cookbook/adding-a-tool.zh.md` — 工具定义 DSL 真源
- `github-projects/deepseek-harness/docs/cookbook/adding-a-package.zh.md` — monorepo 包清单
- `github-projects/deepseek-harness/docs/user/develop/basic/` — 插件 / 工具 / 配置 / 发布教程
- `github-projects/deepseek-harness/docs/user/develop/framework/` — 生命周期 / 服务 / 事件
- `github-projects/deepseek-harness/docs/user/develop/practice/` — 三角色能力 / LLM 适配器
- `github-projects/deepseek-harness/docs/subsystems/` — 各子系统类型定义与 Cordis API
- `github-projects/deepseek-harness/docs/config-catalog.zh.md` / `github-projects/deepseek-harness/docs/tool-catalog.zh.md` — 生成参考
- `github-projects/deepseek-harness/.agents/notes/implemented/` — 已交付决策记录

**线上**

- `https://deepseek-harness.github.io/deepseek-harness/develop/basic/`
- `https://deepseek-harness.github.io/deepseek-harness/en/reference`
- `https://deepseek-harness.github.io/deepseek-harness/en/reference/cookbook/extension-cookbook`

---

*文档版本：1.0 · 生成日期：2026-11-21 · 基于 deepseek-harness 本地文档与官方文档站调研*
