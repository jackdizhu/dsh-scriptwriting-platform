# 架构设计文档

- 版本：1.0（骨架阶段，2026-11-21）
- 适用代码：commit `c532d23` 及其后的 P0 修复、包名调整、构建模式改造
- 前置阅读：`AGENT.md`（约束入口）→ `rules/`（规范）→ `docs/`（决策记录）

> **本文档的定位**：描述系统**当前实际结构**与**已确认的设计取向**，不重复 `rules/` 里的行为规范，也不替代决策记录（`docs/decisions/`、`docs/reviews/`）。凡未经用户拍板的内容一律标注「设计建议（待确认）」。

---

## 1. 系统定位与边界

本项目是 **deepseek-harness（dsh）的树外插件 + 组合包**，不是 harness monorepo 内的包。

| 归属 | 内容 |
|---|---|
| 本项目负责 | 剧本创作领域的类型定义、领域存储 spec、面向模型的工具、Web Client 节点、组合包装配 |
| harness 负责（本项目只消费） | Cordis 运行时、profile/loader、storage seam（`dsh-storage` / `-sqlite` / `-domain`）、工具注册表、会话与 UI 框架 |
| 明确不做 | 修改 harness 内核、自研 SQLite 驱动、复制 workspace 包不变式（`private: true`、版本跟随根包、`lib/` 声明树） |

依赖的宿主版本基线（实测）：

| 项 | 值 | 来源 |
|---|---|---|
| harness | `0.2.2-rc.5` | `github-projects/deepseek-harness/package.json` 的 `version` |
| Cordis | `4.1.0` | `github-projects/deepseek-harness/vendor/cordis`，与 npm `@deepseek-ai/cordis` 一致 |
| Node | `>= 24.9.0` | harness `engines.node`；存储后端用 `node:sqlite` |

---

## 2. 运行时模型

### 2.1 一切皆插件（Cordis）

dsh 进程启动时按序叠加出一棵插件树，没有需要打补丁的特权内核。每个插件向共享 `ctx` 注册三类贡献：

- **服务**（`ctx.storage`、`ctx.tools`、`ctx.llm` …）
- **类型化事件**（`agent/*`、`tools/*`、`fs/*` 为实时扩展点；`turn/*`、`tool/call`、`tool/result` 为持久会话事件，须监听 `session/event` 后判 `event.type`）
- **可逆副作用**（`ctx.on()`、`ctx.tools.register()`、`ctx.effect()` 均由框架追踪）

### 2.2 Fiber 生命周期

```
PENDING → LOADING → ACTIVE
                 ↘ FAILED
ACTIVE → UNLOADING → DISPOSED
```

- 声明 `inject` 的插件等待所需服务就绪才执行 `apply`；服务消失时自动 dispose，恢复后重载。
- 注册类贡献随卸载自动撤销；网络连接、定时器、领域句柄等需显式清理的资源用 `ctx.effect(() => disposer)`。
- **禁用假设**：多个 disposer 并发执行、不保证顺序。有顺序依赖的清理必须合并进同一个 `ctx.effect()` 返回的 disposer。

### 2.3 profile / bundle / patch 三层

| 概念 | 定义 | manifest 键 |
|---|---|---|
| profile | 具名组装，位于 `$DSH_HOME/profiles/<name>` | `dsh.profile.bundles`（有序列表） |
| bundle | 插件代码 + 一个配置层 | `dsh.bundle.patch` |
| patch | YAML 数组：带 `id` 的补丁覆盖该行；`insert` 决定插入位置（无 id 追加末尾，有 id 插入该 group） | — |

层叠顺序（后者按行胜出）：

```
base bundle patch → 其它 bundle patch（按 profile 列表顺序）
  → profile 自带 cordis.patch.yml
    → $DSH_HOME/cordis.patch.yml
      → 各 --patch overlay（按 argv 顺序）
```

**关键陷阱**：patch 按行**替换整个 config 值**，不是深合并。覆盖某行时必须重述该行需要的每一个键。

### 2.4 本项目在树中的位置

```
dsh 进程
└── profile: <name>
    ├── bundle: @deepseek-ai/dsh-base        # storage hub / backend / domain facility …
    └── bundle: dsh-scriptwriting-platform    # 本项目组合包
        └── patch: cordis.patch.yml
            └── insert: { id: scriptwriting-platform, name: dsh-scriptwriting-platform }
                └── apply(ctx)                # 装配本项目插件（当前为 TODO）
                    ├── dsh-scriptwriting-core
                    ├── dsh-scriptwriting-store
                    ├── dsh-scriptwriting-tools
                    └── dsh-scriptwriting-ui
```

