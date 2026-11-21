# 实施步骤

- 版本：1.6（2026-11-21）
- 状态：**阶段 0 已放行、阶段 1 已完成、阶段 1.5 已完成**（D1/D2/D3 用户拍板，见 `docs/decisions/2026-11-21-{UI入口与承载位置,客户端构建链,静态数据来源}.md`）；**D4 多作品数据模型已拍板**（见 `docs/decisions/2026-11-21-多作品数据模型.md`）；**D5 多作品运行时约束已拍板**（状态同步 = Node `ctx` 服务 API + 浏览器单向展示、删除 = 软删、同开域上限 = 1，见 `docs/decisions/2026-11-21-多作品运行时约束.md`）。阶段 1.5 已落地完整 UI 侧功能（作品工作台 + mock service，见 §3.13）；阶段 2 起按多作品模型推进。本文件是执行计划，不是决策本身。
- 前置阅读：`AGENT.md` → `rules/agent-workflow.md` → `docs/architecture.md`

> **本文档的定位**：把 `docs/architecture.md` 描述的「目标态」翻译成**可逐步执行、可验证**的动作序列。凡架构文档标注「设计建议（待确认）」的条目，这里同样不当作既成事实，一律标 `待确认`。

---

## 0. 排期原则

三条硬约束决定了顺序，不是偏好问题：

| 约束 | 出处 | 后果 |
|---|---|---|
| 先确认后执行，一决策一记录 | `AGENT.md` §6、`rules/agent-workflow.md` §1 | 每个阶段有明确的「退出条件」，未达成不进下一阶段 |
| 最小跑通优先 | `AGENT.md` §9、架构文档 §2.4 | 先让插件真的被加载，再填能力，不并行铺开五包 |
| UI 静态部分不依赖存储与模型 | 架构文档 §3.2 依赖方向、§5 | UI 可独立于 `core`/`store`/`tools` 先落地，是当前唯一无阻塞的入口 |

因此顺序是：**UI 静态 → core 类型 → store spec → tools → 真实数据接 UI → 横切能力 → 质量门禁**。

---

## 1. 阶段总览与依赖

```
阶段 0  开工确认（3 个决策点）
   │
   ▼
阶段 1  UI 静态部分（已完成）
   │        └─ 产出：可在 dsh Web GUI 里点开的三块静态面板
   │        └─ D4 新增待办 §3.13：作品列表/新建/切换入口（仍用 mock）
   ▼
阶段 2  core：领域类型 + 错误类 + ctx 键（含 Work / WorkId）
   │
   ├──────────────┬──────────────┐
   ▼              ▼              ▼
阶段 3 store   阶段 4 tools    （UI 继续做交互态，仍用 mock）
作品注册域     作品管理工具         │
+ 内容域模板   + 领域读写工具       │
   │              │                │
   └──────┬───────┘                │
          ▼                        ▼
      阶段 5  真实数据接 UI（按当前作品取数，替换 mock）
          │
          ▼
      阶段 6  横切：审批 / 命令 / 后台任务 / 流式展示
          │
          ▼
      阶段 7  质量门禁：test runner / lint / REAL composition / CI
```

| 阶段 | 目标 | 产出包 | 前置 | 退出条件 |
|---|---|---|---|---|
| 0 | 敲定 3 个阻塞项 | — | — | 用户对 §2 三项逐条答复 |
| **1** | **UI 静态部分可点开、可看** | `ui`（+`bundle` 一行 patch） | 阶段 0 | §3.11 验收清单全绿（**已完成**，作品入口补作 §3.13） |
| 1.5 | 完整 UI 侧功能：作品工作台 + mock service 接口层 | `ui` | 1 + D4/D5 | 作品列表/新建/切换/重命名/软删可用，三视图按当前作品联动，tab kind 不变（**已完成**） |
| 2 | 领域类型与错误契约（含 `Work`/`WorkId`） | `core` | 阶段 0 + D4/D5 | `pnpm typecheck` 通过，类型被 3、4 引用 |
| 3 | DomainSpec 声明：作品注册域 + 内容域模板（软删字段） | `store` | 阶段 2 + D4/D5 | `open()` 成功，坏记录行为符合 spec |
| 4 | 模型可读写工具 + 作品管理工具 + `ctx` 服务 `@Remote` API | `tools` | 阶段 2 + D4/D5 | 工具在真实会话中可调用，README 三字段填全 |
| 5 | mock 换真实数据（按当前作品取数，走 Node 服务 API） | `ui` + `tools` | 3、4 + D5 | 面板数据来自领域存储、切换作品数据随之变，刷新不丢 |
| 6 | 审批、命令、后台、流式 | 新钩子包 / `ui` | 5 | 写操作需审批生效 |
| 7 | 门禁补齐 | 全仓 | 1–6 | lint + test + REAL composition 可跑 |

---

## 2. 阶段 0：三个待确认项（阻塞阶段 1）

阶段 1 不确认这三点就无法动工，因为任一项选错都要返工文件结构。

### 2.1 决策点 D1：UI 静态部分的承载位置

「静态部分」必须先有一个容器，否则组件写在哪都一样。三个候选都已被 harness 实现，不需要新造 slot（架构文档 §3.3 已指出：`ui` 目前缺 `dsh.client`，无 slot 可用是现状而非选择）。

| 选项 | 机制 | 用户看到什么 | 代价 |
|---|---|---|---|
| **A. 右侧栏 tab 类型（建议）** | `ctx.sidebarRightTabs.register()` + `sidebar.right.pane.tab` keyed slot | 右侧栏独立页面，可从引导页点开，可停靠/浮出 | 需 `inject: ['slots','sidebarRightTabs']`，需注册 title 坑位 |
| B. 会话头部按钮 | `conversation.session.header.actions` list slot | 会话顶部一个按钮 + 弹层 | 弹层要自己管显隐，没有停靠面 |
| C. 会话内卡片 | `conversation.chat.node` keyed slot | 混在对话流里的卡片 | 世界地图/时间线塞进对话流不合适；且需要 ConversationNodeDefinition，成本最高 |

建议 A。理由：三块内容（世界地图、人物关系、时间线）都是**独立于对话流的结构化视图**，天然属于侧栏；且 `guide` 字段让它们出现在右侧栏引导页，静态阶段无需自己做入口按钮，验证路径最短。

> 证据：`github-projects/deepseek-harness/docs/subsystems/sidebar-right.zh.md`「Tab 类型注册」与「扩展席位」；参照实现 `packages/client/ui-plan/src/client/index.ts`（注册 tab 类型 + body + title 三段式）。

#### 2.1.1 详细落点（选项 A 展开）

**整页位置**——三块视图落在最右侧那一列，与对话流并列、互不遮挡：

```
dsh Web GUI（一个会话）
┌────────────────────────────────────────────────────────────────────────┐
│ 会话头部 session header                              [① actions 区]      │
├──────────────┬────────────────────────────────┬────────────────────────┤
│ 左侧栏        │ 对话区 conversation             │ 右侧栏 rightbar         │
│              │                                │ ┌────────────────────┐ │
│ 会话列表      │  用户消息                       │ │ ② tab 条            │ │
│  · 会话 A     │  模型回复                       │ │ 引导 文件 地图 关系…│ │
│  · 会话 B     │  工具调用卡片                    │ ├────────────────────┤ │
│              │                                │ │ ③ 正文坑位          │ │
│ ⑤ 创作平台 ←  │  ⑥ 选中时：主列换成平台页         │ │  （面板渲染在这里）  │ │
│ 插件         │                                │ └────────────────────┘ │
└──────────────┴────────────────────────────────┴────────────────────────┘
   ↑ 左栏插件按钮区（本次新增一行）    本次新增的三个 chip ↑  ↑ 本体
```

