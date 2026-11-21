# 实施步骤

- 版本：1.0（草案，2026-11-21）
- 状态：**待放行**。本文件是执行计划，不是已确认决策；阶段 1 的落点与构建方案需用户拍板后才开工。
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
阶段 1  UI 静态部分  ◄── 本次重点，无上游依赖
   │        └─ 产出：可在 dsh Web GUI 里点开的三块静态面板
   ▼
阶段 2  core：领域类型 + 错误类 + ctx 键
   │
   ├──────────────┬──────────────┐
   ▼              ▼              ▼
阶段 3 store   阶段 4 tools    （UI 继续做交互态，仍用 mock）
DomainSpec     defineTool          │
   │              │                │
   └──────┬───────┘                │
          ▼                        ▼
      阶段 5  真实数据接 UI（替换 mock）
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
| **1** | **UI 静态部分可点开、可看** | `ui`（+`bundle` 一行 patch） | 阶段 0 | §3.11 验收清单全绿 |
| 2 | 领域类型与错误契约 | `core` | 阶段 0 | `pnpm typecheck` 通过，类型被 3、4 引用 |
| 3 | DomainSpec 声明 | `store` | 阶段 2 | `open()` 成功，坏记录行为符合 spec |
| 4 | 模型可读写工具 | `tools` | 阶段 2 | 工具在真实会话中可调用，README 三字段填全 |
| 5 | mock 换真实数据 | `ui` + `tools` | 3、4 | 面板数据来自领域存储，刷新不丢 |
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
| **A. 复刻最小子集（建议）** | 新增 `packages/ui/tsdown.config.ts`：rolldown/tsdown，`format: 'cjs'`，`external` 只列 react 三件，补 banner/footer 上述契约 | 产物与 harness 同构；不引入 harness 源码；依赖最少 | CSS 走 `?inline` 或内联样式，不做 CSS Modules；无 purity gate，靠人工纪律 |
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
├── src/
│   ├── index.ts                 # [改] Node 半：保留空 apply，声明 inject: []
│   └── client/
│       ├── index.ts             # [新] 浏览器半入口：注册三个 tab 类型 + body + title
│       ├── panels/
│       │   ├── PanelShell.tsx   # [新] 共用外壳：标题栏 / 工具条 / 内容区 / 空态
│       │   ├── WorldMap.tsx     # [新] SVG 节点-边静态图
│       │   ├── Relations.tsx    # [新] SVG 双列关系弧线图
│       │   └── Timeline.tsx     # [新] 纵向轴 + 事件卡
│       ├── mock/
│       │   ├── world.ts         # [新] 地点节点与边
│       │   ├── characters.ts    # [新] 人物与关系
│       │   └── events.ts        # [新] 时间线事件
│       └── styles.ts            # [新] 内联样式对象或 `?inline` 样式文本
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
    "tsdown": "^0.x"
  }
}
```

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

`packages/ui/tsdown.config.ts` 的关键是三点：入口、外部依赖、产物契约。

```ts
import { defineConfig } from 'tsdown'

/** React 由页面模块表注入；其余一律内联，避免引入未在平台模块清单中的外部请求。 */
const EXTERNAL = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  format: 'cjs',
  platform: 'browser',
  outDir: 'lib',
  dts: false,
  sourcemap: true,
  external: EXTERNAL,
  outputOptions: {
    banner: 'window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: (require) => {',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
})
```

对照 harness 预设的实际写法（`packages/client/tsdown.client.ts` 第 1148–1153 行）：banner 带包名、intro 造 `module`/`exports`、footer `return module.exports; } });`。我们的简化版省掉了 `chunk:` 分支（单入口无分包）与样式 marker（静态阶段不用 CSS Modules）。

**验收这一小步的硬指标**：构建后 `lib/client.js` 首行必须是 `window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: ...`，且全文不出现 `import ` 语句。

### 3.7 Step 5：静态组件

三块视图共用 `PanelShell`，避免三套布局漂移：

| 组件 | 结构 | 说明 |
|---|---|---|
| `PanelShell` | `<section data-sw-panel>` + 标题行 + 可选工具条 + 内容区 + 空态 | 所有面板的唯一外壳，后续接真实数据只换 children |
| `WorldMap` | 内联 `<svg viewBox>`，地点为圆 + 文本，路线为 `<path>` | 手绘坐标写死在 mock 里，不做力导向布局 |
| `Relations` | 左右两列人物，中间多层 `<path>` 弧线，线型区分关系类型 | 关系类型用线型/线宽而非颜色，避免主题色冲突 |
| `Timeline` | 纵向 `<ol>`，左侧轴 + 节点圆点，右侧事件卡 | 时间用手写字符串，不做日期库 |

约束（全部有依据）：

- **不引入图表库**：`PLATFORM_MODULES` 只含 react 系、zod、`@tanstack/react-virtual`、`dsh-client-store`、`ui-slots`、`ui-primitives`、`ui-dockkit`，没有图形库；自绘 SVG 是唯一不增加打包体积的路径。
- **不写全局选择器**：样式用内联对象或 `data-sw-*` 前缀的类名，避免污染 shell 布局（架构文档 §8 未覆盖但属明显风险）。
- **颜色跟随主题**：只使用 CSS 变量（`var(--dsh-*)`）或 `currentColor`，不硬编码色值，保证深浅主题都可用。
- **组件不取上下文**：静态版组件只接收 props，不调用 `useTabInfo()` 等 hook，方便后续在测试里直接渲染。

### 3.8 Step 6：浏览器半入口注册

三段式注册，逐段对应 harness 的槽位契约：

```ts
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { WorldMap } from './panels/WorldMap.tsx'
import { Relations } from './panels/Relations.tsx'
import { Timeline } from './panels/Timeline.tsx'