现状：`packages/bundle/src/index.ts` 仅有注释与 `export {}`，四个子插件尚未被真正装配；`packages/bundle/cordis.patch.yml` 只有一行自引用。

---

## 3. 包架构

### 3.1 五包与职责

| 目录 | npm 包名 | 职责 | 当前实现状态 |
|---|---|---|---|
| `packages/core` | `dsh-scriptwriting-core` | 领域类型、品牌 id、跨包共享原语、`ctx` 键声明 | 空（`export {}` + TODO） |
| `packages/store-local` | `dsh-scriptwriting-store` | 声明领域 `DomainSpec`（zod schema + 版本 + layout），不自研持久化 | 空（TODO） |
| `packages/tools` | `dsh-scriptwriting-tools` | 面向模型的读写工具（`defineTool`） | 空（TODO） |
| `packages/ui` | `dsh-scriptwriting-ui` | Web Client 节点与流式展示 | 空（TODO），且缺客户端入口 |
| `packages/bundle` | `dsh-scriptwriting-platform` | 组合包：patch 层 + `apply()` 装配 | 空（TODO） |

**命名注意**：目录名 `store-local` 与包名 `dsh-scriptwriting-store` 不一致，是 2026-11-21 包名调整的显式取舍（只改标识、不改路径），见 `docs/decisions/2026-11-21-包名调整-store.md`。

### 3.2 依赖方向（目标态）

```
                ┌────────────────────────┐
                │  dsh-scriptwriting-ui  │
                └───────────┬────────────┘
                            │ 依赖类型
   ┌─────────────┐   ┌──────▼─────────┐   ┌────────────────────────┐
   │    core     │◄──┤     tools      │   │ dsh-scriptwriting-     │
   │ (Definition)│   │  (Consumer)    │   │ store（领域 spec 声明） │
   └──────▲──────┘   └──────┬─────────┘   └───────────▲────────────┘
          │                 │                         │
          └─────────────────┴────────────┬────────────┘
                                         │
                             ┌───────────▼───────────┐
                             │  bundle（只做装配）    │
                             └───────────────────────┘
```

规则：

- `core` 不依赖任何实现包。
- `tools` 与 `store` **互不依赖**，都只依赖 `core`。
- `bundle` 不放业务逻辑，只声明对四包的 `dependencies`（`workspace:^`）与 patch 层。

### 3.3 与规范的已知偏差

| 偏差 | 证据 | 影响 | 处置 |
|---|---|---|---|
| `tools` 的 `peerDependencies` 含 `dsh-scriptwriting-store` | `packages/tools/package.json` | 违反「Consumer 只依赖 Definition」，领域 schema 变更会变成 tools 的破坏性升级 | 待修（P1）：运行时经 `ctx.storageDomain` 取句柄，不 import store |
| `ui` 无 `dsh.client`、无 `exports["./client"]` | `packages/ui/package.json`；对照 harness 98 个包声明 `dsh.client`（如 `packages/api/gateway/package.json`） | Web Client 节点在现有 manifest 下**无法实现** | 待修（P1）：补客户端入口与 browser 条件导出 |
| 组合包不自包含 | `packages/bundle/cordis.patch.yml` 只有一行；对照 harness `packages/bundle/base/cordis.patch.yml` 把 storage 三行连 config 一起写入 patch | 用户 `dsh plugin add` 后仍需手工配 profile，否则 `form-not-mounted` | 待拍板（见 §8.2） |

---

## 4. 数据架构

### 4.1 能力 seam 的三角色落点

存储能力由 **harness 提供**，本项目只承担「声明领域」与「消费」两个角色：

| 角色 | 实际承担者 | 注册名 / API |
|---|---|---|
| Service Definition | `@deepseek-ai/dsh-storage` | `ctx.storage`（hub）；`ctx.storage.form('domain')` |
| Service Provider | `@deepseek-ai/dsh-storage-sqlite` | backend 名 `sqlite`，`ctx.storage.backend.get('sqlite')` |
| Consumer（facility） | `@deepseek-ai/dsh-storage-domain` | `ctx.storageDomain.open(spec)` |
| Consumer（业务） | `dsh-scriptwriting-store` + `dsh-scriptwriting-tools` | 声明 `DomainSpec`，经 `ctx.tools` 暴露给模型 |

