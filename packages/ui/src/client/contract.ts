/**
 * UI 侧领域契约：D5「Node ctx 服务 API + 浏览器单向展示」在浏览器侧的镜像。
 *
 * 阶段 1.5 用 mock 实现（src/client/service/mock.ts）；阶段 5 换成 @Remote
 * client service，**组件不动**——这正是 D5「浏览器只发命令 + 查状态 + 渲染」的落点。
 *
 * 类型与 dsh-scriptwriting-core 规划同形，字段保持一致以免阶段 5 返工。
 * TODO(阶段 5)：领域类型改为从 `dsh-scriptwriting-core` 导入，删除本文件的类型定义。
 */

// ---------------------------------------------------------------------------
// 领域类型（与 core 同形）
// ---------------------------------------------------------------------------

/** TODO(阶段 5)：换 core 的品牌类型 WorkId。 */
export type WorkId = string

export interface WorkMeta {
  id: WorkId
  title: string
  createdAt: number
  updatedAt: number
  order: number
  /** D5 软删标记：缺失或 0 表示有效；作品列表默认过滤已删。 */
  deletedAt?: number
}

export type PlaceKind = 'city' | 'ruin' | 'port' | 'shore'

export interface WorldPlace {
  id: string
  name: string
  x: number
  y: number
  kind: PlaceKind
}

export interface WorldRoute {
  from: string
  to: string
  name: string
}

export interface WorldData {
  places: readonly WorldPlace[]
  routes: readonly WorldRoute[]
}

export interface Character {
  id: string
  name: string
  /** 0=同盟圈、1=对立圈、2=中立圈；与关系线型配色对应。 */
  group: number
  value: number
}

export type RelationKind = 'ally' | 'rival' | 'kin'

export interface CharacterRelation {
  source: string
  target: string
  kind: RelationKind
  label: string
}

export interface RelationsData {
  characters: readonly Character[]
  relations: readonly CharacterRelation[]
}

export interface TimelineEvent {
  id: string
  lane: string
  title: string
  start: string
  end: string
}

export interface TimelineData {
  events: readonly TimelineEvent[]
  lanes: readonly string[]
}

export interface WorkView {
  world: WorldData
  relations: RelationsData
  timeline: TimelineData
}

// ---------------------------------------------------------------------------
// Service API（D5 的 UI 镜像）
// ---------------------------------------------------------------------------

export type ViewKind = 'worldmap' | 'relations' | 'timeline'

/** getView(kind) 的判别联合返回，对应 D5 查询 API。 */
export type ViewSlice =
  | { kind: 'worldmap'; data: WorldData }
  | { kind: 'relations'; data: RelationsData }
  | { kind: 'timeline'; data: TimelineData }

/**
 * 浏览器侧「当前状态」投影快照（harness `ObservableSnapshot<T>` 契约）。
 * 只读：组件订阅它渲染，绝不写回；写操作一律走下面的命令方法。
 */
export interface WorkbenchSnapshot {
  /** 未软删的作品列表。 */
  works: readonly WorkMeta[]
  /** 当前作品；无作品时为 null。 */
  activeWork: WorkMeta | null
  /** 当前作品三视图全量数据；无当前作品时为 null。 */
  view: WorkView | null
}

/**
 * 作品工作台服务——D5 里 Node `ctx.provide('scriptwritingWorks')` 的浏览器侧镜像。
 *
 * - 查询/命令方法是 async，形态对齐 `@Remote` RPC；阶段 5 换成真 RPC 时组件不变。
 * - `getSnapshot`/`subscribe` 是本地投影契约：命令执行后 service 更新快照并通知，
 *   组件重查（对应 D5「写后失效信号 → 浏览器重新查询」）。
 */
export interface WorkbenchService {
  // 查询（镜像 D5 的 getActiveWork / getView / listWorks）
  listWorks(): Promise<readonly WorkMeta[]>
  getActiveWork(): Promise<WorkMeta | null>
  getView(kind: ViewKind): Promise<ViewSlice | null>

  // 命令（镜像 D5 的 createWork / switchWork / renameWork / deleteWork）
  createWork(title: string): Promise<WorkMeta>
  switchWork(id: WorkId): Promise<void>
  renameWork(id: WorkId, title: string): Promise<void>
  /** D5 软删：标记 deletedAt，不清空内容数据。 */
  deleteWork(id: WorkId): Promise<void>

  // 本地投影（ObservableSnapshot 契约，引用必须稳定）
  getSnapshot(): WorkbenchSnapshot
  subscribe(fn: () => void): () => void
}
