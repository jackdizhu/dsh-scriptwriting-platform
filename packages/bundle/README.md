# dsh-scriptwriting-platform (bundle)

组合包：`dsh.bundle.patch` 指向 `cordis.patch.yml`，装配 core / store / tools / ui。

## 装配顺序

harness 的 storage 三包（`@deepseek-ai/dsh-storage` → `-sqlite` → `-domain`）是本包的前置依赖，由 profile 侧保证先行加载（`ctx.storage.form('domain')` 在 domain 插件加载前会抛 `form-not-mounted`）。本平台四包随后装配。

SQLite 后端配置由 profile/patch 提供（真源 `packages/storage/storage-sqlite/src/index.ts`）：

- `path`：数据库文件路径，`:memory:` 用于测试
- `journalMode`：`wal`（默认）/ `delete` / `truncate` / `persist`

## 安装与验证

```sh
dsh plugin --profile demo add ./packages/bundle
dsh --profile demo --dump-config   # 确认 dsh-scriptwriting-platform 层（含 id: scriptwriting-platform 行）与 storage backend=sqlite
dsh --profile demo
```

## Model Experience

- What the model sees：None（装配层，内容由被装配的 tools 包贡献）
- Token effect：zero
- KV Cache effect：independent
