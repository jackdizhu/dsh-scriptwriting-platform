/**
 * 主列「创作平台」工作台（main 的 keyed 注册，key = PANEL_ID）。
 *
 * 阶段 1.5 完整化：作品列表 / 新建 / 切换 / 重命名 / 软删 + 三视图入口 + 当前作品数据摘要。
 * 单向数据流（D5）：读 = useWorkbench() 快照；写 = getService().<命令>()。
 * 组件不 import mock、不直接改状态；阶段 5 换 service 实现后本组件不变。
 */
import { useState, type FormEvent } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ViewKind, WorkId } from '../contract.ts'
import { getService } from '../store.ts'
import { useWorkbench } from '../useWorkbench.ts'
import { s } from '../styles.ts'

export interface PlatformPageInjected {
  openView: (kind: string) => void
  collapse: () => void
  activeKind: string | undefined
}

const CARDS: { kind: ViewKind; slug: string; title: string; desc: string }[] = [
  { kind: 'worldmap', slug: 'scriptwriting-worldmap', title: '世界地图', desc: '地点、路线与地名标注' },
  { kind: 'relations', slug: 'scriptwriting-relations', title: '人物关系', desc: '角色之间的同盟、敌对与亲缘' },
  { kind: 'timeline', slug: 'scriptwriting-timeline', title: '时间线', desc: '多泳道事件区间' },
]

const fmtDate = (ts: number): string => new Date(ts).toISOString().slice(0, 10)

export function PlatformPage({ openView, collapse, activeKind }: PropsRuntime<'main'> & PlatformPageInjected) {
  const { works, activeWork, view } = useWorkbench()
  const [draftTitle, setDraftTitle] = useState('')
  const [editingId, setEditingId] = useState<WorkId | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const service = getService()

  const onCreate = (event: FormEvent): void => {
    event.preventDefault()
    if (draftTitle.trim() === '') return
    void service.createWork(draftTitle).then(() => setDraftTitle(''))
  }

  const onRename = (id: WorkId): void => {
    if (editTitle.trim() === '') { setEditingId(null); return }
    void service.renameWork(id, editTitle).then(() => setEditingId(null))
  }

  const startRename = (id: WorkId, title: string): void => {
    setEditingId(id)
    setEditTitle(title)
  }

  const counts = view === null
    ? null
    : {
        places: view.world.places.length,
        routes: view.world.routes.length,
        characters: view.relations.characters.length,
        relations: view.relations.relations.length,
        events: view.timeline.events.length,
      }

  return (
    <div data-sw="platform-page" style={s.page}>
      <div style={s.row}>
        <h2 style={s.h2}>创作平台</h2>
        <span style={s.muted}>{activeWork === null ? '尚无作品' : `当前：${activeWork.title}`}</span>
      </div>

      <div style={s.divider} />

      {/* 作品管理区：全部走 service 命令，列表读快照 */}
      <section data-sw="workbench">
        <h3 style={s.sectionTitle}>我的作品</h3>
        <div style={s.cardList}>
          {works.length === 0 && <p style={s.muted}>还没有作品，先新建一个吧。</p>}
          {works.map(work => {
            const active = work.id === activeWork?.id
            const editing = work.id === editingId
            return (
              <div key={work.id} data-sw="work-item" data-active={active ? 'true' : 'false'}
                style={{ ...s.workItem, ...(active ? s.workItemActive : {}) }}>
                {editing ? (
                  <input style={s.input} value={editTitle} autoFocus
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onRename(work.id); if (e.key === 'Escape') setEditingId(null) }} />
                ) : (
                  <span style={s.workTitle} title={work.title}>{work.title}</span>
                )}
                {editing ? (
                  <>
                    <button type="button" style={{ ...s.button, ...s.buttonPrimary }} onClick={() => onRename(work.id)}>保存</button>
                    <button type="button" style={s.button} onClick={() => setEditingId(null)}>取消</button>
                  </>
                ) : (
                  <>
                    <span style={s.muted}>{fmtDate(work.updatedAt)}</span>
                    <button type="button" style={{ ...s.button, ...(active ? s.buttonPrimary : {}) }} disabled={active}
                      onClick={() => void service.switchWork(work.id)}>切换</button>
                    <button type="button" style={s.button} onClick={() => startRename(work.id, work.title)}>重命名</button>
                    <button type="button" style={{ ...s.button, ...s.buttonDanger }} onClick={() => void service.deleteWork(work.id)}>删除</button>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <form style={{ ...s.row, marginTop: 8 }} onSubmit={onCreate}>
          <input style={s.input} placeholder="新作品名称" value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)} />
          <button type="submit" style={{ ...s.button, ...s.buttonPrimary }}>新建作品</button>
        </form>
      </section>

      <div style={s.divider} />

      {/* 三视图入口 */}
      <section data-sw="views">
        <h3 style={s.sectionTitle}>内容视图</h3>
        <p style={s.muted}>选择一视图，在右侧面板查看与编辑。</p>
        <div style={s.cards}>
          {CARDS.map(card => (
            <button key={card.kind} type="button" data-sw="platform-card"
              data-active={card.slug === activeKind ? 'true' : 'false'}
              style={{ ...s.viewCard, ...(card.slug === activeKind ? s.viewCardActive : {}) }}
              onClick={() => openView(card.slug)}>
              <strong>{card.title}</strong>
              <span style={s.muted}>{card.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 当前作品数据摘要 */}
      {counts !== null && (
        <section data-sw="summary">
          <h3 style={s.sectionTitle}>当前作品概览</h3>
          <div style={s.stat}>
            <span style={s.muted}>地点 {counts.places} · 路线 {counts.routes}</span>
            <span style={s.muted}>人物 {counts.characters} · 关系 {counts.relations}</span>
            <span style={s.muted}>事件 {counts.events}</span>
          </div>
        </section>
      )}

      <button type="button" data-sw="platform-collapse" style={{ ...s.button, alignSelf: 'flex-start' }} onClick={collapse}>
        收起右侧面板
      </button>
    </div>
  )
}