**结论**：本项目**没有** Service Provider。任何「store-local 是 Provider」的表述都已过期（见 `docs/decisions/2026-11-21-存储后端与store-local定位.md`）。

### 4.2 存储 seam 的公开 API（查证自源码）

`@deepseek-ai/dsh-storage-domain`：

```ts
defineDomain<S extends DomainSpec>(spec: S): S
domainTable<K extends string, V>(schema: ZodType<V>): DomainTableSpec<K, V>

interface DomainFacility {
  open<S extends DomainSpec>(spec: S): Promise<Domain<S>>
}

interface Domain<S> {
  readonly name: string
  readonly global: DomainGlobalHandleOf<S>
  table<N extends keyof S['tables'] & string>(name: N): KvTable<TableKeyOf<S, N>, TableValueOf<S, N>>
  close(): Promise<void>
}

interface KvTable<K, V> {
  get(key: K): V | undefined           // 同步，读内存
  entries(): IterableIterator<[K, V]>  // 快照迭代，不随写入变化
  keys(): IterableIterator<K>
  readonly size: number
  put(key: K, value: V): Promise<void> // 整条覆盖，不做局部合并
  delete(key: K): Promise<boolean>
  // 批量删除：作为写链上的一个 job，不与其它写交错
}
```

`open()` 的错误码（均为结构化 `HarnessError` 家族）：`already-open`、`backend-not-found`、`facet-unsupported`、`version-mismatch`、`malformed-medium`、`invalid-record`。

配置：`DomainFacility` 为 `{ backend: string（必填）, routes?: Record<string, string> }`——`routes` 可把**单个领域**路由到不同 backend；`dsh-storage-sqlite` 为 `{ path: string, journalMode?: 'wal' | 'delete' | 'truncate' | 'persist' }`，默认 `wal`。

### 4.3 DomainSpec 契约

| 字段 | 必填 | 语义 | 对演进的影响 |
|---|---|---|---|
| `name` | 是 | 领域名，同时是后端 unit 名（须匹配 `UNIT_NAME_RE`） | 改名 = 数据搬迁，禁止 |
| `version` | 是 | 当前格式版本 | 写入时打版本戳 |
| `tables` | 是 | 表名 → `{ valueSchema }`，逐条记录做 zod 校验 | 校验发生在持久化边界 |
| `global` | 否 | 领域级单例 `{ schema, initial }` | 首次 `set` 前不落盘 |
| `layout` | 否 | `single`（默认，整域一份文档）/ `per-record`（逐条一份文档） | 大记录用 `per-record`，避免整篇重写与整域失效 |
| `compatibleVersions` | 否 | 当前 schema 仍能接受的旧版本号 | 旧记录免重写读取；写入时打新版本 |
| `invalidRecords` | 否 | 默认整次 `open` 失败；`'backup-and-skip'` 则备份并跳过坏记录 | 只适用于可丢弃的派生数据 |

**没有迁移机制**：harness 只提供版本号与兼容声明，不提供 migrate 钩子。因此 schema 演进必须遵守：

1. 只做加法（新字段可选），禁止收窄或改名；
2. `version` 单调递增，旧版本进 `compatibleVersions`；
3. 用户资产（剧本正文）用 `per-record` layout，避免一条坏记录拖垮整个领域。

> 上述三条为**设计建议（待确认）**，尚未落为决策记录。

### 4.4 领域划分（待拍板）

候选领域：草稿、大纲/章节、世界地图、人物关系、时间线、物体能力。未决：五个领域各一份 `DomainSpec`，还是合并为一份多 `tables`。合并的好处是跨领域引用（人物 ↔ 时间线）在同一写入链内一致；拆开的好处是独立版本与独立开关。

### 4.5 一致性模型

- 每个领域一条**单写链**：`put` / `delete` / 批量删除按调用顺序排队执行，不交错。
- `get` / `entries` / `keys` 读内存快照；迭代过程中即使有写入落地，迭代视图保持稳定。
- 写入落地后发出 `domain/changed` 事件。
- `close()` 幂等：立即拒绝新写、排空已排队的写、释放后端 unit、释放领域名。**句柄由调用方拥有**（通常作为自己的 `ctx.effect` disposer），facility 卸载时兜底关闭仍开着的领域。