**右侧栏放大**——一个 tab 类型 = tab 条上的一个 chip + 正文坑位里的一个组件：

```
右侧栏（每会话一份，可停靠 / 浮出 / 分栏）
┌──────────────────────────────────────────────────────────────┐
│ ② tab 条：chip 文案来自 tab 类型定义的 title(address)          │
│ ┌──────┬──────┬────────┬──────────┬──────────┬──────────┐    │
│ │ 引导 │ 文件 │ 浏览器  │ 世界地图  │ 人物关系  │ 时间线    │    │
│ └──────┴──────┴────────┴──────────┴──────────┴──────────┘    │
│                          └───────── 本次新增 3 个 ─────────┘   │
├──────────────────────────────────────────────────────────────┤
│ ③ 正文坑位 sidebar.right.pane.tab（keyed = tab type id）       │
│                                                              │
│   ┌─ PanelShell ──────────────────────────────────────┐      │
│   │ 标题行                              [工具条占位]    │      │
│   ├───────────────────────────────────────────────────┤      │
│   │                                                   │      │
│   │   ECharts 画布（graph / custom series）            │      │
│   │                                                   │      │
│   └───────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

**引导页**——右侧栏为空时的默认页，`guide` 字段自动生成入口卡，点击即 `openTab(kind)`：

```
右侧栏引导页（guide）
┌──────────────────────────────┐
│ 打开…                         │
│ ┌──────────┐ ┌────────────┐  │
│ │ 世界地图   │ │ 人物关系    │  │  ← 由 tab 类型的 guide 字段生成
│ └──────────┘ └────────────┘  │
│ ┌──────────┐                 │
│ │ 时间线    │                 │     点卡片 = 打开对应 tab
│ └──────────┘                 │
└──────────────────────────────┘
```

**七个位置 ↔ 注册点对照**（②③③′④⑤⑥ 本次用；①⑦ 不用）：

| # | 界面位置 | 归属包 | 注册 API | 本次 |
|---|---|---|---|---|
| ① | 会话头部右侧动作区 | `ui-conversation`（`conversation.session.header.actions`，list） | `ctx.slots.inject()` + `register({name,id,order})` | 不用（备选 B） |
| ② | 右侧栏 tab 条 chip | `ui-sidebar-right` | `ctx.sidebarRightTabs.register({ id, kind, title })` | **用** |
| ③ | 右侧栏正文 | `ui-sidebar-right`（`sidebar.right.pane.tab`，keyed） | `ctx.slots.register({ name, key: <tab id> })` | **用** |
| ③′ | tab 标题（浮出/分栏时的标签） | `ui-sidebar-right`（`sidebar.right.pane.tab.title`，keyed） | 同上，`name` 换成 title 坑位 | **用** |
| ④ | 引导页入口卡 | `ui-sidebar-right` | 同 ②，附 `guide: { order, title() }` | **用** |
| ⑤ | 左侧栏插件按钮区的一行 | `ui-sidebar`（`sidebar.panellist`，list） | `ctx.slots.register({ name, id, order, label })` | **用**（「创作平台」行，见 §2.1.2） |
| ⑥ | 主列页面 | `ui-layout`（`main`，keyed by panel id） | `ctx.slots.register({ name: 'main', key })` | **用**（β 必需，与 ⑤ 成对） |
| ⑦ | 左侧栏新建会话行（hoc） | `ui-sidebar`（`sidebar.session.action`） | `ctx.slots.register({ name })` | 不用（α 方案已弃） |

三个 tab 的身份（`id` 必须全局唯一，`kind` 必须互不相同）：

| id | kind | title | guide.order |
|---|---|---|---|
| `dsh-scriptwriting-ui/worldmap` | `scriptwriting-worldmap` | 世界地图 | 10 |
| `dsh-scriptwriting-ui/relations` | `scriptwriting-relations` | 人物关系 | 20 |
| `dsh-scriptwriting-ui/timeline` | `scriptwriting-timeline` | 时间线 | 30 |

关键区分：**② 是「类型定义」，③/③′ 是「该类型的渲染实现」**，两者用同一个 `id` 关联；`kind` 只用于 `openTab(kind)` 与地址路由，不出现在 slot key 里。

#### 2.1.2 左侧栏入口：创作平台按钮（新增需求）

**需求**：左侧栏「工作区上方、插件按钮区」增加一个「创作平台」入口，点一下打开右侧面板，再点一下关闭。

**机制约束（查证自源码，决定了它不能简单地做成那个区域的一行）**：

| 事实 | 出处 |
|---|---|
| 该区域是 `sidebar.panellist`（list, root scope），每行 `id` 对应一个**主列面板**（`MainPanelId`），点击由壳层直接 `selectPanel(id)` + 埋点，**没有可覆盖的激活钩子** | `packages/client/ui-sidebar/src/client/SidebarRoot.tsx` PanelRow 的 `onClick`（80–83 行） |
| 右侧栏的开关在 `ctx.sidebarRight`（`ISidebarRight`）：`isExpanded()` / `toggleExpanded()` / `openTab(kind)` / `active()` / `hide(tabId)` | `ui-sidebar-right/src/client/service.ts` |
| `openTab` 打开**停靠** tab 时会在同一步展开列（"content the user cannot see is not opened"） | 同上 `openTab` 注释 |
| 左栏能放自定义交互控件的座位只有两个：`sidebar.session.action`（hoc，包住「新建会话」行，在面板列表**正上方**）与 `sidebar.footer.action`（底部，Settings 旁） | `ui-sidebar/src/client/contract/slots.ts` |

**三个落法**（已定：**β**，决策记录 `docs/decisions/2026-11-21-UI入口与承载位置.md`）：

| 方案 | 落点 | 视觉位置 | 代价 |
|---|---|---|---|
| α | `sidebar.session.action` hoc | 新建会话行，面板列表正上方 | 该行仅在 `canStartSession` 为真时渲染（`SidebarRoot.tsx:351`），无建会话权限时按钮消失 |
| **β（已选）** | `sidebar.panellist` 行 + `main` 主列面板 | 与「插件」同排，位置最准 | 必须同时注册主列页面；点击会切走主列；**重复点击无法关闭** |
| γ | `sidebar.footer.action` | 底部 Settings 旁 | 渲染最稳定，但位置与「工作区上方」不符 |

**β 的两条已知代价**（来自 `selectPanel` 的幂等语义，已接受）：

1. **再点同一行不会关闭右栏**——壳层只把 `activePanelId` 赋成同一个值（`ui-layout/src/client/stores.ts` 94–97 行），不产生第二次状态变化，我们也拿不到该点击。「关闭」由两处承担：主列页面内的「收起右侧面板」按钮、右栏自带收起控件。
2. 点击会**替换主列内容**（对话流被「创作平台」页取代），返回对话走壳层自己的返回控件。

因此「创作平台」页不是空占位，它要承担真实职责：三块视图的入口卡、当前视图摘要、「收起右侧面板」按钮。

**注册配方（两处必须成对，缺一个 `selectPanel` 就抛错）**：

```ts
const PANEL_ID = 'scriptwriting' as MainPanelId

// ① 主列页面：keyed by panel id，壳层 renderSlot('main', {}, { entryKey: panelId })
ctx.slots.inject('main', () => ctx.slots.register({
  name: 'main', key: PANEL_ID,
}, PlatformPage))

