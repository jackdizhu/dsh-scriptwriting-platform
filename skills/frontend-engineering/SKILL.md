---
name: frontend-engineering
display_name: "前端工程"
display_name_en: "Frontend Engineering"
description: >-
  Frontend engineering (32 sub-skills): accessibility audits, design systems, Motion animation, React/Vue/Angular/Next.js patterns, Flutter and React Native, SwiftUI and Compose.
  前端工程（32 个子技能）：无障碍与可访问性审计、设计系统与界面方向、动效体系（Motion 进阶/基础/模式）、React/Vue/Angular/Next.js/Nuxt/Vite 工程范式、Flutter 与 React Native 跨端、SwiftUI 与 Compose 原生、点击路径审计与 UI 还原。
  触发词 / Trigger words：前端、React、Vue、Angular、Next.js、Nuxt、Vite、Flutter、React Native、SwiftUI、设计系统、无障碍、动效, frontend, a11y, motion, ui-to-vue, design system
description_zh: "前端工程（32 个子技能）：无障碍与可访问性审计、设计系统与界面方向、动效体系（Motion 进阶/基础/模式）、React/Vue/Angular/Next.js/Nuxt/Vite 工程范式、Flutter 与 React Native 跨端、SwiftUI 与 Compose 原生、点击路径审计与 UI 还原。"
description_en: "Frontend engineering (32 sub-skills): accessibility audits, design systems, Motion animation, React/Vue/Angular/Next.js patterns, Flutter and React Native, SwiftUI and Compose."
category: frontend
version: "1.0.0"
author: "zxh"
allowed-tools: Read,Write,Edit,Bash,Glob,Grep,WebSearch,WebFetch
disable-model-invocation: false
user-invocable: true
runtime: generic
title: "前端工程 / Frontend Engineering"
tags: ["前端", "React", "Vue", "Angular", "无障碍", "设计系统", "动效", "Flutter", "SwiftUI"]
examples_zh:
  - "按 WCAG 2.2 AA 审计这个页面的无障碍问题并给出修复清单"
  - "把这套设计稿转成 Vue 3 组件，保持设计系统一致"
  - "给这个列表页加一套顺滑的 Motion 动效，要有进入和退出过渡"
examples_en:
  - "Audit this page for WCAG 2.2 AA issues and give me a fix list"
  - "Convert these mockups into Vue 3 components that follow our design system"
  - "Add polished Motion animations to this list page with enter and exit transitions"
---

# 前端工程 / Frontend Engineering

> **语言路由**：中文输入 → 全程中文输出；其他语言 → 优先英文输出。库名、命令、API 名保留英文原文。

> **路径约定**：本技能包为**两级平铺结构**。子技能指南在 `references/<子技能>.md`；配套资源在包根的 `references/`、`scripts/`、`assets/`、`templates/` 等目录下，文件名以 `<子技能>--` 为前缀。**所有相对路径均相对于技能包根目录。**

## 何时使用

当用户的需求命中以下任一情形时使用本技能（中文示例）：

- 「按 WCAG 2.2 AA 审计这个页面的无障碍问题并给出修复清单」
- 「把这套设计稿转成 Vue 3 组件，保持设计系统一致」
- 「给这个列表页加一套顺滑的 Motion 动效，要有进入和退出过渡」

英文对照：

- "Audit this page for WCAG 2.2 AA issues and give me a fix list"
- "Convert these mockups into Vue 3 components that follow our design system"
- "Add polished Motion animations to this list page with enter and exit transitions"

**不适用：**

- 目标产物是 `.docx` / `.xlsx` / `.pptx` / `.pdf` 文档本身 → 见文末「文档格式分流」，转交已上架技能。
- 纯粹的闲聊、翻译、与本节子技能无关的领域问题 → 交给对应的兄弟技能包。
- 需要真实凭证、真实生产数据或不可逆操作时，先向用户确认，不要自行执行。

## 包含的子技能（32 个）

本包是一个**聚合技能**：下面每个子技能都有独立、完整的操作指南与脚本，需要时按需读取。