### 4.6 组装与关闭顺序

```
组装顺序：storage → storage-sqlite → storage-domain → 本平台四包
关闭顺序：反向
```

本项目内若存在多个领域句柄，必须用**同一个** `ctx.effect` 返回一个串行 disposer；分散在多个 effect 会导致并发关闭（顺序不保证）。

---

## 5. 功能 → 扩展点映射

| 平台功能 | 扩展点 | 归属包 | 待确认 |
|---|---|---|---|
| 草稿生成 | `ctx.tools.register()`（必要时 `ctx.llm` adapter） | tools | 复用现有 DeepSeek adapter 还是自建 |
| 大纲 / 章节大纲 | tools + 领域 spec | tools / store | 单一文档 or 分章节实体；是否要版本历史 |
| 世界地图 | tools + Web Client 节点 | tools / ui | 节点-边结构是否复用图模型 |
| 人物关系 | tools + Web Client 节点 | tools / ui | 与世界地图是否共用图 seam |
| 时间线 | tools + 持久化状态 | tools / store | 是否跨会话持久化 |
| 物体能力 | tools + `ctx.systemPrompt.section()` | tools | 静态 section 还是运行时 `agent.inject()` |
| 用户审批（写操作） | `tools/pre-execute` 返回 `ask` + `ctx.approval` | 钩子插件（未建） | 哪些写操作要审批 |
| 命令入口（`/outline` 等） | `ctx.commands` | 未定 | 归属 bundle 还是领域包 |
| 后台 / 定时生成 | `ctx.jobs` + `job_*` 工具 | 未定 | 是否需要周期任务 |
| 观察生成过程 | `session/event`（持久）+ `agent/assistant-stream`（实时） | ui | 只展示还是做回放 |

事件模式速查：`ctx.emit` 广播、`ctx.bail` 首个真值短路、`ctx.serial` 顺序等待（无 `next()`）、`ctx.waterfall` 流水线（**必须调用 `next()`**，否则静默短路）。

---

## 6. 配置模型

- 每个插件导出 `Config` 接口 + **同名 Schemastery schema**，默认值写在 schema 里；`apply(ctx, config)` 接收校验后的值。
- 判据：**不同部署可能取值不同的参数都必须是配置字段**（数据库路径、`journalMode`、并发上限…），不在代码里写 `DEFAULT_*`。
- 配置变更触发 HMR：旧实例卸载、新实例加载，注册自动撤销。
- patch 覆盖是**整行替换**，改一行 config 必须重述该行所有键。

已知需要配置化的项：SQLite `path` / `journalMode`、domain `backend` 路由、工具的时间与条目上限、是否启用 UI 节点。

---

## 7. 构建与产物

### 7.1 目录与产物

```
packages/<pkg>/src/**                TypeScript 源码
packages/<pkg>/lib/**                tsc 产物（已 gitignore）
packages/<pkg>/tsconfig.json         类型检查口径（noEmit）
packages/<pkg>/tsconfig.build.json   发布口径（outDir lib，无 .map）
packages/<pkg>/tsconfig.dev.json     开发口径（outDir lib，有 .map）
scripts/tsc.mjs                      构建模式包装（零依赖）
```

### 7.2 模式切换

`tsc` 不读环境变量，`sourceMap` / `declarationMap` 只能由 tsconfig 或 CLI 参数决定，因此由 `scripts/tsc.mjs` 翻译：

| 命令 | 模式 | `.map` |
|---|---|---|
| `pnpm dev` | development + `--watch` | 有 |
| `pnpm build` | production | 无 |
| `pnpm build:dev` | development（一次性） | 有 |
| `pnpm typecheck` | 仅检查（`--noEmit`） | — |
| `pnpm clean` | 清 `lib/` | — |

优先级：`--mode=` > `--watch` > `BUILD_MODE` > `NODE_ENV` > `production`。

每次编译前脚本先删 `lib/`——tsc 不清理旧产物，dev 生成的 `.map` 会残留进发布包。

### 7.3 模块解析与跨包引用

- `module` / `moduleResolution` = `nodenext`：产物由 Node ESM 直载，无扩展名的相对导入会在运行时失败。
- 相对导入写 `.ts` 后缀（`allowImportingTsExtensions` + `rewriteRelativeImportExtensions`，编译时改写成 `.js`）。
- 跨包引用一律用包名；开发期由 `tsconfig.base.json` 的 `paths` 指向各包 `src/index.ts`，无需先构建。

