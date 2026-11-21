# 存储后端形态与 store-local 定位

- 状态：accepted（2026-11-21 用户拍板：SQLite + store-local 改为薄封装）
- 日期：2026-11-21
- 关联功能：结构化数据持久化（手册 §5.1）；关联决策：`docs/decisions/2026-11-21-项目代码目录大纲.md` 遗留项 1

## 背景

目录大纲确认后，遗留决策点 1「存储后端形态」（本地文件 / SQLite / 远程）需拍板。用户选择 **SQLite**。查证 harness 真源后发现：harness 已内置完整 SQLite 存储 seam，且后端用 Node 原生 `node:sqlite`，不依赖第三方驱动。因此 `store-local` 不应自研数据库，而应改为薄封装。

## 选项与取舍

### 第一层：存储后端

| 选项 | 优点 | 代价 |
|---|---|---|
| 本地文件（JSON） | 人类可读；harness 有 `dsh-storage-json` | 频繁更新需整文件重发布 |
| **SQLite（已选）** | 每行一文档，适合频繁更新；harness 有 `dsh-storage-sqlite`，Node 原生驱动 | 单数据库文件，不可直接文本 diff |
| 远程后端 | 跨进程/跨设备 | 需网络、鉴权、一致性设计，超出当前范围 |

### 第二层：store-local 定位（SQLite 确定后新发现）

| 选项 | 优点 | 代价 |
|---|---|---|
| **薄封装 harness seam（已选）** | 复用成熟后端与领域层；符合 seam 三角色；Node 原生无第三方驱动 | 依赖 harness 三个包，需对齐版本 |
| 完全移除包（spec 放 core） | 包数 5→4 | core 从纯 Definition 混入领域数据声明，职责边界模糊 |
| 自研 SQLite Provider | 完全自主 | 重复造轮子，违反 `rules/plugin-package.md` §3，放弃 Node 原生后端的校验/版本/事件能力 |

## 结论

1. 存储后端 = **SQLite**。
2. `store-local` 改为**薄封装**，不写数据库实现：声明剧本领域 spec（`defineDomain` + zod schema），声明对 harness seam 的依赖（`dsh-storage` / `dsh-storage-sqlite` / `dsh-storage-domain`），由 bundle 按序装配。
3. 领域数据分域建议（待能力填充阶段细化）：大纲/章节、世界地图、人物关系、时间线、物体能力各自一个 domain spec，独立版本与 schema。
4. 放弃自研 SQLite 驱动；不引入第三方 sqlite npm 包。

## 依据（查证自 harness 真源，非凭记忆）

- `github-projects/deepseek-harness/docs/subsystems/storage.zh.md` §枢纽/后端约定/声明领域/领域 facility：
  - seam 三角色 = Definition `dsh-storage`(`ctx.storage`) + Provider `dsh-storage-sqlite`(`sqlite`) / `dsh-storage-json`(`json`) + Consumer `dsh-storage-domain`(`ctx.storageDomain`，也是 `ctx.storage.domain`)；"产品包绝不直接触碰后端"。
- `github-projects/deepseek-harness/packages/storage/storage-sqlite/package.json`：`@deepseek-ai/dsh-storage-sqlite`，peer `@deepseek-ai/dsh-storage` + `@deepseek-ai/cordis`，依赖 `@deepseek-ai/schemastery`。
- `github-projects/deepseek-harness/packages/storage/storage-sqlite/src/index.ts`：`import type { DatabaseSync } from 'node:sqlite'`；`Config` = `{ path: string, journalMode?: 'wal'|'delete'|'truncate'|'persist' }`（schema 默认 `wal`）；注册 backend `sqlite`，disposer 先注销再 close；`ctx.provide(storageBackendServiceKey('sqlite'), backend)`。
- `github-projects/deepseek-harness/packages/storage/storage-domain/src/index.ts`：`defineDomain` / `domainTable` / `DomainSpec` / `DomainFacility.open(spec)`；`Config` = `{ backend: string(required), routes?: Record<string,string> }`；`inject = ['storage']`；领域句柄由调用方 `ctx.effect` 持有并 `Domain.close()`。
- `github-projects/deepseek-harness/packages/storage/storage-domain/src/spec.ts`：`DomainSpec` 含 `name`/`version`/`tables`/`global?`/`layout?`，zod schema 校验记录。
- `rules/plugin-package.md` §3：已有 seam 不重复造；Provider 与 Consumer 只依赖 Definition。

## 验证方式

- 能力填充后：`dsh --profile <demo> --dump-config` 出现 storage / sqlite / domain 配置层，`backend: sqlite`。
- 集成测试：通过 `ctx.storageDomain.open(spec)` 打开剧本领域，`put` 后重载会话可回读；dispose fiber 后 domain 关闭、backend 注销。
- 按 `docs/dsh-plugin-development-guide.md` §7 DoD 验证 HMR 清理与持久化回放。

## 遗留决策点（后续阶段）

1. 领域拆分粒度：五个领域各一 domain spec，还是合并为一个 spec 多 table
2. 记录 schema 具体字段（大纲/章节/世界/人物/时间线/物体）
3. SQLite 数据库文件路径来源（配置字段 vs 从宿主 profile 派生）
4. 是否需要 journalMode 配置暴露给终端用户（默认 wal 适用于本地盘）