/** 需要右侧栏 tab 注册表与 slot 注册表。 */
export const inject = ['slots', 'sidebarRightTabs']

const TABS = [
  { id: 'dsh-scriptwriting-ui/worldmap', kind: 'scriptwriting-worldmap', title: '世界地图', Body: WorldMap, order: 10 },
  { id: 'dsh-scriptwriting-ui/relations', kind: 'scriptwriting-relations', title: '人物关系', Body: Relations, order: 20 },
  { id: 'dsh-scriptwriting-ui/timeline', kind: 'scriptwriting-timeline', title: '时间线', Body: Timeline, order: 30 },
] as const

/**
 * 浏览器半：注册三个按 kind 打开的侧栏 tab 类型。
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
}
```

要点：

- 注册 tab 类型用 `ctx.effect` 包裹，随插件卸载自动注销；body/title 用 `ctx.slots.inject`，等 owner 声明就绪再注册（向未声明 slot 注册会在激活时报错）。
- 三个 **kind 必须不同**：`kind` 是可被 `openTab()` 点名的判别名，撞名会抛错；`id` 必须全局唯一。
- `patterns` 省略：我们是「按 kind 打开的页面类型」，不是地址模式认领（见 sidebar-right 文档「Tab 类型注册」）。
- `guide` 提供右侧栏引导页入口，静态阶段靠它点开面板，不必自建按钮。
- 若 `guide` 的 `title()` 需要本地化，在阶段 6 换成 `ctx.locale`。

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
| 2 | `node -e "console.log(require('node:fs').readFileSync('packages/ui/lib/client.js','utf8').slice(0,120))"` | 首行为 `window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: ...` |
| 3 | `grep -c "^import " packages/ui/lib/client.js` | 输出 `0`（无 ESM 语句进入客户端产物） |
| 4 | `pnpm typecheck` | 五包通过（客户端文件走 `tsconfig.client.json`） |
| 5 | `dsh plugin --profile demo add ./packages/bundle` | 无报错 |
| 6 | `dsh --profile demo --dump-config` | 出现 `scriptwriting-platform-ui` 行，且其 `dsh.client` 被识别 |
| 7 | `dsh --profile demo` 后浏览器打开 | 右侧栏引导页出现三个入口，逐个点开渲染静态面板 |
| 8 | 改一处 CSS 内联值，重新 `build:client`，不重启 dsh | 面板刷新（HMR 生效，说明 rev 派生正常） |
| 9 | 从 patch 删掉 ui 行并重启 | 三个入口消失、无残留报错（注销干净） |

环境提醒：终端 PATH 中的 `dsh` 可能是旧版，实际应以桌面端自带 CLI 为准，调用前先 `dsh --version` 核对；版本不匹配时用桌面端 CLI 的完整路径。

### 3.11 阶段 1 验收清单（DoD）

- [ ] 三个 tab 类型可注册、可点开、可关闭，切换会话不报错
- [ ] 三块视图在浅色/深色主题下文字均清晰可读
- [ ] 产物为 lazy-CJS 契约，无 ESM `import` 残留，无 Node 内建依赖
- [ ] `pnpm typecheck` 通过；客户端 TS 口径独立且 `noEmit`
- [ ] patch 只有一行新增，`apply()` 未被改动
- [ ] 卸载 ui 行后面板与注册全部消失
- [ ] 文档：`packages/ui/README.md` 补「静态阶段范围 + mock 替换点」，并注明本包**不向模型贡献 token**（Model Experience 三字段填 `zero`）
- [ ] 无本地绝对路径残留（按 `AGENT.md` §3 的自检命令，`docs/` 与 `packages/` 均无命中）

### 3.12 阶段 1 风险与处置

| 风险 | 触发信号 | 处置 |
|---|---|---|
| `__ModuleLoader__.load` 契约写错 | 页面白屏，控制台报 `Cannot read properties of undefined (reading 'load')` 或 factory 未注册 | 对照 §3.6 的 banner/intro/footer 三行逐字核对 |
| 向未声明的 slot 注册 | 插件激活失败，报 slot 未声明 | 确认 `inject` 含 `sidebar-right`，且用 `ctx.slots.inject()` 而非直接 `register` |
| React 被内联进产物 | 产物体积异常增大、出现两份 React 报 invalid hook call | 确认 `external` 含 `react` 与 `react/jsx-runtime` 两项 |
| Node 侧 tsconfig 去检查浏览器代码 | `document` 未定义等类型报错 | 用 §3.5 的 `tsconfig.client.json` 分离口径 |
| kind 撞名 | 注册时抛错 | 三个 kind 用 `scriptwriting-` 前缀 |

---

## 4. 阶段 2：core 领域类型与错误契约

| 项 | 内容 |
|---|---|
| 目标 | 定下领域类型（草稿、大纲、地点、人物、关系、事件、能力）与统一错误类，供 store/tools/ui 共用 |
| 产出 | `packages/core/src/{types,ids,errors}.ts`，`ctx` 键声明 |
| 关键决策 | 领域拆分粒度（架构文档 §4.4，待拍板项 3）：一域一 spec vs 单 spec 多 tables；本条**必须在写 schema 前拍板**，否则 store 返工 |
| 验证 | `pnpm typecheck`；错误类通过「不解析消息、只比对 `code`」的断言 |
| 退出 | 类型被阶段 3、4 实际 import 且无循环依赖 |

错误类按架构文档 §9.1：`ScriptwritingError extends HarnessError`，`code` 用 `SCRIPTWRITING_*` 前缀的稳定大写串。

---

## 5. 阶段 3：store 的 DomainSpec

| 项 | 内容 |
|---|---|
| 目标 | 声明领域 schema 并成功 `open()`，不自研持久化 |
| 产出 | `packages/store-local/src/{specs,index}.ts` |
| 必须遵守 | 只加不改、`version` 单调、旧版本进 `compatibleVersions`、剧本正文用 `per-record` layout（架构文档 §4.3） |
| 验证 | 起一个最小 cordis 配置，`ctx.storageDomain.open(spec)` 成功；写坏记录触发 `invalid-record`；`close()` 后重复 `close()` 不抛错 |
| 退出 | 领域可读写、可重开，坏记录行为与 spec 一致 |

注意：`inject: ['storageDomain']` 且服务缺失时应停在 PENDING 而非 FAILED（架构文档 §2.2）。

---

## 6. 阶段 4：tools

| 项 | 内容 |
|---|---|
| 目标 | 模型可调用的读写工具，按领域分组 |
| 产出 | `packages/tools/src/tools/*.ts` + `index.ts` 注册 |
| 关键约束 | 经 `ctx.storageDomain` 取句柄，**不 import `dsh-scriptwriting-store`**（修架构文档 §3.3 的 P1 偏差）；参数错误用 `ToolArgsError` |
| 配置化 | 条目上限、超时等进 Config schema，不写 `DEFAULT_*` |
| 验证 | 真实会话里工具可被调用；越界参数返回 `INVALID_ARGS`；README 三字段（What the model sees / Token effect / KV Cache effect）填全，否则过不了 `rules/delivery.md` 门禁 |
| 退出 | 工具 schema 稳定，缓存影响已记录 |

---

## 7. 阶段 5：mock 换真实数据

| 项 | 内容 |
|---|---|
| 目标 | 三块面板读领域存储，刷新不丢 |
| 做法 | 保留 `PanelShell` 与视图组件，把 `mock/*` 换成 store 查询；数据获取放客户端 service 或 Remote，**不**在组件里直接取上下文 |
| 决策 | 客户端如何拿到数据：Remote 命名空间 vs 会话投影（架构文档 §5「观察生成过程」待确认项） |
| 验证 | 修改数据后刷新面板一致；断网/服务缺失时降级到空态而非崩溃 |
| 退出 | mock 目录删除，`grep -r "mock/" packages/ui/src` 无命中 |

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

阶段 0 的 D1/D2/D3 一旦拍板，各自按 `docs/decisions/YYYY-MM-DD-<主题>.md` 落一份决策记录（模板见 `docs/dsh-plugin-development-guide.md` 第 8 节），状态从 `proposed` 转 `accepted`。本文件只描述**怎么做**，不承载决策理由。

`docs/architecture.md` §11.2 的五项待拍板中，与本计划直接相关的三项是：包切分方向（影响阶段 2 目录）、领域 spec 拆分粒度（阻塞阶段 3）、测试归属（阻塞阶段 7）。

---

## 12. 变更记录

| 日期 | 变更 |
|---|---|
| 2026-11-21 | 初版：阶段划分、UI 静态部分逐步落地、三个阻塞决策点 |
