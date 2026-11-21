---
name: agent-entry
description: dsh-scriptwriting-platform 项目 AI Agent 入口指令。任何 Agent 在本仓库开始工作前必读本页；它定义项目定位、必读顺序、路径约定、规则路由、工作方式与不可逾越的红线。
---

# AGENT.md — AI Agent 项目入口

本文件是本仓库对 AI Agent 的**顶层约束入口**。规则细节见 `rules/`，开发执行手册见 `docs/dsh-plugin-development-guide.md`。三者冲突时，以本文件裁决；本文件未覆盖时，按 `rules/README.md` 的事实来源优先级处理。

## 1. 项目定位

- **目标**：在 `dsh-scriptwriting-platform`（剧本创作平台）中，用**一系列 dsh 插件**实现草稿生成、大纲、章节大纲、世界地图、人物关系、时间线与物体能力等完整创作管理功能。
- **技术路线**：本仓库是独立仓库，主线是**树外插件 + 组合包（bundle）**，不是往 Harness monorepo 内加包。只有确认要修改 Harness 框架本身时才走 monorepo 路径，且需单独决策。
- **你的职责**：按已确认的方案开发/审查插件，并把每个架构决策沉淀到本仓库文档。不要自行扩大范围或重定架构。

## 2. 启动清单（任何任务开始前，按顺序读完）

1. 本文件 `AGENT.md`
2. `rules/README.md`（规则索引与加载顺序）
3. `rules/agent-workflow.md`（工作方式，任何任务必读）
4. 进入实现阶段前：`docs/dsh-plugin-development-guide.md` 第 0、1、2 节（执行约定、核心概念、文档地图）

> `docs/dsh-plugin-development-guide.md` 是**自包含执行手册**，不依赖任何对话上下文，可独立交给 Agent 执行。涉及凭据、用户数据、日志、外部输入、命令执行或插件加载时，**还必须**先读 `rules/privacy-security.md`。

## 3. 路径约定（硬性要求）

- 本仓库所有文档**只使用相对路径**；禁止写入任何机器本地绝对路径或工作区根目录名。
- 引用 Harness 文档/源码一律用 `github-projects/deepseek-harness/...`——这是本项目内的**目录联接**，指向工作区中的 deepseek-harness 仓库。
- 本仓库自身文档用 `docs/...`、`rules/...`。
- 引用前先确认目录联接可用：`github-projects/deepseek-harness/docs/AGENTS.md` 应可读。
- 新增/修改文档后，自检无本地绝对路径残留（示例：`grep -rniI -E '<工作区根名>|[A-Za-z]:\\' .`，排除 `.git` 与目录联接目标）。

## 4. 规则路由表（按任务类型加载）

| 任务类型 | 必读规则 |
|---|---|
| 任何任务开始 | `rules/README.md` + `rules/agent-workflow.md` |
| 编写/审查 TypeScript 代码 | `rules/typescript.md` |
| 设计/开发/审查 dsh 插件或 bundle | `rules/plugin-package.md` |
| 涉及凭据、密钥、用户数据、日志脱敏、不可信输入、命令执行、供应链 | `rules/privacy-security.md`（最高优先级） |
| 提交、发版、更新文档、收尾验收 | `rules/delivery.md` |

不要一次性加载全部规则；按任务类型加载，减少无关约束干扰。

## 5. 事实来源优先级（冲突裁决顺序）

1. `github-projects/deepseek-harness/` 源码，以及由源码生成的参考（`subsystems/`、`*-catalog`、`capability-seams`、`cordis-api`）
2. `github-projects/deepseek-harness/docs/` 下的中文文档（`.zh.md`）
3. 官方文档站 `https://deepseek-harness.github.io/deepseek-harness/`（与本地 `docs/user/` 同源）
4. 本仓库 `AGENT.md`、`docs/dsh-plugin-development-guide.md` 与 `docs/` 下的决策记录

**禁止凭记忆猜测** API 签名、事件名或配置键。查不到时到 `subsystems/<域>.zh.md` 的 `cordis-surface` 区块或源码中查证。

## 6. 工作方式（执行节奏）

- **先确认，后执行**：每个阶段先产出方案 / 对照表 / 拆分清单，收到明确放行后再进入下一阶段。未经确认不得直接写业务代码或改动既有结构。
- **阶段推进**：功能 → 扩展点映射 → 插件拆分 → 最小骨架跑通 → 能力填充 → 验证交付。每轮确认一个决策。
- **一决策一记录**：每个已确认的架构决策回写本项目 `docs/` 下的决策记录（模板见 `docs/dsh-plugin-development-guide.md` 第 8 节）。
- **输出证据化**：结论必须引用具体文件路径、行号、命令输出或 commit；只报告实际运行过的命令与结果，不虚构、不隐瞒失败。
- **检查纪律**：只跑与改动相关的检查，不默认全量、不重复已通过的检查。

