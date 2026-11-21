# dsh-scriptwriting-platform

From draft generation to outline setting, as well as chapter outlines, world maps, character relationships, time development, object capabilities, and other elements - a complete management creation platform for all these elements.

## 开发

| 命令 | 行为 | 产物 `.map` |
|---|---|---|
| `pnpm dev` | 五个包 `tsc --watch`，改源码即重编 | ✅ 有 |
| `pnpm build` | 五个包先清 `lib/` 再编译（发布口径） | ❌ 无 |
| `pnpm build:dev` | 五个包一次性按开发口径编译 | ✅ 有 |
| `pnpm typecheck` | `tsc --noEmit`，只检查不产出 | — |
| `pnpm clean` | 清空各包 `lib/` | — |
| `pnpm install` | 装依赖（Node >= 24.9，harness engines 要求） | — |

单包操作：`pnpm -C packages/core build` / `pnpm --filter dsh-scriptwriting-core dev`。

### 环境变量切换模式

`tsc` 本身不读环境变量，`sourceMap` / `declarationMap` 只由 tsconfig 或 CLI 参数决定，因此由 `scripts/tsc.mjs` 把环境变量翻译成 project 选择：

| 模式 | 选用的 tsconfig | `.map` |
|---|---|---|
| `development` | `tsconfig.dev.json` | 产出 |
| `production` | `tsconfig.build.json` | 不产出 |

优先级：`--mode=` > `--watch` > `BUILD_MODE` > `NODE_ENV` > `production`

```sh
BUILD_MODE=development pnpm build   # 等价 pnpm build:dev
NODE_ENV=development pnpm build     # 同上
BUILD_MODE=production pnpm build    # 显式声明发布口径（缺省即此）
pnpm dev                            # --watch 会覆盖环境变量，始终按 development
```

- 产物布局：`packages/*/src` → `packages/*/lib`（`lib/` 已 gitignore）
- 调试与发布产物同目录，任何一次编译前都会先删 `lib/`，避免 dev 的 `.map` 残留进发布包
- 跨包引用一律用包名（`dsh-scriptwriting-core` 等），开发期由 `tsconfig.base.json` 的 `paths` 指向源码
- AI Agent 开始工作前先读 `AGENT.md`；系统结构见 `docs/architecture.md`；架构决策见 `docs/`

## 本地 link 安装

把 `packages/bundle` 以 link 方式装进 dsh profile（不打包、不发布），在仓库根目录依次执行：

```sh
pnpm install                                       # 建立 workspace 链接：bundle 通过 workspace:^ 依赖四个子包
pnpm build                                         # 生成 packages/*/lib，link 安装读取的是 lib 而非 src
dsh plugin --profile demo add ./packages/bundle    # 首次执行会初始化 profile（base 作为首个组合包）
dsh --profile demo --dump-config                   # 验证：应出现 # == dsh-scriptwriting-platform 层
dsh --profile demo                                 # 启动
```

- profile 的 `package.json` 会记录 `"dsh-scriptwriting-platform": "link:<repo>/packages/bundle"`，之后改源码只需重新 `pnpm build`，不必重复 `add`
- 改哪个子包就重建哪个（如 `pnpm --filter dsh-scriptwriting-core build`）：profile 经 `packages/bundle/node_modules` 链到 workspace 包，`lib/` 一变即生效（无需重新 link）
- 卸载：`dsh plugin --profile demo remove dsh-scriptwriting-platform`（依赖与对应层一并移除）
- 前置：Node >= 24.9；dsh CLI 版本需满足本包 `engines.dsh`（`>=0.2.2-0 <0.3.0`）
- 其它 profile 名、tarball 与 GitHub 安装方式见 `docs/dsh-plugin-development-guide.md` 第 3 节 Step 5
