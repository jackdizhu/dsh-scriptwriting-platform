---
name: plugin-package
description: dsh 独立插件包开发规范。用于设计与审查本仓库的树外插件与组合包（bundle）：Cordis 模型、插件形态、生命周期、能力 seam、manifest、patch、配置、工具与事件扩展点。开发任何插件时加载。
---

# dsh 独立插件包开发规范

来源：`github-projects/deepseek-harness/docs/user/develop/`、`docs/architecture.zh.md`、`docs/capability-seams.zh.md`、`docs/cookbook/extension-cookbook.zh.md`、`docs/cookbook/adding-a-package.zh.md`、`AGENTS.md`、`packages/AGENTS.md`。本仓库定位为**树外插件包**，不套用 monorepo workspace 包不变式（`private: true`、版本跟随根包、`lib/` 声明树）。

## 1. 基本模型

- Harness 全插件：模型适配器、工具注册表、会话日志、agent loop 都是插件，均可配置替换；没有需要打补丁的特权内核。
- 插件是导出 `apply(ctx)` 的 TS 模块，通过 `ctx` 注册能力。三种形态：函数（推荐，具名导出 `name`/`inject`/`Config`/`apply`，无 default）、对象、类（提供服务时用 `Service` 子类 default-export）。
- `inject` 声明必需服务；框架等待就绪后才调用 `apply`。服务消失时插件自动 dispose，恢复后重载。可选服务用 `ctx.get(name)`，不要放进 `inject`。
- 提供服务的类用 `declare module '@deepseek-ai/cordis'` 声明合并扩展 `Context`，并继承 `Service`，构造时 `super(ctx, '<name>')`。

## 2. 生命周期与清理

- Fiber 状态：`PENDING → LOADING → ACTIVE`，可 `FAILED`；`ACTIVE → UNLOADING → DISPOSED`。
- 所有经 ctx 的注册（`ctx.on`、`ctx.tools.register`、`ctx.llm.registerAdapter`、`ctx.effect`）随插件卸载自动撤销；自定义资源用 `ctx.effect(() => disposer)` 提供清理。
- 多个异步 disposer 并发执行、不保证顺序；有依赖的清理放进同一个 `ctx.effect()` 返回的 disposer 串行等待。
- `ctx.plugin()` 建子 Fiber，随父卸载；`await fiber.dispose()` 递归卸载并等待全部异步清理。
- 配置变更触发 HMR（卸载旧实例、加载新代码），注册自动清理不留残迹。

## 3. 能力 seam 三角色

- seam = Service Definition（声明接口与 Request/Result 类型）+ Service Provider（实现）+ Consumer（通常是面向模型的工具）。单一角色不构成 seam。
- Provider 与 Consumer 互不依赖，都只依赖 Definition；Definition 拥有 Request/Result 类型。
- 只有角色需要独立演进或替换时才拆成不同包；简单工具插件保持单包，避免预防性拆分。
- 为所有当前 Consumer 设计 Definition；工具 schema、Loader、UI、传输、provider 专属行为留在 Consumer 或 Provider，不让某一 Consumer 决定服务契约。反向味道：只有一个内部调用者的公共方法——改用私有能力闭包传入。
- 包/类命名按当前稳定职责，不用首个实现或未来扩展命名；`Controller`/`Store`/`Registry`/`Runtime`/`Provider` 等按 `adding-a-package.zh.md` 的角色表选取，单数 key 用单数类名，复数同理。

## 4. 配置

- 导出 `Config` 接口与**同名 Schemastery schema**，默认值写在 schema 中（`Schema.object({...})`），apply 第二参数接收校验后的 config。
- 任何不同部署可能取值不同的参数都必须是配置字段；`DEFAULT_*` 常量或测试钩子不算可配置。协议常量、外部规范、安全不变量保持固定。
- 配置错误在加载时响亮失败；对服务/资源的引用用 `inject`，不静默跳过缺失引用。

## 5. 事件与扩展点

- 四种模式：`emit`（广播）、`bail`（首个真值短路）、`serial`（顺序等待，无 `next()`）、`waterfall`（流水线，`next()` 必须调用）。
- Cordis 事件为 `namespace/action`（`agent/*`、`tools/*`、`fs/*`）；`turn/*`、`step/*`、`tool/call`、`tool/result`、`compaction/*` 是持久会话事件，要监听 `session/event` 并检查 `event.type`。
- 新行为挂到已有扩展点，不改 agent loop。功能→机制映射见 `docs/cookbook/extension-cookbook.zh.md` 与 `docs/architecture.zh.md`「新行为的归属位置」。
- 工具注册用 `defineTool`；扩展点选择：`guard()` 单调最终拒绝、`tools/execute` 包裹分发生命周期、`tools/post-execute` 变换结果、`tools/result` 观察不可变最终结果。
- **模型可见 ⟺ 已记录**：进入模型请求的内容必须能从会话日志重建；新增模型可见输入需要对应会话事件。用 `ctx.systemPrompt.section()` 加静态上下文，`agent.inject()` 注入运行时上下文；设计提示词/工具 schema 时就要规划其 UI 呈现。

## 6. 打包与组合（树外插件）

- 组合包 manifest：`package.json` 中 `dsh.bundle.patch` 指向 patch 文件；profile manifest 为 `dsh.profile.bundles` 有序列表。两者互斥，缺一不可混。
- patch 为 YAML 数组，`id` 是**行身份**而非注释：带 `id` 的补丁按 `id` 定位并覆盖该行的键（找不到只 warn 跳过；补丁里的 `name` 与现有行不符也跳过）；`insert` 不带 `id` 时追加到列表末尾，带 `id` 时表示插入到该 `id` 的 group 内（该行必须是 group）。**覆盖是整行 config 替换而非深合并**，必须重述该行所有键。
- 每个被 insert 的行都要显式给**稳定** `id`：缺省时框架会生成随机 id，运行时改动按 id 回写将无法定位。`id` 一经发布即成为下游覆盖配置的契约，改名会导致静默失配。
- 层顺序：profile bundles（按列表）→ profile 的 `cordis.patch.yml` → home 级 patch → 各 `--patch` overlay（按 argv）。
- 需与宿主共享实例的 dsh 包同时放 `peerDependencies` 与 `devDependencies`（相同范围）；独立版本第三方依赖放 `dependencies`。
- 声明 `engines.dsh` SemVer 范围，安装与启动会校验。
- 发布优先 npm（`pnpm publish` 预构建）或 tarball（`pnpm pack`）；git 安装需要自包含 `prepare` 脚本且用户 `allowBuilds` 授权并锁定 commit（`privacy-security.md` 供应链）。
- 展示元信息：`locale/en.json` 的 `meta.title`/`meta.description`，可导出图标与 `meta.detail`；随包 `files` 发布。

## 7. 独立插件包验证

- 用 `--patch` overlay 启动，确认加载日志与 Web UI 正常；`dsh --profile <name> --dump-config` 确认层出现。
- 产品可见插件需 **REAL composition 测试**：通过 Loader 启动测试用 `cordis.yml`，而非手工 `ctx.plugin(...)`；只 mock 外部服务与非确定性输入，断言模型可见/持久/用户可见输出。
- 每个 registry 贡献都要通过 HMR 安全测试：dispose fiber 后观测移除。
- 边界施加完整结果约束，测试极小/恰好/超大/多字节值；负向用例必须经真实 runner 失败。
- 按自身 `package.json` 脚本执行 typecheck/lint/test/build，并遵循 DoD（`docs/dsh-plugin-development-guide.md` 第 7 节）。
