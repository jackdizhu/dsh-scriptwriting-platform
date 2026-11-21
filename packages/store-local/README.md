# dsh-scriptwriting-store

剧本领域声明包（薄封装）。**不实现数据库**——复用 harness 已内置的 SQLite storage seam。

## 分层（依据 `github-projects/deepseek-harness/docs/subsystems/storage.zh.md`）

| 角色 | 包 | 我们的动作 |
|---|---|---|
| Definition | `@deepseek-ai/dsh-storage`（`ctx.storage`） | 声明依赖，不重复定义 |
| Provider | `@deepseek-ai/dsh-storage-sqlite`（注册名 `sqlite`） | 声明依赖，由 bundle 装配 |
| Consumer | `@deepseek-ai/dsh-storage-domain`（`ctx.storageDomain`） | 声明依赖，用它打开领域 |

本包只声明领域 spec（`defineDomain` + zod schema），供 `tools` 消费。

## 后端配置（harness 真源 `packages/storage/storage-sqlite/src/index.ts`）

- `path`：数据库文件路径，`:memory:` 为进程内数据库（测试用）
- `journalMode`：`wal`（默认，本地盘）/ `delete` / `truncate` / `persist`（网络挂载）
- 数据库用 Node 原生 `node:sqlite`，无第三方驱动；目录与文件按 owner-only 权限创建

## 生命周期

领域句柄由调用方 `ctx.effect` 持有，disposer 调 `Domain.close()`；卸载顺序由 bundle 安排，disposer 先注销 backend 名再 close（harness 已实现）。

## Model Experience

- What the model sees：None（领域声明不直接贡献模型可见内容）
- Token effect：zero
- KV Cache effect：independent
