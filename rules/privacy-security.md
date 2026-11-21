---
name: privacy-security
description: 隐私与安全规范。涉及凭据、密钥、用户数据、日志脱敏、不可信输入、命令执行、插件加载与供应链时必读。优先级高于其他规则。
---

# 隐私与安全规范

来源：`github-projects/deepseek-harness/SAFETY.md`、`AGENTS.md` § Secrets/.env、`docs/subsystems/credentials.zh.md`、`docs/subsystems/settings.zh.md`、`dsh-error-handling`/`dsh-pre-push-checks`/`record-browser-gif` skills。本规则优先级高于其他规则；与其他规则冲突时以本文件为准。

## 1. 基本立场

- Harness 是实验性开发者预览软件，**未经过安全审计，不得视为安全或生产就绪**。
- 它能执行模型生成的代码与命令、加载第三方插件、访问网络、进程、凭据与文件。错误输出、缺陷、误配置、恶意输入或不可信插件都可能损坏主机、修改删除文件、泄露数据或凭据。
- 沙箱、审批提示、权限控制只能降低风险，**不保证隔离**，也不能保护被允许访问的资源。不得把 Harness 当作不可信工作负载的唯一安全控制。

## 2. 最小权限与运行环境

- 以完成任务所需的最小权限与访问范围运行。
- 优先使用一次性虚拟机、容器或专用环境；保留该环境能访问文件的备份。
- 除非接受风险，不暴露敏感凭据或数据。
- 运行前审查插件、配置与待执行命令；只加载可信来源的插件。

## 3. 凭据与密钥（红线）

- **绝不提交凭据**。真实 API 测试/演示读取 `DEEPSEEK_API_KEY`、可选 `DEEPSEEK_BASE_URL` 与根 `.env`；CI 无 key 时跳过。
- **绝不打印密钥**：运行 provider 或 agent 行为测试时不得输出 secrets（`dsh-pre-push-checks`）。
- 凭据通过 `CredentialRef`（provider 管理存储优先，再回退进程环境、`.env`）解析；空值一律视为未配置——`resolve` 跳过、`describe` 报未配置，空白不得伪装成已配置 secret。
- 凭据服务向远端只做单向传输：非空 secret 值可写入，**没有任何方法返回完整 secret 值**。
- Host 的远程 settings 读取一律 `redactSecrets: true`，`role('secret')` 字段不得随响应返回；字段编辑不得重述已脱敏值。
- 面向用户的文本不得包含敏感内部细节；错误报告、诊断中克制处理 secret，红脱时保留错误的 `name`/`code` 结构。

## 4. 不可信输入与边界

- 在解析/配置、队列、模型与工具 JSON、持久化/文件、worker、进程、wire 边界做校验；同进程类型化边界信任 TS，不重复校验。
- 模型可见契约（提示词、工具 schema、结果、诊断）只含任务相关概念，不含 UI、传输或实现词汇；稳定文本逐字固定，动态行为用快照/e2e 覆盖。
- 用户搜索与过滤遵循 Client search 规则；`t` 与本地化字典承载文案，用户/模型/wire 数据与代码 token 逐字保留。
- 录制浏览器 GIF/视频：不捕获 secrets、个人数据、无关标签页或通知；避免在应用中渲染带凭据的 URL；核验编码后的成品每一帧无敏感内容。

## 5. 命令与工具执行

- 审批、沙箱、plan mode 等按能力轴独立强制；在真正执行的操作上验证拒绝路径，包括绕过 schema/提示词/facade/wrapper/监听器顺序的替代调用者。
- 工具预期失败以 `isError` 结果表达，保留 `error.name`/`code` 供重试策略、UI、遥测路由；不得把失败伪装成成功。
- 不可信状态或未知结果必须可见（UI 或默认开启日志），报告影响、不确定性、系统处置与安全下一步；持久无效状态需持久可见。没有保证时不得声称成功、回滚或可安全重试。
- 子进程与文件访问按 owner 管理端口、路径与子进程直到 teardown；独立错误报告、回调收敛、reentry 前确立归属、完全 detach 清理与静默 dispose。

## 6. 供应链与安装授权

- 从 git 安装源码包需用户显式授权 `prepare` 脚本（pnpm ≥10 的 `allowBuilds`）：这等于**允许该包代码在安装时在本机执行**，且不在 agent 沙箱内。
- 只对可信源码授权，并锁定 commit（`github:<owner>/<repo>#<sha>`），防止后续推送悄悄改变实际运行内容。
- 优先 npm 预构建产物或 tarball，避免让用户授予构建权限。
- 依赖选择优先维护良好的依赖（确实能删除自有代码与测试时），但注意依赖本身的可信度与许可证。

## 7. 仓库内工程卫生

- `cordis.yml` 仅在插件 `config` 与条目 `disabled` 下允许 `!!js`（不是 `!js`）；其他元数据保持字面量，条件组合用 overlay。
- 根 `.env` 与真实 key 永不入库；`SAFETY.md` 声明 MIT 无担保，使用者自担风险。
- Windows 打包/签名按 `apps/desktop/windows-signing/README.md` 执行（本仓库树外插件一般不涉及，仅提示）。
