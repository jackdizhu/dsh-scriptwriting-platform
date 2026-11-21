---
name: backend-engineering
display_name: "后端工程"
display_name_en: "Backend Engineering"
description: >-
  Backend engineering (35 sub-skills): REST API design, connector building, layered patterns, migrations and caching, with framework patterns for Java, Kotlin, Go, Python, Node, PHP, Rust and .NET.
  后端工程（35 个子技能）：REST API 设计与连接器构建、后端分层与仓储模式、数据库迁移与缓存、ClickHouse 数据吞吐，并覆盖 Java/Spring、Kotlin、Go、Python、Node/NestJS、PHP/Laravel、Rust、.NET、PostgreSQL/MySQL/Redis 等框架与存储的落地范式。
  触发词 / Trigger words：后端、API 设计、REST、数据库、迁移、缓存、Spring Boot、Kotlin、Golang、Laravel、FastAPI、NestJS、PostgreSQL、MySQL、Redis, backend, api design, database migration, redis, ktor, quarkus
description_zh: "后端工程（35 个子技能）：REST API 设计与连接器构建、后端分层与仓储模式、数据库迁移与缓存、ClickHouse 数据吞吐，并覆盖 Java/Spring、Kotlin、Go、Python、Node/NestJS、PHP/Laravel、Rust、.NET、PostgreSQL/MySQL/Redis 等框架与存储的落地范式。"
description_en: "Backend engineering (35 sub-skills): REST API design, connector building, layered patterns, migrations and caching, with framework patterns for Java, Kotlin, Go, Python, Node, PHP, Rust and .NET."
category: backend
version: "1.0.0"
author: "zxh"
allowed-tools: Read,Write,Edit,Bash,Glob,Grep,WebSearch,WebFetch
disable-model-invocation: false
user-invocable: true
runtime: generic
title: "后端工程 / Backend Engineering"
tags: ["后端", "API 设计", "REST", "数据库", "缓存", "Spring", "Golang", "Laravel", "PostgreSQL"]
examples_zh:
  - "帮我设计一套生产级 REST API：资源命名、状态码、分页和限流"
  - "这个 Laravel 项目要加缓存层，按仓储与服务层模式给我改造方案"
  - "把 MySQL 迁到 PostgreSQL，帮我做迁移和回归验证"
examples_en:
  - "Design a production REST API: resource naming, status codes, pagination and rate limiting"
  - "Add a caching layer to this Laravel app following repository and service patterns"
  - "Migrate this MySQL schema to PostgreSQL with a verified migration path"
---

# 后端工程 / Backend Engineering

> **语言路由**：中文输入 → 全程中文输出；其他语言 → 优先英文输出。库名、命令、API 名保留英文原文。

> **路径约定**：本技能包为**两级平铺结构**。子技能指南在 `references/<子技能>.md`；配套资源在包根的 `references/`、`scripts/`、`assets/`、`templates/` 等目录下，文件名以 `<子技能>--` 为前缀。**所有相对路径均相对于技能包根目录。**

## 何时使用

当用户的需求命中以下任一情形时使用本技能（中文示例）：

- 「帮我设计一套生产级 REST API：资源命名、状态码、分页和限流」
- 「这个 Laravel 项目要加缓存层，按仓储与服务层模式给我改造方案」
- 「把 MySQL 迁到 PostgreSQL，帮我做迁移和回归验证」

英文对照：

- "Design a production REST API: resource naming, status codes, pagination and rate limiting"
- "Add a caching layer to this Laravel app following repository and service patterns"
- "Migrate this MySQL schema to PostgreSQL with a verified migration path"

**不适用：**

- 目标产物是 `.docx` / `.xlsx` / `.pptx` / `.pdf` 文档本身 → 见文末「文档格式分流」，转交已上架技能。
- 纯粹的闲聊、翻译、与本节子技能无关的领域问题 → 交给对应的兄弟技能包。
- 需要真实凭证、真实生产数据或不可逆操作时，先向用户确认，不要自行执行。

## 包含的子技能（35 个）

本包是一个**聚合技能**：下面每个子技能都有独立、完整的操作指南与脚本，需要时按需读取。