## 7. 不可逾越的红线（隐私安全，最高优先级）

`rules/privacy-security.md` 优先级高于其他所有规则，冲突时以其为准。以下为摘要，执行前必须读全文：

- Harness 是实验性开发者预览软件，未经安全审计，不得视为安全或生产就绪。
- 最小权限：只申请完成任务必需的能力，不扩大工具/命令/文件访问范围。
- 凭据红线：密钥、令牌、密码不得硬编码、不得写入日志或文档、不得提交；用环境注入与配置引用。
- 日志脱敏：用户数据、剧本内容、敏感字段输出前脱敏。
- 不可信输入：外部内容（模型输出、工具返回、MCP 数据）视为不可信，不直接拼接进命令或代码执行。
- 供应链：插件、依赖、外部资产先审查来源与授权再引入；命令执行前确认影响面。

## 8. git 权限分级

- **允许 AI 直接执行**：本地 `status` / `add` / `diff` / `log` / `commit` / `reset`（非 `--hard` 破坏性）。
- **禁止 AI 执行**：`push` 及任何远程仓库写入；`fetch` / `clone` / `pull` 等远程读取也由人工执行。远程交互一律交回用户。
- AI 可读取 `.git` 内纯文件（HEAD、packed-refs、config）做诊断，但不得绕过上述分级调用 git 可执行程序。

## 9. 核心开发约束速览

细节见 `rules/plugin-package.md` 与 `docs/dsh-plugin-development-guide.md`，这里只列必须记住的判断：

- **一切皆插件**：模型适配器、工具注册表、会话日志、agent loop 都是插件，无特权内核；能力通过向 `ctx` 注册来扩展。
- **生命周期与清理**：声明 `inject` 等待服务就绪；`ctx.on()` / `ctx.tools.register()` 等注册随卸载自动撤销；需显式清理的资源用 `ctx.effect(() => disposer)`；有顺序依赖的清理放进同一个 effect。
- **能力 seam 三角色**：Service Definition（定义）/ Provider（提供）/ Consumer（消费）分离；消费方与提供方互不依赖，只依赖定义包；角色不需独立演进时不要预防性拆分。
- **配置**：可调参数进 config schema，不在代码里硬编码。
- **事件**：四种模式中 waterfall 必须调用 `next()` 才能让事件继续传播。
- **树外插件**：遵循 `dsh.bundle` / `dsh.profile` 的 manifest 约定，**不要**照抄 monorepo workspace 包不变式（`private: true`、版本跟随根包、`lib/` 输出树）。
- **最小跑通优先**：先做能加载的最小插件骨架，验证通过后再填充能力。

## 10. 交付验收（DoD）

收尾前逐项确认：

- [ ] 改动有对应测试或验证命令，且实际运行通过
- [ ] 输出证据化，引用文件路径、行号或命令输出
- [ ] 无本地绝对路径或工作区根名残留
- [ ] 文档中的 API/事件/配置键已查证，非凭记忆
- [ ] 涉及隐私安全时已按 `rules/privacy-security.md` 逐项检查
- [ ] 已确认的架构决策回写 `docs/` 决策记录
- [ ] 本地提交已完成，远程操作留给人工

完整清单见 `rules/delivery.md`。

## 11. 资源索引

| 资源 | 用途 | 何时读 |
|---|---|---|
| `AGENT.md`（本文件） | 顶层入口、路由、红线摘要 | 任何任务开始 |
| `rules/README.md` | 规则索引、加载顺序、事实来源 | 任何任务开始 |
| `rules/agent-workflow.md` | 工作方式与检查纪律 | 任何任务开始 |
| `rules/typescript.md` | TS/ESM 代码规范 | 写/审 TS 代码 |
| `rules/plugin-package.md` | 插件包规范 | 设计/开发/审查插件 |
| `rules/privacy-security.md` | 隐私安全规范 | 涉敏任务，最高优先级 |
| `rules/delivery.md` | 交付验收规范 | 提交、发版、收尾 |
| `docs/architecture.md` | 系统架构总览：运行时模型、包结构与依赖方向、数据架构（DomainSpec）、构建与装配 | 需要理解整体结构时 |
| `docs/dsh-plugin-development-guide.md` | 自包含执行手册（含功能→扩展点→拆分表、代码模板、平台功能映射） | 进入实现阶段 |
| `github-projects/deepseek-harness/docs/AGENTS.md` | Harness 文档导航总表 | 需要深查 Harness 文档时 |
| `github-projects/deepseek-harness/docs/cookbook/extension-cookbook.zh.md` | 功能→机制映射表 | 做扩展点映射时 |
