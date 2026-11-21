/**
 * WorkbenchService 的 mock 实现（阶段 1.5，D5 语义在浏览器内存里模拟）。
 *
 * 严格遵守 D5：
 * - 权威状态在 service 内（works + activeWorkId + view），组件只读快照；
 * - deleteWork = 软删（标记 deletedAt，不清空 view）；
 * - 同开内容域上限 1（activeWorkId 单例，切换即换当前）；
 * - 命令执行后重建快照并通知订阅者（模拟 D5「写后失效信号 → 浏览器重查」）。
 *
 * TODO(阶段 5)：本文件由 @Remote client service 替换。替换点 = store.setService() 一行。
 */
import type {
  ViewKind, ViewSlice, WorkId, WorkMeta, WorkView, WorkbenchService, WorkbenchSnapshot,
} from '../contract.ts'
import { FIXTURES, type WorkFixture } from '../mock/works.ts'

export class MockWorkbenchService implements WorkbenchService {
  private readonly works = new Map<WorkId, WorkMeta>()
  private readonly views = new Map<WorkId, WorkView>()
  private activeWorkId: WorkId | null
  private snapshot!: WorkbenchSnapshot
  private readonly listeners = new Set<() => void>()
  private seq = 0

  constructor(fixtures: readonly WorkFixture[] = FIXTURES, activeId?: WorkId) {
    for (const fixture of fixtures) {
      this.works.set(fixture.meta.id, { ...fixture.meta })
      this.views.set(fixture.meta.id, fixture.view)
    }
    const firstAlive = fixtures.find(f => f.meta.deletedAt === undefined)?.meta.id
    this.activeWorkId = activeId ?? firstAlive ?? null
    this.rebuild()
  }

  // ---- ObservableSnapshot 契约（引用稳定：只在 rebuild 时换新对象） ----

  getSnapshot(): WorkbenchSnapshot {
    return this.snapshot
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private notify(): void {
    for (const fn of this.listeners) fn()
  }

  /** 重建只读快照：过滤软删作品，取当前作品与其 view。 */
  private rebuild(): void {
    const works = [...this.works.values()]
      .filter(work => work.deletedAt === undefined)
      .sort((a, b) => a.order - b.order)
    const activeWork = this.activeWorkId === null ? null : (this.works.get(this.activeWorkId) ?? null)
    const aliveActive = activeWork !== null && activeWork.deletedAt === undefined ? activeWork : null
    this.snapshot = {
      works,
      activeWork: aliveActive,
      view: aliveActive === null ? null : (this.views.get(aliveActive.id) ?? null),
    }
    this.notify()
  }

  // ---- 查询（async，形态对齐 @Remote） ----

  async listWorks(): Promise<readonly WorkMeta[]> {
    return this.snapshot.works
  }

  async getActiveWork(): Promise<WorkMeta | null> {
    return this.snapshot.activeWork
  }

  async getView(kind: ViewKind): Promise<ViewSlice | null> {
    const view = this.snapshot.view
    if (view === null) return null
    switch (kind) {
      case 'worldmap': return { kind, data: view.world }
      case 'relations': return { kind, data: view.relations }
      case 'timeline': return { kind, data: view.timeline }
    }
  }

  // ---- 命令（执行后重建快照 + 通知，模拟写后失效信号） ----

  async createWork(title: string): Promise<WorkMeta> {
    const clean = title.trim()
    if (clean === '') throw new Error('[scriptwriting] 作品名不能为空')
    const id = `work_new_${++this.seq}`
    const now = Date.now()
    const meta: WorkMeta = { id, title: clean, createdAt: now, updatedAt: now, order: now }
    this.works.set(id, meta)
    this.views.set(id, { world: { places: [], routes: [] }, relations: { characters: [], relations: [] }, timeline: { lanes: ['主线'], events: [] } })
    // D5：新建后即切换到新作品（close 旧 → open 新 → 更新 activeWorkId）；上限 1 保持不变。
    this.activeWorkId = id
    this.rebuild()
    return { ...meta }
  }

  async switchWork(id: WorkId): Promise<void> {
    const target = this.works.get(id)
    if (target === undefined || target.deletedAt !== undefined) {
      throw new Error(`[scriptwriting] 作品不存在或已删除：${id}`)
    }
    this.activeWorkId = id
    this.rebuild()
  }

  async renameWork(id: WorkId, title: string): Promise<void> {
    const target = this.works.get(id)
    if (target === undefined || target.deletedAt !== undefined) {
      throw new Error(`[scriptwriting] 作品不存在或已删除：${id}`)
    }
    const clean = title.trim()
    if (clean === '') throw new Error('[scriptwriting] 作品名不能为空')
    target.title = clean
    target.updatedAt = Date.now()
    this.rebuild()
  }

  async deleteWork(id: WorkId): Promise<void> {
    const target = this.works.get(id)
    if (target === undefined || target.deletedAt !== undefined) return // 幂等
    // D5 软删：只标记，不清空 views（数据保留，供未来恢复/导出）。
    target.deletedAt = Date.now()
    if (this.activeWorkId === id) {
      // 当前作品被删 → 切到另一件仍有效的作品（同开上限 1 不破）。
      const next = [...this.works.values()]
        .filter(work => work.deletedAt === undefined)
        .sort((a, b) => a.order - b.order)[0]
      this.activeWorkId = next?.id ?? null
    }
    this.rebuild()
  }
}
