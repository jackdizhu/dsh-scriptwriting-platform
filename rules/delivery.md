---
name: delivery
description: 交付与验收规范。用于提交、发版、文档更新前的检查纪律与验收清单，整合自 deepseek-harness 根 AGENTS.md、dsh-pre-push-checks、docs/testing.md 与开发指引 DoD。
---

# 交付与验收规范

## 1. 检查纪律

- 报告只写实际运行过的命令与结果；不虚构、不隐瞒失败。
- 只跑与改动相关的检查，不默认全量、不重复已通过的检查；CI 负责穷举覆盖与平台矩阵。
- 证据匹配表面：行为改动跑聚焦测试，模型/用户输出改动跑快照，文档改动跑文档门禁，发布路径跑构建烟测，provider 改动跑真实 API e2e。

## 2. 适用的检查命令

本仓库为树外插件，按其自身 `package.json` 脚本执行等价检查。参照 Harness 的检查项：

```
typecheck / lint / test / build / hygiene
doc-sync 或文档门禁（文档改动时）
```

Harness 源码路径的完整命令见 `github-projects/deepseek-harness/AGENTS.md` § Commands；仅在修改框架源码时使用。

- 开发用 `build:artifacts`，声称完成前在最新产物后跑 `build:check` 或完整 `build`。
- `test:coverage`（非 `test`）才是 CI 覆盖门禁；本地聚焦测试按改动选。
- 需要提权时留 sandbox 证据，用最小范围；永不绕过测试失败或产品沙箱。

## 3. 功能验收（DoD）

- [ ] `--patch` overlay 启动打印加载日志，Web UI 无报错；`dsh --profile <name> --dump-config` 能看到自身配置层。
- [ ] 每个工具在 Web UI 可被模型调用，输入校验与输出渲染符合预期。
- [ ] 修改 `cordis.yml` 中 config 后 HMR 生效，旧注册无残留。
- [ ] 卸载插件或服务提供方消失时，事件监听与工具注册被清理（dispose fiber 后观测移除）。
- [ ] 产品可见插件通过 REAL composition 测试；持久事件重载后可回放。
- [ ] 负向用例经真实 runner 验证按预期失败；边界值（极小/恰好/超大/多字节）已覆盖。

## 4. 文档与设计交付

- [ ] 代码行为变更后，同一次改动更新包 README 与 JSDoc 契约。
- [ ] 影响模型可见内容的插件填写 Model Experience 三字段（What the model sees / Token effect / KV Cache effect）或按 allowlist 声明 None。
- [ ] 「功能 → 扩展点 → 插件」对照表与已确认决策回写本仓库 `docs/`，未确认项标注为建议。
- [ ] 新文案/注释经语义审查：覆盖完整、准确、归属正确、无实现叙述与重复理由。
- [ ] 英文文案 sentence case；客户端 UI 文案走本地化字典。
- [ ] 无机器本地绝对路径残留（在项目根用 `grep -rniI "<工作区根名>" .` 自检，排除 `.git` 与目录联接目标；`<工作区根名>` 替换为实际工作区根目录名）。

## 5. git 提交

- 提交前 `git diff --cached --check`；文件末尾恰好一个换行。
- 本地操作由 Agent 执行；`push`/远程读写由用户手动（见 `agent-workflow.md` § 4）。
- 提交信息说清行为变化与原因；独立改动拆分提交，先修正引入它们的 PR 再传播。