| 子技能 | 用途 | 详细文档 |
|---|---|---|
| `accessibility` | 无障碍 —— 按 WCAG 2.2 AA 设计、实现并审计无障碍产品，覆盖 Web/iOS/Android 的语义、A… | `references/accessibility.md` |
| `android-clean-architecture` | 安卓整洁架构 —— Android / KMP 整洁架构：模块分层、UseCase、Repository、Room/SQLD… | `references/android-clean-architecture.md` |
| `angular-developer` | Angular 开发 —— 现代 Angular 开发：Signals、表单、DI、路由、SSR、ARIA、Tailwind v4… | `references/angular-developer.md` |
| `blender-motion-state-inspection` | Blender动作检查 —— Blender 角色/骨架/姿态/重定向的结构化动作检查：骨骼、接触、朝向与脚滑，不靠截图下结论。 | `references/blender-motion-state-inspection.md` |
| `click-path-audit` | 点击路径审计 —— 逐个按钮追踪状态变更序列，抓出函数互相抵消、最终状态错误与异步竞态。 | `references/click-path-audit.md` |
| `compose-multiplatform-patterns` | 多平台组合 —— 面向 KMP 的 Compose 状态管理、类型安全导航、可复用组合与重组性能优化模式。 | `references/compose-multiplatform-patterns.md` |
| `dart-flutter-patterns` | Flutter 模式 —— 覆盖空安全、不可变状态、BLoC/Riverpod 状态管理、GoRouter 导航、Dio 网络与整洁… | `references/dart-flutter-patterns.md` |
| `design-system` | 设计系统 —— 生成或审计设计系统、检查视觉一致性、评审样式 PR，含令牌生成与 AI 凑数检测。 | `references/design-system.md` |
| `flutter-dart-code-review` | Flutter 代码评审 —— 与库无关的 Flutter/Dart 代码评审清单：Widget、状态管理、Dart 惯用法、性能、无障… | `references/flutter-dart-code-review.md` |
| `frontend-a11y` | 前端无障碍 —— 面向 React/Next.js 的无障碍模式：语义 HTML、ARIA、表单标签、键盘导航、焦点管理与… | `references/frontend-a11y.md` |
| `frontend-design-direction` | 前端设计方向 —— 写代码前先定设计方向：五问框架、层级排版、多维配色与反模式清单，让界面有主张而不落俗套。 | `references/frontend-design-direction.md` |
| `frontend-patterns` | 前端模式 —— React/Next.js 组件组合、自定义 Hook、状态管理、性能优化、表单、错误边界、动效与无障碍… | `references/frontend-patterns.md` |
| `frontend-slides` | 前端演示 —— 零依赖动画化 HTML 演示：视口自适应、12 套风格预设、PPT/PPTX 转换与 PDF 导出。 | `references/frontend-slides.md` |
| `ios-icon-gen` | iOS 图标生成 —— 从 SF Symbols 或 Iconify API 为 Xcode 生成 iOS 应用图标的 PNG… | `references/ios-icon-gen.md` |
| `liquid-glass-design` | 液态玻璃设计 —— iOS 26 液态玻璃设计系统：SwiftUI、UIKit 与 WidgetKit 的玻璃材质、形变与容… | `references/liquid-glass-design.md` |
| `make-interfaces-feel-better` | 界面质感 —— 界面打磨的具体设计细节：间距、同心圆角、视觉对齐、文本换行、动效与点击热区。 | `references/make-interfaces-feel-better.md` |
| `motion-advanced` | 高级动效 —— React/Next.js 高级动效：拖拽手势、逐字动画、SVG 描边形变、命令式编排与加载指示器。 | `references/motion-advanced.md` |
| `motion-foundations` | 动效基础 —— React/Next.js 的 motion/react 动效基座：token、弹簧、可访问性与 SSR… | `references/motion-foundations.md` |
| `motion-patterns` | 动效模式 —— 基于 motion-foundations 的 React/Next.js 生产级动画模式：按钮、模态框… | `references/motion-patterns.md` |
| `motion-ui` | 动效 UI —— 生产级 React/Next.js 动效系统（Motion v4.2），覆盖动效令牌、可访问性、Anim… | `references/motion-ui.md` |
| `nextjs-turbopack` | Next.js 构建 —— Next.js 16+ 与 Turbopack：增量构建、文件系统缓存、proxy.ts 中间件命名与开… | `references/nextjs-turbopack.md` |
| `nuxt4-patterns` | Nuxt 4 模式 —— Nuxt 4 的水合安全 SSR、路由规则、懒加载与 useFetch/useAsyncData 数据获… | `references/nuxt4-patterns.md` |
| `react-native-patterns` | RN 跨端模式 —— Expo/React Native 的路由、状态、数据获取、列表与样式模式。 | `references/react-native-patterns.md` |
| `react-patterns` | React 模式 —— React 18/19 模式：Hooks、RSC、Suspense、表单、数据获取决策与无障碍组合。 | `references/react-patterns.md` |
| `react-performance` | React 性能 —— 改编自 Vercel 的 React 性能最佳实践，覆盖瀑布、包体积、服务端、重渲染、渲染与 Light… | `references/react-performance.md` |
| `swift-actor-persistence` | Swift 持久化 —— 基于 Swift actor 的内存缓存 + 原子文件存储持久化模式，编译期消除数据竞争，无需手动加锁。 | `references/swift-actor-persistence.md` |
| `swift-concurrency-6-2` | Swift 6.2 并发 —— Swift 6.2 易上手并发模式：默认单线程、用 @concurrent 显式后台卸载、为主线程类型提… | `references/swift-concurrency-6-2.md` |
| `swiftui-patterns` | SwiftUI 模式 —— SwiftUI 的 @Observable 状态管理、视图组合、类型安全导航与渲染性能优化。 | `references/swiftui-patterns.md` |
| `ui-demo` | UI演示录制 —— 用 Playwright 录制精良的 Web 应用 UI 演示视频：探索→排练→录制三阶段，注入光标与字… | `references/ui-demo.md` |
| `ui-to-vue` | 设计稿转 Vue —— 把 UI 设计截图批量转成 Vue 3 组合式组件，支持 Vant、Element Plus 与 Ant… | `references/ui-to-vue.md` |
| `vite-patterns` | Vite 模式 —— Vite 8+ 配置、插件选型、VITE_ 环境变量安全边界、手动分包、性能调优与库模式外置对等依赖。 | `references/vite-patterns.md` |
| `vue-patterns` | Vue模式 —— Vue 3 组合式 API、组件架构、响应式、Pinia、Vue Router 与 Nuxt SSR 模… | `references/vue-patterns.md` |