// ② 左栏插件按钮区的一行：id 必须与面板 id 相同
ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
  name: 'sidebar.panellist',
  id: PANEL_ID,
  order: 20,
  label: () => '创作平台',
}, PlatformIcon))
```

对照实现：`packages/client/ui-plugin-manager/src/client/index.ts`（`main` keyed 注册 132–137 行、`sidebar.panellist` 184–190 行）——「插件」页就是用同一对注册做出来的。

**进入页面时的右栏行为**（不用点击钩子，改用状态观察）：

```ts
// 进入「创作平台」页 → 展开右栏并聚焦上次的视图
ctx.effect(() => ctx.layout.panelInfo.subscribe(() => {
  if (ctx.layout.panelInfo.getSnapshot().activePanelId !== PANEL_ID) return
  if (ctx.sidebarRight.isExpanded()) return          // 已开就不打扰用户
  ctx.sidebarRight.openTab(lastKind)
}), 'scriptwriting-ui: panel entry')
```

- **不自动收起**：离开该页时不动右栏，避免抢用户已经做过的操作。
- 记住上次 kind 用模块级变量即可；`openTab` 对同一 kind 是「地址即身份」，重复打开只聚焦已有 tab，不会叠加。
- 图标用 `size`/`active` 两个 owner props 做两态（`sidebar.panellist` 的 owner props 只有这两个），不靠颜色区分。
- 文案固定「创作平台」，阶段 6 再走 `ctx.locale`。

**验收（阶段 1 追加）**：

- 左栏出现「创作平台」行，与「插件」同排、在工作区列表之上
- 点击 → 主列显示创作平台页，右栏展开到上次视图（首次为世界地图）
- 再点同一行 → 主列不变、右栏**不关闭**（β 的预期行为，不是缺陷）
- 点页面内「收起右侧面板」→ 右栏收起
- 右栏开着「文件」时点击 → 切到我们的视图，不关闭右栏
- 卸载插件后行与主列页面同时消失，`selectPanel` 不再认可该 id




### 2.2 决策点 D2：客户端构建链

这是阶段 1 最大的不确定性，必须显式选。

**事实**：客户端产物不是普通 ESM，而是 lazy-CJS factory，契约固定为

```js
window.__ModuleLoader__.load({ id: "<package-name>", factory: (require) => {
  var module = { exports: {} }; var exports = module.exports;
  /* cjs body */
  return module.exports; } });
```

`react`、`react/jsx-runtime`、`react-dom`、`@deepseek-ai/cordis`、`dsh-client-ui-slots` 等**不在产物里**，由页面模块表通过注入的 `require` 解析（平台模块清单见 `packages/client/web/src/platform.ts`）。

生成它的 `clientBundle` tsdown 预设位于 `packages/client/tsdown.client.ts`，**不在任何已发布包里**。该文件顶部直接 import 了仓库内脚本（`scripts/client-build-environment.ts`、`scripts/experimental-package-policy.ts`、`scripts/bundle-input-isolation.ts`），因此**不能原样搬到树外仓库运行**。

| 选项 | 做法 | 优点 | 代价 |
|---|---|---|---|
| **A. 复刻最小子集（建议）** | 新增 `packages/ui/tsdown.config.ts`：rolldown/tsdown，`format: 'cjs'`，`external` 只列 react 三件，补 banner/footer 上述契约 | 产物与 harness 同构；不引入 harness 源码；依赖最少 | 无 CSS Modules、无 purity gate（靠人工纪律）；第三方库需内联，体积要自己盯 |
| B. 整份复制 harness 预设 | 把 `tsdown.client.ts` 及它 import 的三个 scripts 一起搬进来 | 功能最全（CSS Modules、资源哈希、纯净性检查） | 搬运约 1300 行外部代码 + 3 个仓库内脚本，且随 harness 升级需持续同步；判定为不建议 |
| C. 先做独立 HTML 原型，暂不接 dsh | 纯静态页面，浏览器直接打开 | 零构建风险，最快看到视觉效果 | 不在真实运行环境，slot 生命周期、主题变量、卸载清理都无法验证；最终仍要走 A |

建议 A，并把 C 降级为「可选的前置草图」——若只是先对齐信息架构，可以画一版 HTML 草图，但**不作为阶段 1 的交付物**，避免双份实现。

### 2.3 决策点 D3：静态数据从哪来

| 选项 | 说明 |
|---|---|
| **A. 内置 mock fixture（建议）** | `src/client/mock/*.ts` 导出与未来领域类型同形的假数据，标注 `TODO(阶段 5)` 替换点 |
| B. 直接读 core 类型 | 需先做阶段 2，把 UI 静态部分拖到后面，违背「UI 先行」 |
| C. 从示例剧本文件读取 | 引入文件读取与解析，超出静态范围 |

建议 A，并在 mock 文件头写明「阶段 5 由 `dsh-scriptwriting-core` 同名类型替换，字段保持一致以免返工」。

---

## 3. 阶段 1：前端 UI 静态部分

### 3.1 目标与边界

**做**：让 `dsh-scriptwriting-ui` 真正被 dsh 加载，在 Web GUI 右侧栏注册三个 tab 类型（世界地图 / 人物关系 / 时间线），渲染由内置 mock 驱动的静态视图。

**不做**（写进 PR 描述，防止范围蔓延）：

- 不接 `ctx.storageDomain`、不 import `dsh-scriptwriting-store` / `-core` / `-tools`
- 不注册 `ConversationNodeDefinition`，不监听 `session/event` 或 `assistant-stream`
- 不实现新增/编辑/拖拽等交互写操作
- 不改 `bundle` 的 `apply()` 装配逻辑（只加一行 patch 行让 ui 被加载）
- 不做 i18n（字符串直接写中文，阶段 6 再抽 `ctx.locale`）

### 3.2 目录与文件清单

```
packages/ui/
├── package.json                 # [改] 加 dsh.client、exports["./client"]、build/typecheck 脚本
├── tsconfig.json                # [改] include 收窄为 src/index.ts
├── tsconfig.build.json          # [改] include 收窄，避免把客户端代码按 ESM 吐进 lib/
├── tsconfig.client.json         # [新] 客户端口径：lib 加 DOM、jsx: react-jsx（仅检查）
├── tsconfig.client.types.json   # [新] 客户端声明产物：emitDeclarationOnly → lib/client/
├── tsdown.config.ts             # [新] 客户端打包配置（决策 D2-A）
├── licenses/NOTICE.echarts.txt  # [新] Apache-2.0 4(d) 要求的 NOTICE 归属，构建时并入 banner
├── src/
│   ├── index.ts                 # [改] Node 半：保留空 apply，声明 inject: []
│   └── client/
│       ├── index.ts             # [新] 浏览器半入口：注册三个 tab 类型 + body + title
│       ├── echarts.ts           # [新] echarts/core 按需注册（图表/组件/renderer 只 use 需要的）
│       ├── entries/
│       │   ├── PlatformIcon.tsx   # [新] 左栏「创作平台」行的图标（sidebar.panellist）
│       │   └── PlatformPage.tsx   # [新] 主列页面：三视图入口卡 + 收起右栏按钮（main keyed）
│       ├── panels/
│       │   ├── PanelShell.tsx   # [新] 共用外壳：标题栏 / 工具条 / 内容区 / 空态
│       │   ├── ChartCanvas.tsx  # [新] ECharts 容器封装：init / setOption / resize / dispose
│       │   ├── WorldMap.tsx     # [新] 地点-路线图
│       │   ├── Relations.tsx    # [新] 人物关系图
│       │   └── Timeline.tsx     # [新] 多泳道时间线
│       ├── charts/
│       │   ├── world.ts         # [新] 纯函数：mock → EChartsOption（graph, layout none）
│       │   ├── relations.ts     # [新] 纯函数：mock → EChartsOption（graph, force/circular）
│       │   └── timeline.ts      # [新] 纯函数：mock → EChartsOption（custom + time 轴）
│       ├── mock/
│       │   ├── world.ts         # [新] 地点节点与边（含固定坐标）
│       │   ├── characters.ts    # [新] 人物与关系
│       │   └── events.ts        # [新] 时间线事件（含区间）
│       ├── theme.ts             # [新] 从 CSS 变量读色值，生成 ECharts 主题对象
│       └── styles.ts            # [新] 自家内联样式对象（不含第三方 CSS）
```

> 目录形态遵循架构文档 §7.1 的「`src/**` 源码、`lib/**` 产物」约定；`src/client/` 是 harness 的既有命名（见 `tsdown.client.ts` 中 `clientEntry = 'src/client/index.ts'`）。

### 3.3 Step 1：manifest 改造

`packages/ui/package.json` 需要新增/修改的字段：

```jsonc
{
  "exports": {
    ".": { "types": "./lib/index.d.ts", "default": "./lib/index.js" },
    "./client": { "types": "./lib/client/index.d.ts", "default": "./lib/client.js" },
    "./package.json": "./package.json"
  },
  "dsh": {
    "client": {
      "platform": "web",
      "inject": ["@deepseek-ai/dsh-client-ui-sidebar-right"]
    }
  },
  "scripts": {
    "build": "node ../../scripts/tsc.mjs && tsc -p tsconfig.client.types.json && tsc -p tsconfig.client.json --noEmit && tsdown",
    "typecheck": "tsc --noEmit && tsc -p tsconfig.client.json --noEmit",
    "build:client": "tsdown",
    "dev:client": "tsdown --watch"
  },
  "devDependencies": {
    "react": "^18.2.0",
    "@types/react": "^18.2.0",
    "echarts": "^6.1.0",
    "tsdown": "^0.x"
  }
}
```

`echarts` 放 **devDependencies 而不是 dependencies**：它会被完整内联进 `lib/client.js`，运行时不需要从 node_modules 解析；若写成 `dependencies`，发布后会让每个消费者白装一份 1 MB 级别的包。同理不要单独装 `zrender`（见 Step 5 的去重说明）。

要点（每条都有出处，不靠猜）：

- `dsh.client.inject` 是**包名边**，决定 factory 到达顺序与插件组合顺序；我们依赖 `sidebar-right` 声明的 `sidebar.right.pane.tab`，必须列它（形如 `ui-plan` 的 8 条 inject）。
- 浏览器半侧**只挂在说明符恰为裸包名的那一行**上。若后续把 ui 拆成多行，半侧留在根行（`packages/client/modules` 文档明确此点）。
- 不需要 `peerDependencies.react`：React 由页面模块表提供，`devDependencies` 仅为类型解析（与 `ui-plan` 一致）。
- `dsh.client.external` 可选，用于追加本包特有的外部请求；静态阶段不需要。

### 3.4 Step 2：Node 半保持空壳

`src/index.ts` 维持「注册主机侧无行为」的形态，但要成为合法插件：

```ts
import type { Context } from '@deepseek-ai/cordis'

/** 静态阶段不占用任何宿主服务；保留空 apply 以让本包成为合法 Loader 条目。 */
export const inject = [] as const

