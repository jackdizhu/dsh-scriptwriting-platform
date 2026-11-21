---
name: rules-index
description: dsh-scriptwriting-platform 规则索引。任何 AI Agent 在本仓库开始工作前先读本页，按任务类型加载对应规则文件。
---

# Rules 索引

本目录是 `dsh-scriptwriting-platform` 的 AI Agent 规则集。规则由五类规范整合而来：deepseek-harness 项目规范、dsh 独立插件包开发规范、TypeScript 代码规范、AI Agent 开发规范、隐私安全规范。来源均可追溯到 `github-projects/deepseek-harness/` 内的真实文件；本仓库自身约束以 `AGENT.md`、`docs/dsh-plugin-development-guide.md` 为准。

> **路径约定**：本仓库所有文档只使用相对路径。引用 Harness 时用 `github-projects/deepseek-harness/...`（项目内的目录联接）。**禁止**在项目中写入任何机器本地绝对路径。

## 加载顺序

| 时机 | 必读 |
|---|---|
| 任何任务开始 | 本页 + `agent-workflow.md` |
| 改 TS/JS 代码 | `typescript.md` |
| 涉及前端 UI（页面、组件、样式、交互、客户端视图） | 本页 + `skill-usage.md`，并先调用前端技能 |
| 涉及后端代码（Node half、`ctx` 服务、tools/store 服务端逻辑） | 本页 + `skill-usage.md`，并先调用后端技能 |
| 开发/审查 dsh 插件 | `plugin-package.md` |
| 涉及凭据、用户数据、日志、外部输入、命令执行 | `privacy-security.md` |
| 提交、发版、写文档 | 追加本目录下的 `delivery.md` |

## 规则文件

- `agent-workflow.md` — AI Agent 工作方式：先确认后执行、证据驱动、决策记录、git 权限分级、检查纪律。
- `typescript.md` — TS/ESM 代码规范：编译选项、类型纪律、错误处理、注释与文档、防御性模式。
- `plugin-package.md` — dsh 独立插件包规范：Cordis 模型、插件形态、生命周期、seam 三角色、manifest、patch、配置。
- `privacy-security.md` — 隐私与安全规范：最小权限、凭据管理、脱敏、不可信输入、命令与插件审查、供应链。
- `delivery.md` — 交付与验收规范：检查纪律、DoD 清单、git 提交。
- `skill-usage.md` — 技能调用强制规范：前端 UI 必调 `frontend-engineering`（前端工程），后端代码必调 `backend-engineering`（后端工程）；含项目内前后端判定口径。

## 事实来源优先级

冲突时按下序裁决：

1. `github-projects/deepseek-harness/` 源码与源码生成的参考（`subsystems/`、`*-catalog`、`capability-seams`、`cordis-api`）
2. `github-projects/deepseek-harness/docs/` 的中文文档（`.zh.md`）
3. 官方文档站 `https://deepseek-harness.github.io/deepseek-harness/`
4. 本仓库 `AGENT.md`、`docs/dsh-plugin-development-guide.md` 与 `docs/` 下决策记录

**禁止**凭记忆猜测 API、事件名或配置键；查不到就到 `subsystems/<域>.zh.md` 的 `cordis-surface` 区块或源码中查证。
