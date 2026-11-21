# 后端工程 / Backend Engineering

> 后端工程
>
> Backend Engineering

## 能力说明

本技能包聚合了 **35 个子技能**，每个子技能都带完整的操作指南、脚本与模板，按需读取即可。

> **结构**：两级平铺。子技能指南为 `references/<子技能>.md`；配套脚本与数据在 `scripts/`、`assets/`、`templates/` 等目录下，以 `<子技能>--` 为前缀。

- `api-connector-builder` —— API 连接器构建 —— 按宿主仓库既有集成范式构建新 API 连接器，不引入第二套架构。
- `api-design` —— API 设计 —— REST 资源命名、状态码、分页、鉴权、限流与版本化的生产级设计模式。
- `backend-patterns` —— 后端模式 —— Node.js/Express/Next.js 后端架构：仓储与服务层、缓存、错误处理、鉴权与限流。
- `bun-runtime` —— Bun 运行时 —— Bun 作为运行时、包管理器、打包器与测试运行器：选型、迁移与 Vercel 配置。
- `clickhouse-io` —— ClickHouse 库 —— 面向高性能分析负载的 ClickHouse 模式、查询优化、物化视图与时间序列/漏斗/留存分析的工程实践…
- `content-hash-cache-pattern` —— 内容哈希缓存 —— 用 SHA-256 内容哈希缓存昂贵的文件处理结果，路径无关且自动失效。
- `data-throughput-accelerator` —— 数据吞吐加速器 —— 让大规模数据摄取/回填/ETL/数仓装载更快，同时保证计数与时间戳正确一致。
- `database-migrations` —— 数据库迁移 —— 覆盖 PostgreSQL/MySQL 与常见 ORM 的安全表结构变更、数据迁移、并发建索引、Expa…
- `django-celery` —— Django异步任务 —— Django + Celery 异步任务：项目接入、任务设计、Beat 定时、退避重试、canvas 与…
- `django-patterns` —— Django 模式 —— Django 架构、DRF 接口、ORM 优化、缓存、信号与中间件的生产级模式。
- `dotnet-patterns` —— .NET 模式 —— C#/.NET 的不可变、DI、异步、Result 与仓储等惯用开发模式。
- `fastapi-patterns` —— FastAPI 模式 —— FastAPI 项目结构、Pydantic v2 模型、依赖注入、事务化服务层与 httpx 异步测试。
- `golang-patterns` —— Go 开发模式 —— Go 惯用法：错误包装、并发模式、接口与包设计、性能与工具链。
- `hexagonal-architecture` —— 六边形架构 —— 端口与适配器架构：领域边界、依赖倒置、用例编排与 TypeScript/Java/Kotlin/Go 落…
- `java-coding-standards` —— Java 编码规范 —— Spring Boot 与 Quarkus（Java 17+）编码规范：命名、不可变、Optional…
- `jpa-patterns` —— JPA 模式 —— Spring Boot 下 JPA/Hibernate 的实体、关系、N+1 预防、事务、审计与 Hik…
- `kotlin-coroutines-flows` —— 协程与流 —— 面向 Android 与 KMP 的 Kotlin 协程与 Flow 模式：结构化并发、状态流与测试。
- `kotlin-exposed-patterns` —— Exposed 模式 —— Exposed ORM 的 DSL/DAO 查询、事务、连接池、迁移与仓库模式手册。
- `kotlin-ktor-patterns` —— Ktor 服务模式 —— Ktor 服务端模式：路由 DSL、插件、JWT 鉴权、Koin 注入与集成测试。
- `kotlin-patterns` —— Kotlin 惯用法 —— Kotlin 惯用法：空安全、不可变、密封类、协程与 Flow、DSL 构建器与 Gradle Kotl…
- `laravel-patterns` —— Laravel 模式 —— Laravel 生产架构模式：分层、Eloquent、服务层、队列、API 资源与缓存。
- `laravel-plugin-discovery` —— Laravel 插件发现 —— 通过 LaraPlugins.io MCP 发现、评估并筛选健康的 Laravel 包，含健康度评分与版…
- `mailtrap-email-integration` —— 邮件集成 —— 通过 Mailtrap 邮件 API 与沙箱实现事务性邮件发送、环境隔离、令牌鉴权与域名验证。
- `mysql-patterns` —— MySQL 模式 —— MySQL/MariaDB 生产模式：schema、索引、事务、复制、连接池与反模式。
- `nestjs-patterns` —— NestJS 模式 —— 面向生产级 NestJS 后端：模块结构、DTO 校验、守卫与拦截器、异常过滤器与生产默认配置。
- `nodejs-keccak256` —— Keccak 哈希 —— Node 的 sha3-256 是 NIST SHA3，非以太坊 Keccak-256，会静默破坏选择器…
- `perl-patterns` —— Perl 模式 —— 现代 Perl 5.36+ 惯用法：签名、后置解引用、Moo 面向对象、安全文件 IO 与工具链配置。
- `postgres-patterns` —— Postgres 模式 —— PostgreSQL 建表、索引、查询优化、RLS 行级安全与连接池的生产级模式，附可直接复制的 SQL…
- `prisma-patterns` —— Prisma 模式 —— Prisma ORM 生产模式与易错陷阱：schema、事务、分页、连接池、迁移。
- `python-patterns` —— Python 模式 —— Python 惯用法、类型注解、数据类、上下文管理器、装饰器与并发模式，含反模式与工具链。
- `quarkus-patterns` —— Quarkus 模式 —— Quarkus 3.x 云原生后端模式：Camel 消息、Panache 数据访问、REST API 与…
- `redis-patterns` —— Redis 模式 —— Redis 生产模式：缓存、分布式锁、限流、发布订阅、连接池与反模式。
- `rust-patterns` —— Rust 模式 —— Rust 惯用模式：所有权、Result/? 错误处理、枚举建模、trait 抽象与 Tokio 并发。
- `springboot-patterns` —— SpringBoot模式 —— Java Spring Boot 后端的分层架构、REST、JPA、缓存、异步与限流模式。
- `tinystruct-patterns` —— tinystruct模式 —— tinystruct 开发指南：@Action 双模路由、原生 JSON、持久化与测试。

