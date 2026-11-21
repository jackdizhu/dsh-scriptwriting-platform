# dsh-scriptwriting-ui

多作品创作工作台：作品管理（列表/新建/切换/重命名/软删）+ 世界地图 / 人物关系 / 时间线三块结构化视图。

- 阶段 1：三块静态示意视图（决策 D3）。
- 阶段 1.5（当前）：完整 UI 侧功能——主列工作台 + 多作品 mock service + 三视图按当前作品联动；数据仍走内存 mock，不接存储（决策 D4/D5）。

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

## 单向数据流与替换点（阶段 5）

按 D5：权威状态在 service，浏览器只读快照 + 发命令。

- `contract.ts`：`WorkbenchService` 接口（查询 + 命令 + `ObservableSnapshot` 快照）与领域类型，与未来 core 同形；
- `store.ts` + `useWorkbench.ts`：service 单例容器 + `useSyncExternalStore` 订阅，组件只读、不写；
- `service/mock.ts`：mock 实现（软删 `deletedAt`、`activeWorkId` 单例、切换 = 换当前作品），模拟 D5 语义；
- `mock/works.ts`：三份作品内容，字段与 contract 同形。

**阶段 5 替换点 = `src/client/index.ts` 里 `setService(new MockWorkbenchService())` 一行**：换成 D5 的 `@Remote` client service（实现同一接口），所有组件零改动。替换判据：`grep -rn "service/mock\|mock/works" src` 仅剩 index.ts 那一行，面板数据来自领域存储、刷新不丢。

阶段 5 另需：`lastKind` / `activeKind` 落持久化，`getView(kind)` 由 RPC 实现。

## 命令

见根 `README.md`：`pnpm -C packages/ui build` / `typecheck` / `build:client` / `dev:client`。