/**
 * Host 半：静态阶段无行为。
 * @param _ctx - 宿主上下文，未使用。
 */
export function apply(_ctx: Context): void {}
```

注意：`inject` 为空数组而非省略，避免 harness 的注入解析在不同版本下产生歧义；同时不要 `export {}` 这种「非插件」写法（现 `src/index.ts` 只有注释 + `export {}`，加载时会被判定为无 `apply`）。

### 3.5 Step 3：客户端 TS 口径

`tsconfig.base.json` 当前是 `lib: ["es2024"]`、`types: ["node"]`、无 `jsx`，直接给浏览器代码用会缺 DOM 类型、且 JSX 无编译口径。新增 `tsconfig.client.json`：

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["es2024", "dom", "dom.iterable"],
    "types": [],
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/client"]
}
```

`exports["./client"].types` 指向 `lib/client/index.d.ts`，所以还要一份只出声明的口径（tsdown 配置里 `dts: false`，避免重复生成）：

```jsonc
{
  "extends": "./tsconfig.client.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "rootDir": "src/client",
    "outDir": "lib/client",
    "sourceMap": false,
    "declarationMap": false
  },
  "include": ["src/client"]
}
```

同时要**收窄 Node 口径的 `include`**，否则 `tsc -p tsconfig.build.json` 仍会去编译 `src/client`：该文件用 `rootDir: src` + `outDir: lib`，会把浏览器代码按 ESM 吐到 `lib/client/`，与应用产物 `lib/client.js` 并存且语义错误。三处一起改：

| 文件 | 改动 |
|---|---|
| `packages/ui/tsconfig.json` | `"include": ["src"]` → `["src/index.ts"]`（typecheck 口径） |
| `packages/ui/tsconfig.build.json` | 自带 `"include": ["src"]`，同样改为 `["src/index.ts"]` |
| `packages/ui/tsconfig.dev.json` | 无需改，继承 build 的 include |

两个与 `scripts/tsc.mjs` 相关的坑，写进脚本顺序前必须先知道：

- 该包装脚本**只认** `--mode=` 与 `--watch`，`--project` 会被忽略；客户端类型检查要用 `tsc -p tsconfig.client.json --noEmit` 直调 `tsc`，不要传给包装脚本。
- 每次 `tsc.mjs` 运行前都会 `rmSync('lib')` 清空产物目录。因此 **tsc 必须在 tsdown 之前**，`build` 脚本的顺序不能反；单独重建客户端时用 `build:client`，不要跑 `build`（会把 `lib/client.js` 一起删掉）。

### 3.6 Step 4：打包配置（决策 D2-A 的落地）

`packages/ui/tsdown.config.ts` 的关键是四点：入口、外部依赖、环境常量定义、产物契约（外加 Apache-2.0 的归属义务）。