| 子技能 | 用途 | 详细文档 |
|---|---|---|
| `api-connector-builder` | API 连接器构建 —— 按宿主仓库既有集成范式构建新 API 连接器，不引入第二套架构。 | `references/api-connector-builder.md` |
| `api-design` | API 设计 —— REST 资源命名、状态码、分页、鉴权、限流与版本化的生产级设计模式。 | `references/api-design.md` |
| `backend-patterns` | 后端模式 —— Node.js/Express/Next.js 后端架构：仓储与服务层、缓存、错误处理、鉴权与限流。 | `references/backend-patterns.md` |
| `bun-runtime` | Bun 运行时 —— Bun 作为运行时、包管理器、打包器与测试运行器：选型、迁移与 Vercel 配置。 | `references/bun-runtime.md` |
| `clickhouse-io` | ClickHouse 库 —— 面向高性能分析负载的 ClickHouse 模式、查询优化、物化视图与时间序列/漏斗/留存分析的工程实践… | `references/clickhouse-io.md` |
| `content-hash-cache-pattern` | 内容哈希缓存 —— 用 SHA-256 内容哈希缓存昂贵的文件处理结果，路径无关且自动失效。 | `references/content-hash-cache-pattern.md` |
| `data-throughput-accelerator` | 数据吞吐加速器 —— 让大规模数据摄取/回填/ETL/数仓装载更快，同时保证计数与时间戳正确一致。 | `references/data-throughput-accelerator.md` |
| `database-migrations` | 数据库迁移 —— 覆盖 PostgreSQL/MySQL 与常见 ORM 的安全表结构变更、数据迁移、并发建索引、Expa… | `references/database-migrations.md` |
| `django-celery` | Django异步任务 —— Django + Celery 异步任务：项目接入、任务设计、Beat 定时、退避重试、canvas 与… | `references/django-celery.md` |
| `django-patterns` | Django 模式 —— Django 架构、DRF 接口、ORM 优化、缓存、信号与中间件的生产级模式。 | `references/django-patterns.md` |
| `dotnet-patterns` | .NET 模式 —— C#/.NET 的不可变、DI、异步、Result 与仓储等惯用开发模式。 | `references/dotnet-patterns.md` |
| `fastapi-patterns` | FastAPI 模式 —— FastAPI 项目结构、Pydantic v2 模型、依赖注入、事务化服务层与 httpx 异步测试。 | `references/fastapi-patterns.md` |
| `golang-patterns` | Go 开发模式 —— Go 惯用法：错误包装、并发模式、接口与包设计、性能与工具链。 | `references/golang-patterns.md` |
| `hexagonal-architecture` | 六边形架构 —— 端口与适配器架构：领域边界、依赖倒置、用例编排与 TypeScript/Java/Kotlin/Go 落… | `references/hexagonal-architecture.md` |
| `java-coding-standards` | Java 编码规范 —— Spring Boot 与 Quarkus（Java 17+）编码规范：命名、不可变、Optional… | `references/java-coding-standards.md` |
| `jpa-patterns` | JPA 模式 —— Spring Boot 下 JPA/Hibernate 的实体、关系、N+1 预防、事务、审计与 Hik… | `references/jpa-patterns.md` |
| `kotlin-coroutines-flows` | 协程与流 —— 面向 Android 与 KMP 的 Kotlin 协程与 Flow 模式：结构化并发、状态流与测试。 | `references/kotlin-coroutines-flows.md` |
| `kotlin-exposed-patterns` | Exposed 模式 —— Exposed ORM 的 DSL/DAO 查询、事务、连接池、迁移与仓库模式手册。 | `references/kotlin-exposed-patterns.md` |
| `kotlin-ktor-patterns` | Ktor 服务模式 —— Ktor 服务端模式：路由 DSL、插件、JWT 鉴权、Koin 注入与集成测试。 | `references/kotlin-ktor-patterns.md` |
| `kotlin-patterns` | Kotlin 惯用法 —— Kotlin 惯用法：空安全、不可变、密封类、协程与 Flow、DSL 构建器与 Gradle Kotl… | `references/kotlin-patterns.md` |
| `laravel-patterns` | Laravel 模式 —— Laravel 生产架构模式：分层、Eloquent、服务层、队列、API 资源与缓存。 | `references/laravel-patterns.md` |
| `laravel-plugin-discovery` | Laravel 插件发现 —— 通过 LaraPlugins.io MCP 发现、评估并筛选健康的 Laravel 包，含健康度评分与版… | `references/laravel-plugin-discovery.md` |
| `mailtrap-email-integration` | 邮件集成 —— 通过 Mailtrap 邮件 API 与沙箱实现事务性邮件发送、环境隔离、令牌鉴权与域名验证。 | `references/mailtrap-email-integration.md` |
| `mysql-patterns` | MySQL 模式 —— MySQL/MariaDB 生产模式：schema、索引、事务、复制、连接池与反模式。 | `references/mysql-patterns.md` |
| `nestjs-patterns` | NestJS 模式 —— 面向生产级 NestJS 后端：模块结构、DTO 校验、守卫与拦截器、异常过滤器与生产默认配置。 | `references/nestjs-patterns.md` |
| `nodejs-keccak256` | Keccak 哈希 —— Node 的 sha3-256 是 NIST SHA3，非以太坊 Keccak-256，会静默破坏选择器… | `references/nodejs-keccak256.md` |
| `perl-patterns` | Perl 模式 —— 现代 Perl 5.36+ 惯用法：签名、后置解引用、Moo 面向对象、安全文件 IO 与工具链配置。 | `references/perl-patterns.md` |
| `postgres-patterns` | Postgres 模式 —— PostgreSQL 建表、索引、查询优化、RLS 行级安全与连接池的生产级模式，附可直接复制的 SQL… | `references/postgres-patterns.md` |
| `prisma-patterns` | Prisma 模式 —— Prisma ORM 生产模式与易错陷阱：schema、事务、分页、连接池、迁移。 | `references/prisma-patterns.md` |
| `python-patterns` | Python 模式 —— Python 惯用法、类型注解、数据类、上下文管理器、装饰器与并发模式，含反模式与工具链。 | `references/python-patterns.md` |
| `quarkus-patterns` | Quarkus 模式 —— Quarkus 3.x 云原生后端模式：Camel 消息、Panache 数据访问、REST API 与… | `references/quarkus-patterns.md` |
| `redis-patterns` | Redis 模式 —— Redis 生产模式：缓存、分布式锁、限流、发布订阅、连接池与反模式。 | `references/redis-patterns.md` |
| `rust-patterns` | Rust 模式 —— Rust 惯用模式：所有权、Result/? 错误处理、枚举建模、trait 抽象与 Tokio 并发。 | `references/rust-patterns.md` |
| `springboot-patterns` | SpringBoot模式 —— Java Spring Boot 后端的分层架构、REST、JPA、缓存、异步与限流模式。 | `references/springboot-patterns.md` |
| `tinystruct-patterns` | tinystruct模式 —— tinystruct 开发指南：@Action 双模路由、原生 JSON、持久化与测试。 | `references/tinystruct-patterns.md` |

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