## 何时使用

- 「帮我设计一套生产级 REST API：资源命名、状态码、分页和限流」
- 「这个 Laravel 项目要加缓存层，按仓储与服务层模式给我改造方案」
- 「把 MySQL 迁到 PostgreSQL，帮我做迁移和回归验证」

**不适用**：目标产物是 `.docx` / `.xlsx` / `.pptx` / `.pdf` 文档本身——那一步交给「文档格式分流」里的已上架技能；或与上述子技能无关的领域问题。

## 文档格式分流

| 目标格式 | 使用技能（name） | 展示名 |
|---|---|---|
| Word `.docx` / `.dotx` | `docx-pro` | Word 文档处理 |
| Excel `.xlsx` | `xlsx` | Excel 表格处理 |
| PPT `.pptx` / `.potx` | `pptx` | PPT 演示文稿 |
| PDF `.pdf` | `pdf-pro` | PDF 文档处理 |

未安装时会先自动安装再调用，**但只认同名精确匹配**：按完整 `name` 搜索后逐项核对 —— `name` 逐字符完全一致 + 展示名一致 + author 同源，四项全中才装。恰好 1 条命中→直接装；0 条命中→不装近似名技能并告知你；≥2 条命中→把候选列给你选，不擅自安装。

---

## English

> Backend Engineering

This package bundles **35 sub-skills**, each with its own complete guide, scripts and templates. Read them on demand from `references/<sub-skill>.md`.

> **Layout**: two levels only. Each sub-skill guide lives at `references/<sub-skill>.md`; its scripts and data live under `scripts/`, `assets/`, `templates/`, prefixed with `<sub-skill>--`. Every relative path resolves against the package root.

### Format routing & related skills

This package covers the engineering work itself. Route Office/PDF deliverables by `name` — `docx-pro` (Word), `xlsx` (Excel), `pptx` (PowerPoint), `pdf-pro` (PDF). Missing ones are installed automatically, but **only on an exact name match** — the `name` must match character-for-character, with the same display name and author. One hit → install; zero hits → no look-alike is installed; two or more → candidates are listed for the user to choose.

## 版本

- `1.0.0` —— 首个版本：由 skills090522 技能集（286 个技能）重新分类聚合为 8 个技能包，本包含 35 个子技能，补齐中英双语入口、调用约定与交付校验清单；采用两级平铺结构以适配开放平台目录限制。

## 来源与许可

子技能内容整理自既有开源技能集（原子技能 frontmatter 标注 `origin: ECC`），由 `zxh` 重新分类、聚合并适配 WorkBuddy 开放平台技能规范。
