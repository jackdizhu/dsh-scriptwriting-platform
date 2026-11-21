---
name: skill-usage
description: dsh-scriptwriting-platform 技能调用强制规范。涉及前端 UI 必须调用前端技能，涉及后端代码必须调用后端技能；未安装时先确认安装，不得跳过。
---

# 技能调用规范

## 1. 强制规则

| 任务表面 | 动手前必须调用 | 当前可用技能 |
|---|---|---|
| 前端 UI：页面、组件、样式、交互、设计系统、客户端视图 | 前端技能 | `frontend-engineering`（显示名「前端工程」，已安装） |
| 后端代码：Node half、`ctx` 服务、`@Remote` API、tools/store 服务端逻辑、数据库与缓存 | 后端技能 | `backend-engineering`（显示名「后端工程」，已安装） |
| 同时涉及前端 UI 与后端代码 | 两类技能都要调用 | 按任务顺序逐个加载，不得只调用其中一类 |

- **调用时点**：必须在读取/修改对应代码之前完成技能加载；不得先写代码再补调用。
- **调用有效性**：调用后须落实技能给出的协议（前端：先用「前端工程」选定子技能并按其步骤执行，覆盖设计方向、组件组合、状态归属、WCAG 2.2 AA 与点击路径审计；后端：按「后端工程」相关子技能执行分层、参数校验、事务边界、幂等、错误码、日志与性能自检）。仅形式上调用、不采纳其输出，不算满足本规则。
- **技能缺失**：若对应技能未安装或加载失败，先告知用户并确认安装；在技能可用前不得直接写该类代码。
- **判不准时从严**：介于两类之间的任务按「涉及前端 UI 侧 / 涉及后端代码」从严归类，宁可多调用一类。

## 2. 判定口径（本项目）

| 路径 / 内容 | 归类 |
|---|---|
| `packages/ui/src/client/**`（`entries`/`app`/`features`/`shared/ui`/`charts`/`panels`/样式与客户端入口） | 前端 UI |
| `dsh.client` 导出、`sidebar.*`/`main` slot 注册、浏览器侧 `WorkbenchService` 镜像 | 前端 UI |
| `packages/ui/src/index.ts` 与插件的 `apply`/`inject`（Node half） | 后端代码 |
| `packages/tools/**`、`packages/store-local/**`、`packages/core/**` 中服务端类型、ctx 键、spec、工具实现 | 后端代码 |
| `ctx.provide` / `@Remote` API、SQLite 持久化、软删与同开域约束的服务端实现 | 后端代码 |
| 纯文档、构建脚本、依赖版本调整，不直接改 UI 或后端逻辑 | 不触发；但需在回复中说明为何不触发 |

## 3. 与其他规则的关系

- `agent-workflow.md` §1「先确认后执行」优先：技能调用不能替代用户对方案/放行的确认。
- `typescript.md`、`plugin-package.md`、`privacy-security.md` 继续适用；技能不能覆盖隐私安全与事实来源优先级。
- 本规则只约束「动手前调用哪类技能」，不改变 D1–D7 已拍板的技术决策与 slot 注册边界（其中 D6 已被 D7 替代）。
