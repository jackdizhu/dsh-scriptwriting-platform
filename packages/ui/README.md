# dsh-scriptwriting-ui

世界地图 / 人物关系 / 时间线三块结构化视图。阶段 1 为**静态示意**：用内置 mock 数据渲染，不接存储与模型（决策 D3）。

## Model Experience

- What the model sees：None（UI 为只读展示，不向模型注入内容）
- Token effect：zero
- KV Cache effect：independent

## 承载位置（决策 D1，β）

- 右侧栏三个 tab 类型：`scriptwriting-worldmap` / `scriptwriting-relations` / `scriptwriting-timeline`，带 guide 入口；
- 左栏插件按钮区「创作平台」行（`sidebar.panellist`，id = `scriptwriting`）；
- 主列页面「创作平台」（`main` keyed，key 同为 `scriptwriting`）——左栏行与主列页必须成对注册，否则 `selectPanel` 抛错；
- 已知代价：重复点左栏行不会关闭右栏（壳层 `selectPanel` 幂等）；主列被替换，返回对话用壳层控件。关闭右栏由主列页「收起右侧面板」按钮与右栏自带控件承担。

## 构建（决策 D2-A）

`build` 链：`tsc`（Node 半）→ `tsc -p tsconfig.client.types.json`（浏览器半声明）→ `tsc -p tsconfig.client.json --noEmit`（类型检查）→ `tsdown`（浏览器半打包）。

浏览器半产物 `lib/client.js` 是 lazy-CJS factory：`window.__ModuleLoader__.load({ id, factory })`；react 系 external（页面模块表注入），echarts / zrender 内联（模块表无图表库），Apache-2.0 NOTICE 随 banner 携带。`tsdown.config.ts` 设 `clean: false`，避免清掉链首 tsc 的 Node 半产物——lib 清理由 `scripts/tsc.mjs` 在链首完成。

## 静态数据替换点（阶段 5）

数据集中在 `src/client/mock/{world,characters,events}.ts`，字段与未来领域类型同形、不 import core。替换判据：`grep -rn "mock/" src` 无命中，且面板数据来自领域存储、刷新不丢。阶段 5 还应把 `lastKind` 落持久化、把 `activeKind` 接 store 做响应式。

## 命令

见根 `README.md`：`pnpm -C packages/ui build` / `typecheck` / `build:client` / `dev:client`。