### 7.4 包发布形态

| 字段 | 值 |
|---|---|
| `main` / `types` | `lib/index.js` / `lib/index.d.ts` |
| `exports` | `.`（types + default）、`./package.json`；bundle 另含 `./cordis.patch.yml` |
| `files` | `["lib"]`；bundle 为 `["lib", "cordis.patch.yml"]` |
| 内部依赖 | `workspace:^`（发布时由 pnpm 改写为真实版本） |
| `engines` | `dsh: ">=0.2.2-0 <0.3.0"`；根另有 `node: ">=24.9.0"` |

`engines.dsh` 的预发布包含式写法是必需的：`>=0.2.0` 会排掉 `0.2.2-rc.5`。

---

## 8. 装配与加载顺序

### 8.1 现状

```yaml
# packages/bundle/cordis.patch.yml
- insert:
    - id: scriptwriting-platform
      name: dsh-scriptwriting-platform
```

只有一行，且 `apply()` 为空 → 装进去的包不会加载任何子插件。

> **`id` 是标识符不是注释**：补丁行按 `id` 建索引，后续层的覆盖补丁、配置编辑器写回的 patch、运行时改动回写都靠它定位。一旦对外发布就不能再改，否则下游 patch 会静默失配（只打 warning，插件照常加载）。

### 8.2 目标态（设计建议，待确认）

```yaml
- insert:
    - id: scriptwriting-platform-storage
      name: '@deepseek-ai/dsh-storage'
    - id: scriptwriting-platform-storage-sqlite
      name: '@deepseek-ai/dsh-storage-sqlite'
      config:
        path: <由 profile 或配置提供>
        journalMode: wal
    - id: scriptwriting-platform-storage-domain
      name: '@deepseek-ai/dsh-storage-domain'
      config:
        backend: sqlite
    - id: scriptwriting-platform
      name: dsh-scriptwriting-platform
```

理由：harness 自己的组合包就是把 storage 行连 config 写进 patch 的（`packages/bundle/base/cordis.patch.yml`），用户 `dsh plugin add` 后即可运行，不必手工改 profile。`apply(ctx)` 只保留跨插件 wiring（如把领域句柄注入 tools），不重复做 patch 能做的事。

### 8.3 本地 link 安装

```sh
pnpm install
pnpm build
dsh plugin --profile demo add ./packages/bundle
dsh --profile demo --dump-config    # 应出现以 dsh-scriptwriting-platform 为标题的层
dsh --profile demo
```

之后改源码只需重建对应包，`lib/` 一变即生效（profile 经 `packages/bundle/node_modules` 链到 workspace 包）。卸载：`dsh plugin --profile demo remove dsh-scriptwriting-platform`。

---

## 9. 横切关注点

### 9.1 错误处理

- 预期失败用结构化错误：继承 `HarnessError`，`code` 为稳定的 `UPPER_SNAKE_CASE`（通常带域前缀），**不靠解析消息路由**。
- 工具预期失败：`ToolArgsError` / `INVALID_ARGS`（参数）、`ToolContextUnavailableError`（缺上下文）、`AbortError` / `ABORTED`（取消）。
- 外部错误在拥有依赖处转换，原错误放 `cause`；进程 / worker 边界传 `name` 与 `code` 后重建。
- 空 `catch` 需满足三条件：`try` 只含一个语句、绑定命名预期失败、注释说明为何可安全丢弃。

当前状态：`core` 尚无本项目错误类。设计建议：先放 `ScriptwritingError extends HarnessError` 与错误码枚举。

### 9.2 模型可见内容（Model Experience）

任何向模型贡献 token 的插件，README 必须写三项：**What the model sees** / **Token effect** / **KV Cache effect**。工具 schema 与 systemPrompt section 都会影响 KV Cache 复用。

现状：五个包 README 均为占位（`None` / 待填充）。`tools` 上线前必须换成含「schema 原文 + token 上限 + Cache 失效条件」的表单，否则 `rules/delivery.md` 的交付门禁过不了。

### 9.3 隐私与安全