```ts
import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

/** React 由页面模块表注入；其余一律内联——echarts 必须内联，因为模块表里没有它。 */
const EXTERNAL = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

/** Apache-2.0 4(d)：分发产物必须携带 NOTICE 归属，放在 load 调用之后、factory 之前。 */
const NOTICE = readFileSync(new URL('./licenses/NOTICE.echarts.txt', import.meta.url), 'utf8')
  .trimEnd().split('\n').map(line => `/*! ${line} */`).join('\n')

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  format: 'cjs',
  platform: 'browser',
  outDir: 'lib',
  dts: false,
  sourcemap: true,
  external: EXTERNAL,
  // 内联的 zrender/echarts 含 246 处 process.env.NODE_ENV；浏览器无 process 全局。
  // factory 执行即抛 "process is not defined"（dsh-desktop web-boot 实测）。
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  outputOptions: {
    banner: `window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: (require) => {\n${NOTICE}`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
})
```

对照 harness 预设的实际写法（`packages/client/tsdown.client.ts` 第 1148–1153 行）：banner 带包名、intro 造 `module`/`exports`、footer `return module.exports; } });`。harness 用独立的 `postBanner` 放许可注释，普通 tsdown 没有该钩子，所以这里把它并进 `banner` 字符串。

四条不可违反的边界：

- **必须 `define` 掉 `process.env.NODE_ENV`**。内联的 zrender/echarts 源码含约 246 处 `process.env.NODE_ENV`；浏览器没有 `process` 全局，factory 一执行就抛 `process is not defined`，dsh-desktop 报 `web boot: 1 entry did not activate`。`define: { 'process.env.NODE_ENV': '"production"' }` 全局替换成生产常量，顺带让 dev-only 的 assert/log 分支被常量折叠掉。
- **`external` 只列 react 三件+`react-dom/client`**。把 `echarts` 加进 external 或在 `dsh.client.external` 里声明它，会让产物在运行时 `require('echarts')`——而页面模块表里没有这一项，直接抛错。
- **不要给产物加 CSS 管线**：本期用到的 echarts / zrender 都不依赖外部样式表，自家样式走内联对象，因此不需要额外的 `css-as-text` 插件。真到需要第三方 CSS 时再补，不要预防性引入。
- **许可归属不能省**：Apache-2.0 第 4(d) 条要求分发时保留 NOTICE。产物是单文件、会被拼进 combo 脚本，注释头是唯一稳定的携带位置。

**验收这一小步的硬指标**：构建后 `lib/client.js` 首行必须是 `window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: ...`，全文不出现 `import ` 语句，也不出现 `require("echarts")`。

### 3.7 Step 5：静态组件（ECharts + ZRender）

技术栈确定为 **ECharts 为主、ZRender 为补充**，两者不是并列关系：ECharts 内部就是调 `zrender.init()` 拿到画布实例来渲染的，所以**不能装两份**。

| 库 | 许可 | 在项目里的角色 | 什么时候用 |
|---|---|---|---|
| `echarts` 6.x | Apache-2.0 | 声明式图表：`graph` / `custom` / `dataZoom` / `tooltip` | 三块视图的主力，所有常规绘制都走它 |
| `zrender`（经 ECharts re-export） | BSD-3-Clause | 命令式 2D 图元：往同一张画布叠加自定义元素 | 只在 `graph`/`custom` 表达不了时（地图上的自由曲线注记、动态角标） |

**去重铁律**（pnpm 下必踩的坑）：`zrender` 是 `echarts` 的间接依赖，顶层 `node_modules/zrender` 没有符号链接，`import ... from 'zrender'` 会直接报模块找不到；即便装上，也会和 ECharts 内置那份形成**两个 zrender 实例**（事件系统、动画循环各一套，交互会错乱）。正确姿势：

- 拿画布实例用 `chart.getZr()`；
- 造图元用 `echarts.graphic.Image` / `Group` 等 re-export，**不 import 顶层 `zrender`**，`package.json` 里也不要列它。

三块视图的 series 选型：

| 视图 | series / 组件 | 交互与布局 | 为什么是它 |
|---|---|---|---|
| 世界地图 | `graph`（`layout: 'none'`，坐标来自 mock） | `roam: true` 平移缩放、`label` 显示地名、`edgeSymbol` 表路线方向 | 虚构世界没有真实经纬度，`geo` 要求先 `registerMap(GeoJSON)`；`graph` 的固定坐标正好 |
| 人物关系 | `graph`（`layout: 'force'`，或 `'circular'`） | 力导向自动避让；关系类型用 `lineStyle.type` + 线宽区分 | 与地图共用同一套元素模型，省一个依赖 |
| 时间线 | `custom` + `time` 轴 + 多 `yAxis` 泳道 | `dataZoom` 缩放时间窗；区间事件画成矩形条 | ECharts 的 `timeline` **组件**是「多帧动画控制器」，不是事件时间轴，名字相近极易误用 |

组件清单：

| 组件 | 职责 | 关键点 |
|---|---|---|
| `PanelShell` | 标题行 / 工具条 / 内容区 / 空态 | 唯一外壳，接真实数据只换 children |
| `ChartCanvas` | ECharts 生命周期封装 | `useEffect` 内 `init`；`ResizeObserver` → `resize()`；cleanup 里 `dispose()`；`setOption(opt, { notMerge: true })` 防止旧 series 残留 |
| `WorldMap` / `Relations` / `Timeline` | 装配 `ChartCanvas` + 对应 option | 组件不含图表配置，配置在 `charts/*.ts` 纯函数里，可单测 |
| `theme.ts` | 从 CSS 变量拼 ECharts 主题 | 色值用 `getComputedStyle(document.documentElement)` 读，深浅主题都跟随 shell |

按需注册（`src/client/echarts.ts`）——**不要** `import * as echarts from 'echarts'`：

```ts
import * as echarts from 'echarts/core'
import { GraphChart, CustomChart } from 'echarts/charts'
import { TooltipComponent, DataZoomComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

/** 只注册用到的模块；漏注册的症状是图表空白 + 控制台提示 series/renderer 未安装。 */
echarts.use([GraphChart, CustomChart, TooltipComponent, DataZoomComponent, GridComponent, CanvasRenderer])

export { echarts }
```

纪律（每条都有依据）：

- **按需引入**：全量入口会把 22 种图表一起打进来，体积是按需引入的数倍；`echarts/core` + `use()` 是官方推荐路径。
- **不写全局选择器**：自家样式用 `data-sw-*` 前缀；画布内的一切由 option 控制，不拿 CSS 去改 `.echarts-*`。
- **颜色跟随主题**：色值从 CSS 变量来，不在 JS 里写死；用 `registerTheme()` 把变量映射成主题。
- **组件不取上下文**：静态版只接 props，不调 `useTabInfo()`，便于后续直接渲染测试。
- **命令式库必须销毁**：ECharts 实例不 `dispose()` 会留下 canvas 与全局监听，重复开关 tab 表现为内存与事件累积。

### 3.8 Step 6：浏览器半入口注册

三段式注册，逐段对应 harness 的槽位契约：

```ts
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import { WorldMap } from './panels/WorldMap.tsx'
import { Relations } from './panels/Relations.tsx'
import { Timeline } from './panels/Timeline.tsx'
import { PlatformIcon } from './entries/PlatformIcon.tsx'
import { PlatformPage } from './entries/PlatformPage.tsx'

/** 主列面板 id：同时是 `main` 的 key 与 `sidebar.panellist` 的行 id，两者必须一致。 */
const PANEL_ID = 'scriptwriting' as MainPanelId

const TABS = [
  { id: 'dsh-scriptwriting-ui/worldmap', kind: 'scriptwriting-worldmap', title: '世界地图', Body: WorldMap, order: 10 },
  { id: 'dsh-scriptwriting-ui/relations', kind: 'scriptwriting-relations', title: '人物关系', Body: Relations, order: 20 },
  { id: 'dsh-scriptwriting-ui/timeline', kind: 'scriptwriting-timeline', title: '时间线', Body: Timeline, order: 30 },
] as const

/** 需要 slot 注册表、右栏 tab 类型注册表、右栏导航面、主列面板选择状态。 */
export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight', 'layout']

/** 上次打开的 kind；静态阶段只在内存里记。 */
let lastKind = 'scriptwriting-worldmap'

/**
 * 浏览器半：注册三个侧栏 tab 类型、一个主列页面、以及左栏「创作平台」行。
 * @param ctx - 客户端根上下文。
 */
export function apply(ctx: ClientContext): void {
  for (const tab of TABS) {
    ctx.effect(() => ctx.sidebarRightTabs.register({
      id: tab.id,
      kind: tab.kind,
      title: () => tab.title,
      guide: { order: tab.order, title: () => tab.title },
    }), `scriptwriting-ui: ${tab.kind} type`)
    ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
      name: 'sidebar.right.pane.tab', key: tab.id,
    }, tab.Body))
    ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
      name: 'sidebar.right.pane.tab.title', key: tab.id,
    }, () => tab.title))
  }

  // ⑥ 主列页面：没有它，selectPanel(PANEL_ID) 会抛「not registered」。
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main', key: PANEL_ID,
  }, PlatformPage))

  // ⑤ 左栏插件按钮区的一行：id 与 main 的 key 相同，壳层据此选中面板。
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 20,
    label: () => '创作平台',
  }, PlatformIcon))

  // 进入该页时把右栏带到我们的视图；已停在我们某个视图上则不动。
  ctx.effect(() => ctx.layout.panelInfo.subscribe(() => {
    if (ctx.layout.panelInfo.getSnapshot().activePanelId !== PANEL_ID) return
    const active = ctx.sidebarRight.active()
    const mine = active !== undefined && TABS.some(tab => tab.kind === active.kind)
    if (mine) lastKind = active.kind            // 记住用户最后看的那个视图
    if (mine && ctx.sidebarRight.isExpanded()) return
    ctx.sidebarRight.openTab(lastKind)          // 未开 / 开着别人的 tab：切过来并展开
  }), 'scriptwriting-ui: panel entry')
}
```

要点：

- 注册 tab 类型用 `ctx.effect` 包裹，随插件卸载自动注销；body/title 用 `ctx.slots.inject`，等 owner 声明就绪再注册（向未声明 slot 注册会在激活时报错）。
- 三个 **kind 必须不同**：`kind` 是可被 `openTab()` 点名的判别名，撞名会抛错；`id` 必须全局唯一。
- `patterns` 省略：我们是「按 kind 打开的页面类型」，不是地址模式认领（见 sidebar-right 文档「Tab 类型注册」）。
- `guide` 让三个视图出现在右侧栏引导页，与左栏入口并存、互不干扰。
- **⑤ 与 ⑥ 必须成对**：`sidebar.panellist` 的行 id 就是 `main` 的 key；只注册一个，`selectPanel` 会抛 `main panel "…" is not registered`。
- ⑤ 的 owner props 只有 `size` 与 `active`，图标要做两态只能靠这两个值，不能读别的状态。
- **不加点击钩子**：β 下点击由壳层处理（`selectPanel`），我们只观察 `panelInfo` 变化，不拦截事件。
- 「收起右侧面板」按钮放在 `PlatformPage` 内，调 `ctx.sidebarRight.toggleExpanded()`；这是 β 下用户可预期的关闭落点。
- 若文案需要本地化，在阶段 6 换成 `ctx.locale`。

### 3.9 Step 7：装配到 patch

`packages/bundle/cordis.patch.yml` 追加一行（这是阶段 1 对 bundle 的唯一改动）：

```yaml
- insert:
    - id: scriptwriting-platform
      name: dsh-scriptwriting-platform
    - id: scriptwriting-platform-ui
      name: dsh-scriptwriting-ui
```

注意：`id` 一经发布不可改（补丁按 `id` 建索引，改了只打 warning 且插件照常加载，症状是「覆盖不生效」）。同时 `packages/bundle/package.json` 需把 `dsh-scriptwriting-ui` 加进 `dependencies`（`workspace:^`）与 `devDependencies`，否则 profile 里解析不到该行。

> 阶段 1 **不**把 storage 三行写进 patch（那是架构文档 §8.2 的待拍板项 2），也不实现 `apply()` 的跨插件 wiring。

### 3.10 Step 8：验证

按顺序执行，每步有可观察的判定标准：

| # | 命令 | 判定 |
|---|---|---|
| 1 | `pnpm -C packages/ui build` | 退出码 0；`packages/ui/lib/client.js` 与 `lib/client/index.d.ts` 均存在 |
| 2 | `node -e "console.log(require('node:fs').readFileSync('packages/ui/lib/client.js','utf8').slice(0,160))"` | 首行为 `window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: ...`，紧随 Apache NOTICE 注释块 |
| 3 | `grep -c "^import " packages/ui/lib/client.js` | 输出 `0`（无 ESM 语句进入客户端产物） |
| 4 | `grep -c 'require("echarts")\|require("zrender")' packages/ui/lib/client.js` | 输出 `0`（第三方库必须已内联，不是运行时解析） |
| 5 | `ls -l packages/ui/lib/client.js` | 记录实测体积，写进 PR；作为后续按需裁剪的基线，不设硬阈值 |
| 6 | `pnpm typecheck` | 五包通过（客户端文件走 `tsconfig.client.json`） |
| 7 | `dsh plugin --profile demo add ./packages/bundle` | 无报错 |
| 8 | `dsh --profile demo --dump-config` | 出现 `scriptwriting-platform-ui` 行，且其 `dsh.client` 被识别 |
| 9 | `dsh --profile demo` 后浏览器打开 | 右侧栏引导页出现三个入口，逐个点开渲染静态面板 |
| 10 | 三个 tab 连续开关各 5 次，看 DevTools Memory/Event Listeners | 无持续上涨；说明 `dispose()` 生效 |
| 11 | 改一处内联色值，重新 `build:client`，不重启 dsh | 面板刷新（HMR 生效，说明 rev 派生正常） |
| 12 | 从 patch 删掉 ui 行并重启 | 三个入口消失、无残留报错（注销干净） |
| 13 | 点左栏「创作平台」行 | 主列切到创作平台页；右栏展开到上次视图（首次为世界地图） |
| 14 | 再点同一行 | 主列不变、右栏**不关闭**（β 的预期行为，见 §2.1.2） |
| 15 | 点页面内「收起右侧面板」→ 再点该行 | 右栏重新展开，且回到上次那个视图（不是跳回世界地图） |
| 16 | 右栏先开着「文件」，再点该行 | 切到我们的视图，右栏不关 |
| 17 | 从 patch 删掉 ui 行后 `selectPanel('scriptwriting')` | 抛 `not registered`，确认主列页面已随插件注销 |

环境提醒：终端 PATH 中的 `dsh` 可能是旧版，实际应以桌面端自带 CLI 为准，调用前先 `dsh --version` 核对；版本不匹配时用桌面端 CLI 的完整路径。

### 3.11 阶段 1 验收清单（DoD）

- [ ] 三个 tab 类型可注册、可点开、可关闭，切换会话不报错
- [ ] 左栏插件按钮区出现「创作平台」行，与「插件」同排、在工作区列表之上
- [ ] 该行（`sidebar.panellist`）与主列页面（`main`）成对注册，`selectPanel` 不抛错
- [ ] 进入页面即把右栏带到我们的视图；页面内「收起右侧面板」可用
- [ ] 侧栏折叠成 rail（56px）时该行降级为纯图标
- [ ] 三块视图由 ECharts 渲染（graph / custom series），无手写坐标的 SVG
- [ ] 三块视图在浅色/深色主题下文字均清晰可读
- [ ] 产物为 lazy-CJS 契约，无 ESM `import` 残留，无 `process` / `Buffer` 等 Node 全局引用（浏览器无此全局）
- [ ] `echarts` / `zrender` 已内联，产物中无 `require("echarts")`；`zrender` 未出现在 `dependencies`
- [ ] Apache-2.0 NOTICE 已随产物携带（banner 注释块）
- [ ] 反复开关 tab 后 ECharts 实例已 `dispose()`，无内存/监听累积
- [ ] `pnpm typecheck` 通过；客户端 TS 口径独立且 `noEmit`
- [ ] patch 只有一行新增，`apply()` 未被改动
- [ ] 卸载 ui 行后面板与注册全部消失
- [ ] 文档：`packages/ui/README.md` 补「静态阶段范围 + mock 替换点」，并注明本包**不向模型贡献 token**（Model Experience 三字段填 `zero`）
- [ ] 无本地绝对路径残留（按 `AGENT.md` §3 的自检命令，`docs/` 与 `packages/` 均无命中）

### 3.12 阶段 1 风险与处置

| 风险 | 触发信号 | 处置 |
|---|---|---|
| `__ModuleLoader__.load` 契约写错 | 页面白屏，控制台报 `Cannot read properties of undefined (reading 'load')` 或 factory 未注册 | 对照 §3.6 的 banner/intro/footer 三行逐字核对 |
| 产物残留 `process` 引用 | `web boot: 1 entry did not activate` + `dsh-scriptwriting-ui: import failed: process is not defined` | 确认 `tsdown.config.ts` 有 `define: { 'process.env.NODE_ENV': '"production"' }`；构建后 `grep -o 'process\.env' lib/client.js \| wc -l` 应为 0 |
| 向未声明的 slot 注册 | 插件激活失败，报 slot 未声明 | 确认 `inject` 含 `sidebar-right`，且用 `ctx.slots.inject()` 而非直接 `register` |
| React 被内联进产物 | 产物体积异常增大、出现两份 React 报 invalid hook call | 确认 `external` 含 `react` 与 `react/jsx-runtime` 两项 |
| `echarts` 被当成外部依赖 | 运行时 `require("echarts")` 抛「模块表无法解析」 | `external` 保持只含 react 系；`dsh.client.external` 里不要写 echarts |
| 两份 `zrender` | 图表能画但拖拽/缩放失灵、事件触发两次 | 不 import 顶层 `zrender`、不把它写进 `dependencies`；实例走 `chart.getZr()`、图元走 `echarts.graphic` |
| series 忘记 `use()` 注册 | 画布全空，控制台提示 series/renderer 未安装 | 在 `src/client/echarts.ts` 集中注册，并在文件头注释列出所需模块 |
| ECharts 实例泄漏 | 反复开关 tab 后内存与监听持续上涨 | `ChartCanvas` 的 cleanup 必须 `dispose()`；`ResizeObserver` 一并 `disconnect()` |
| 产物体积膨胀 | `lib/client.js` 明显偏大 | 先测量（验证步骤 5），再考虑裁剪 series/组件；不要为此改回手绘 |
| Node 侧 tsconfig 去检查浏览器代码 | `document` 未定义等类型报错 | 用 §3.5 的 `tsconfig.client.json` 分离口径 |
| kind 撞名 | 注册时抛错 | 三个 kind 用 `scriptwriting-` 前缀 |
| 只注册了行、没注册主列页面 | `selectPanel` 抛 `main panel "…" is not registered`，点击直接报错 | ⑤ 与 ⑥ 必须成对；先写 `main`，再写 `sidebar.panellist` |
| 行 id 与 main key 不一致 | 行可点但主列空白 | 两处都用同一个 `PANEL_ID` 常量，不写字面量 |
| 用户预期「再点关闭」落空 | 反馈「按钮关不掉」 | 在页面显眼处放「收起右侧面板」；文档与验收步骤 14 明确这是 β 的既有代价 |

### 3.13 阶段 1.5：完整 UI 侧功能（D4/D5，mock service，已实施）

D4（作品注册表 + 每作品一域）+ D5（单向同步 / 软删 / 单活跃域）要求平台支持多作品。阶段 1 的静态实现此前是单作品假设，本阶段补齐**完整 UI 侧功能**——作品工作台 + 接口层 + 三视图联动。仍用 mock service、不接存储，避免阻塞在 core/store 之前。

| 项 | 内容 |
|---|---|
| 目标 | 用户能新建/切换/重命名/软删作品、看到当前作品名与数据摘要；三视图按当前作品显示各自数据 |
| 接口层 | `src/client/contract.ts`（`WorkbenchService` = D5 Node 服务的 UI 镜像：查询 + 命令 + `ObservableSnapshot`）、`store.ts`（单例容器）、`useWorkbench.ts`（`useSyncExternalStore` 订阅）、`service/mock.ts`（mock 实现：软删/activeWorkId 单例/换作品） |
| 数据 | `src/client/mock/works.ts` 三份作品元数据 + 各自的 world/relations/timeline（沿用 D3 同形约定，标 `TODO(阶段 5)`） |
| UI 落点 | 主列 `PlatformPage` = 完整工作台（作品列表/新建/切换/重命名/软删 + 三视图入口 + 数据摘要）；三面板订阅快照渲染当前作品数据；左栏行 `sidebar.panellist` 仍为单个「创作平台」，不随作品增长 |
| **实现偏离** | 原计划用 `workState.ts` 模块内存桩；实际按 D5 提前落地**接口层**（`WorkbenchService` + 快照订阅），比原桩更贴合「浏览器只展示」的终态——阶段 5 只需换 `setService()` 一行，组件零改动。此为有意升级，非遗漏 |
| 单向数据流 | 读 = `useWorkbench()` 快照；写 = `getService().<命令>()`；组件不 import mock、不改状态。真源 `ui-sidebar-right/tab-registry.ts` 的 `register()` 无 unregister，tab kind 固定、切换只换数据 |
| 边界 | 不 import core/store/tools；不引入持久化；mock 内遵守 D5 语义（软删不清数据、同开内容域上限 1） |
| 验证 | 切换/新建/删除后三视图与标题随之变化；软删作品后数据仍在；`pnpm typecheck` + `pnpm build` 通过，产物满足 lazy-CJS 契约（process.env=0、无 ESM 残留、load/NOTICE 正常） |
| 退出 | 阶段 5 时 `src/client/index.ts` 的 `setService(new MockWorkbenchService())` 换成 `@Remote` client service，作品选择器与三面板保留 |

**为什么现在做**：完整 UI 是纯浏览器层、无上游依赖，可立即落地；接口层提前到位让阶段 5 的替换收敛到一行，验收面大幅缩小。此阶段不改变阶段 2/3/4 的任何产出。

---

## 4. 阶段 2：core 领域类型与错误契约

| 项 | 内容 |
|---|---|
| 目标 | 定下领域类型（**`Work`/`WorkId`**、草稿、大纲、地点、人物、关系、事件、能力）与统一错误类，供 store/tools/ui 共用 |
| 产出 | `packages/core/src/{types,ids,errors}.ts`，`ctx` 键声明（含当前作品服务键 `scriptwritingWorks`，同步机制按 D5：`@Remote` service + 浏览器只读投影） |
| 已定输入 | D4：`Work` 是一等实体，`WorkId` 品牌类型；作品元数据 = `{ id, title, createdAt, updatedAt, order }` |
| 关键决策 | 领域拆分粒度（架构文档 §4.4，待拍板项 3）：一域一 spec vs 单 spec 多 tables；本条**必须在写 schema 前拍板**，否则 store 返工 |
| 验证 | `pnpm typecheck`；错误类通过「不解析消息、只比对 `code`」的断言 |
| 退出 | 类型被阶段 3、4 实际 import 且无循环依赖 |

错误类按架构文档 §9.1：`ScriptwritingError extends HarnessError`，`code` 用 `SCRIPTWRITING_*` 前缀的稳定大写串。

---

## 5. 阶段 3：store 的 DomainSpec

| 项 | 内容 |
|---|---|
| 目标 | 声明领域 schema 并成功 `open()`，不自研持久化；覆盖作品注册表域与每作品内容域 |
| 产出 | `packages/store-local/src/{specs,index}.ts`：`worksSpec`（name `scriptwriting_works`，`works` 表 + `global.activeWorkId`）+ 内容域 spec 工厂（name `sw_<id>`，动态构造，须匹配 `UNIT_NAME_RE`） |
| 已定输入 | D4：作品实体独立注册域；内容按作品分 unit。D5：`works` 表加 `deletedAt` 支持软删（默认列表过滤）；**同开内容域上限 = 1**，切换严格 `close(旧)` → `open(新)`，用**同一个** `ctx.effect` 串行 disposer（架构 §4.6） |
| 必须遵守 | 只加不改、`version` 单调、旧版本进 `compatibleVersions`、剧本正文用 `per-record` layout（架构文档 §4.3） |
| 验证 | 起一个最小 cordis 配置，`ctx.storageDomain.open(spec)` 成功；open 两个 `sw_<id>` 验证同名拒绝与隔离；写坏记录触发 `invalid-record`；`close()` 后重复 `close()` 不抛错 |
| 退出 | 注册域与内容域可读写、可重开，坏记录行为与 spec 一致 |

注意：`inject: ['storageDomain']` 且服务缺失时应停在 PENDING 而非 FAILED（架构文档 §2.2）。

---

## 6. 阶段 4：tools

| 项 | 内容 |
|---|---|
| 目标 | 模型可调用的读写工具，按领域分组；**外加作品管理工具**（新建/列表/切换/重命名/删除） |
| 产出 | `packages/tools/src/tools/{works,world,characters,events,...}.ts` + `index.ts` 注册 |
| 已定输入 | D4：作品管理操作注册表域；领域读写工具操作当前作品的 `sw_<id>` 句柄，**工具参数不带作品 id**（当前句柄即当前作品，D5 同开上限 1 是其前提）。D5：`deleteWork` 走软删（标记 `deletedAt`，不清空数据）；作品服务经 `@Remote` 暴露给浏览器，工具侧不直接被浏览器调用 |
| 关键约束 | 经 `ctx.storageDomain` 取句柄，**不 import `dsh-scriptwriting-store`**（修架构文档 §3.3 的 P1 偏差）；参数错误用 `ToolArgsError` |
| 配置化 | 条目上限、超时等进 Config schema，不写 `DEFAULT_*` |
| 验证 | 真实会话里工具可被调用；越界参数返回 `INVALID_ARGS`；README 三字段（What the model sees / Token effect / KV Cache effect）填全，否则过不了 `rules/delivery.md` 门禁 |
| 退出 | 工具 schema 稳定，缓存影响已记录 |

---

## 7. 阶段 5：mock 换真实数据

| 项 | 内容 |
|---|---|
| 目标 | 三块面板读领域存储，刷新不丢；**切换作品后数据随之变化，当前作品持久化** |
| 做法 | 保留 `PlatformPage` / `PanelShell` 与视图组件；**只需把阶段 1.5 的 `setService(new MockWorkbenchService())` 换成 D5 的 `@Remote` client service**（同一 `WorkbenchService` 接口），组件零改动；`mock/works.ts` 删除，作品数据来自注册表域 + `activeWorkId`，`@Remote` 的 `getView`/命令方法落到真实领域存储 |
| 已定输入 | D5：`ctx.provide('scriptwritingWorks', service)` + `@Remote` 暴露 `listWorks`/`getActiveWork`/`getView` 查询与 `createWork`/`switchWork`/`renameWork`/`deleteWork` 命令；浏览器只发命令 + 查状态 + 渲染，不写权威状态；写后失效信号推浏览器触发重查（详见 `docs/decisions/2026-11-21-多作品运行时约束.md`） |
| 验证 | 修改数据后刷新面板一致；切换作品后三视图变化且刷新保留当前作品；模型写入后浏览器重查可见；删除作品后数据仍在（软删）；断网/服务缺失时降级到空态而非崩溃 |
| 退出 | mock 目录删除，`grep -r "mock/" packages/ui/src` 无命中；作品切换端到端可用 |

---

## 8. 阶段 6：横切能力

按依赖顺序，每项单独一轮确认：

1. **写操作审批**：`tools/pre-execute` 返回 `ask`（waterfall，必须 `next()`）
2. **命令入口**：`ctx.commands` 注册 `/outline`、`/world` 等；归属 bundle 还是领域包待定
3. **上下文注入**：`ctx.systemPrompt.section()` 或 `agent.inject()`；物体能力走这条
4. **流式展示**：`session/event`（持久）+ `agent/assistant-stream`（实时）
5. **i18n**：`ctx.locale` 接管三块面板文案

---

## 9. 阶段 7：质量门禁

当前缺口（架构文档 §10）：`pnpm test` 空跑、无 lint、无 REAL composition、无 CI。

| 顺序 | 动作 | 判据 |
|---|---|---|
| 1 | 装 test runner（`node:test` 或 vitest），每包定义 `test` 脚本 | `pnpm test` 真实执行而非空跑 |
| 2 | 加 lint（typescript-eslint），规则对齐 `rules/typescript.md` | `pnpm lint` 通过 |
| 3 | 写 REAL composition：通过 Loader 启动带 `cordis.yml` 的测试 | 断言插件被加载、注册存在、卸载后注册消失 |
| 4 | CI 串起 typecheck / lint / test / build | 每次提交自动跑 |

归属待定（架构文档 §11.2 第 5 条）：测试放根 `tests/` 还是包级 `tests/`——与 `rules/typescript.md`「测试放包级」冲突一处，需一并拍板。

---

## 10. 命令速查

```sh
pnpm install                     # 工作区依赖
pnpm typecheck                   # 五包类型检查
pnpm build                       # production 构建（无 .map）
pnpm -C packages/ui build        # 单包：tsc + 客户端打包
pnpm -C packages/ui build:client # 只重建客户端产物（HMR 场景）
dsh --version                    # 先核对 CLI 版本
dsh plugin --profile demo add ./packages/bundle
dsh --profile demo --dump-config
dsh --profile demo
```

---

## 11. 与决策记录的关系

D1/D2/D3（阶段 0 前置）、D4（多作品数据模型）、D5（多作品运行时约束）均已拍板，各自按 `docs/decisions/YYYY-MM-DD-<主题>.md` 落一份决策记录（模板见 `docs/dsh-plugin-development-guide.md` 第 8 节），状态为 `accepted`。本文件只描述**怎么做**，不承载决策理由。

`docs/architecture.md` §11.2 的五项待拍板中，与本计划直接相关的三项是：包切分方向（影响阶段 2 目录）、领域 spec 拆分粒度（阻塞阶段 3）、测试归属（阻塞阶段 7）。D4 的三项遗留已由 D5 全部 closure：状态同步 = Node `ctx` 服务 `@Remote` API + 浏览器单向展示（含使用场景说明）、删除 = 软删、同开内容域上限 = 1；D5 未覆盖的回收站/彻底删除/导出时机仍留待后续。

---

## 12. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-11-21 | 初版：阶段划分、UI 静态部分逐步落地、三个阻塞决策点 |
| 2026-11-21 | 1.1：§2.1.1 补承载位置图解与 slot 对照；图表实现改为 ECharts（主）+ ZRender（辅），去掉手绘 SVG 与 CSS 管线；补按需注册、zrender 去重、Apache NOTICE 与相应验证/风险项 |
| 2026-11-21 | 1.2：新增 §2.1.2 左侧栏「创作平台」开关入口（⑥ `sidebar.session.action`）；补入口三态逻辑、验证 13–15、DoD 与两条风险 |
| 2026-11-21 | 1.3：左栏入口定为 β（`sidebar.panellist` 行 + `main` 主列面板），同步 §2.1.1/§2.1.2/§3.2/§3.8/§3.10/DoD/风险，并记录「重复点击不能关闭」的已知代价 |
| 2026-11-21 | 1.4：D4 多作品数据模型拍板（作品注册表 + 每作品一域）；新增 §3.13 阶段 1 作品入口静态扩展、阶段 1.5；阶段 2–5 产出按 `Work`/作品注册域/作品管理工具/按作品取数对齐；记录三项 D4 遗留待确认 |
| 2026-11-21 | 1.5：D5 多作品运行时约束拍板（状态同步 = Node `ctx` 服务 `@Remote` API + 浏览器单向展示、删除 = 软删、同开内容域上限 = 1）；D4 三项遗留 closure；阶段 2–5 前置与产出同步 D5，阶段 5 决策项改为已定输入 |
| 2026-11-21 | 1.6：阶段 1.5 实施完成——完整 UI 侧功能落地（作品工作台 + `WorkbenchService` 接口层 + 三份 mock 作品 + 三视图联动），按 D5 单向数据流；§3.13 重写为已实施并记录对原 `workState.ts` 桩的有意升级；阶段 5 替换为 `setService()` 一行 |