## 工作方式

1. **先选子技能**：读上面的索引表，判断用户需求落在哪一个（或哪几个）子技能上。
2. **再读全文**：读取 `references/<子技能>.md` 的完整内容，**按其步骤执行**，不要仅凭标题猜测做法。
3. **同包找配套资源**：子技能自带的脚本、模板与示例已平铺到包根 —— 分别为 `scripts/<子技能>--…`、`assets/<子技能>--…`、`templates/<子技能>--…`。**所有相对路径以技能包根目录为基准**（子技能指南开头也写明了这一点）。
4. **可串联**：多个子技能常需接力，例如「代码导览 → 编排加功能 → 测试与验证」或「安全审计 → 修复 → 回归」。串联时逐步确认中间产出。
5. **动手前先确认边界**：涉及破坏性命令、生产环境变更、凭证与付费接口时，必须先向用户说明影响并取得确认；子技能里标注的「只读」「沙箱」「需人工复核」等限制必须原样保留。
6. **不编造**：子技能未覆盖的 API、参数、版本号，先查证再回答；查不到就直说。

## 交付前校验清单

- 关键命令、配置片段与代码块都实际可运行或有明确来源，不是凭印象拼的。
- 破坏性操作（删库、改生产配置、强推、覆盖文件）已标注风险并给出回滚方式。
- 涉及版本、框架、云服务的建议写清了适用的版本区间与前置条件。
- 交付物里的路径、端口、环境变量与实际仓库一致，没有残留占位符。
- 涉及安全、合规、支付、医疗等敏感场景时，适用范围与限制已写明。

## 文档格式分流

本技能负责工程实现本身。**目标产物是 Office / PDF 文档时，转交下表对应技能**：

| 目标格式 | 使用技能（name） | 展示名 |
|---|---|---|
| Word `.docx` / `.dotx` | `docx-pro` | Word 文档处理 |
| Excel `.xlsx` | `xlsx` | Excel 表格处理 |
| PPT `.pptx` / `.potx` | `pptx` | PPT 演示文稿 |
| PDF `.pdf` | `pdf-pro` | PDF 文档处理 |

补充：Markdown 源文件的语法与渲染问题交给 `markdown-md`。

## 调用流程（先按 `name` 精确匹配 → 未安装才装 → 再调用）

同族技能，需要时可直接调用；若当前 WorkBuddy 未安装，先按 `name` 在技能市场搜索并自动安装，再调用（安装一次后持久复用）。

> ⚠️ **按 `name` 搜索会返回大量近似结果**，必须先做**同名精确匹配核对**再安装，绝不允许按相似度猜。

1. **查** —— 先用 `skill_management` 列出已安装技能，或检查 `~/.workbuddy/skills/<name>/SKILL.md`；**已装 → 直接调用，不必搜索**。
2. **搜** —— 未装才搜：`search_and_install_skills`，关键词用**完整 name** 或上表展示名。
3. **核（关键）** —— 逐项核对，**四项全中方为命中**：`name` **逐字符完全相同**（kebab-case 一字不差；前缀/后缀/子串/近拼写一律排除）· `display_name` / `display_name_en` 与上表一致 · `author` 同为 `zxh` · 条目类型是技能（skill）。
4. **分流** —— **恰好 1 条命中** → 安装后调用；**0 条命中** → **不安装任何近似名技能**，告知用户未找到并请其确认，**不得用同类技能顶替**；**≥2 条命中** → **不自动安装**，把候选（`name` + 展示名 + author + 版本）列给用户指定。
5. **兜底** —— 平台要求确认安装或授权时，先向用户说明再继续，**不得静默跳过或降级输出**。

## 维护说明

- 本技能是**纯指令集**：内容为文档与脚本，不上传用户数据、不写入外部系统。
- 子技能脚本默认要求 Python 3.11+；需要联网、需要凭证或需要 GPU 的子技能已在各自指南里声明。
- 使用中发现新的踩坑场景，请补充进对应子技能的 `references/<子技能>.md` 并递增 `version` 后再发布。

## 来源与许可

子技能内容整理自既有开源技能集（原子技能 frontmatter 标注 `origin: ECC`），由 `zxh` 重新分类、聚合并补写中英双语入口与调用约定，适配 WorkBuddy 开放平台技能规范。