- 密钥、令牌不得硬编码、不得写入日志或文档；用环境注入与配置引用。
- 用户剧本内容属敏感数据：日志与错误消息输出前脱敏。
- 模型输出、工具返回、MCP 数据视为不可信输入，不直接拼进命令或代码。
- 详见 `rules/privacy-security.md`（优先级最高）。

---

## 10. 质量保障

| 门禁 | 现状 | 说明 |
|---|---|---|
| `pnpm typecheck` | ✅ 五包通过 | 严格模式 + `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess` |
| `pnpm build` | ✅ 五包产出 `lib/` | production 口径无 `.map` |
| `pnpm test` | ⚠️ 空跑 | 无 runner、无一包定义 `test` → 假绿 |
| lint | ❌ 无配置 | `rules/typescript.md` 的规范无工具强制 |
| REAL composition | ❌ 仅占位 `tests/composition.test.ts` | 未接入 Loader 启动 |
| HMR dispose 验证 | ❌ 未做 | 需断言卸载后注册被移除 |
| CI | ❌ 无 | 所有门禁目前靠人工 |

测试要求（`rules/plugin-package.md`）：产品可见插件必须走 **REAL composition**——通过 Loader 启动测试用 `cordis.yml`，而不是手工 `ctx.plugin()`；只 mock 外部服务与非确定性输入，断言模型可见 / 持久 / 用户可见输出。

---

## 11. 已知缺口与未决决策

### 11.1 已修（P0，2026-11-21）

依赖版本范围、`engines.dsh`、构建产出、`exports` / `types`、编译开关、`nodenext` 解析、TS 工具链、跨包引用、`.gitignore`。详见 `docs/reviews/2026-11-21-架构评审-骨架阶段.md` §2。

### 11.2 待拍板

| # | 决策 | 选项 | 影响面 |
|---|---|---|---|
| 1 | 包切分方向 | 水平（按角色，现状）vs 垂直（按领域） | 决定目录形态与版本策略；垂直切分下新增领域只动 1 包 |
| 2 | 组合包是否自包含 | patch 内写入 storage 三行（建议）vs 依赖 profile | 决定 `dsh plugin add` 后能否直接跑 |
| 3 | 领域 spec 拆分粒度 | 一域一 spec vs 单 spec 多 tables | 决定跨领域一致性与独立演进能力 |
| 4 | 领域 schema 演进策略 | 只加不改 + 版本单调 + 正文 `per-record`（建议） | 决定用户资产可迁移性 |
| 5 | 测试归属 | 根 `tests/` vs 包级 `tests/` | 与 `rules/typescript.md`「测试放包级」冲突一处 |

> 这些决策的执行顺序与阶段划分见 `docs/plans/implementation-steps.md`（草案，待放行）；该计划另有 D1/D2/D3 三个前置决策（UI 承载位置、客户端构建链、静态数据来源）。

### 11.3 已知技术债

- `tools` 依赖 `store`（Consumer 依赖了非 Definition 的实现包）。
- `ui` 缺 `dsh.client` 与 `./client` 导出，Web 节点能力为 0。
- bundle `apply()` 未实现，patch 未自包含。
- 根 `tests/` 不在任何 tsconfig `include` 内。
- 无 lint、无 CI、无 test runner。

---

## 12. 术语表

| 术语 | 含义 |
|---|---|
| Cordis | dsh 的插件运行时；一切皆插件，注册即 effect |
| Fiber | 插件的实例生命周期单元；卸载时递归撤销贡献 |
| seam | 可替换能力的切面，含 Definition / Provider / Consumer 三角色 |
| Definition | 声明服务接口与 Request/Result 类型的角色 |
| Provider | 实现 seam 的角色（本项目**不承担**存储 Provider） |
| Consumer | 消费 seam 的角色，通常是面向模型的工具 |
| bundle | 插件代码 + 一个 patch 层的分发格式 |
| patch | 按 `id` 覆盖行的 YAML 数组；`insert` 决定插入位置；整行替换、非深合并 |
| profile | 具名组装，列出若干 bundle 与自己的 patch |
| DomainSpec | 领域声明：名字、版本、表结构、layout、兼容版本 |
| domain / table | 领域是后端 unit，表是领域内的键值集合 |
| `dsh.client` | 客户端（browser）插件 manifest 段；本项目 `ui` 尚未声明 |

---

## 13. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-11-21 | 初版：骨架阶段现状 + 五维评审结论 + P0 修复后状态 + 构建模式改造 |
