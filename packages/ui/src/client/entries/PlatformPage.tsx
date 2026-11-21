/**
 * 主列「创作平台」页（main 的 keyed 注册，key = PANEL_ID）。
 * 职责：三视图入口卡（点卡片切右栏 tab）、当前视图摘要、收起右侧面板按钮。
 * 不是空占位——β 入口下点击左栏行会替换主列，此页须承担真实职责。
 */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

export interface PlatformPageInjected {
  /** 打开某个右栏视图（由入口绑定 openTab）。 */
  openView: (kind: string) => void
  /** 收起右侧面板。 */
  collapse: () => void
  /** 当前激活的视图 kind，未开时为 undefined。 */
  activeKind: string | undefined
}

const CARDS = [
  { kind: 'scriptwriting-worldmap', title: '世界地图', desc: '地点、路线与地名标注' },
  { kind: 'scriptwriting-relations', title: '人物关系', desc: '角色之间的同盟、敌对与亲缘' },
  { kind: 'scriptwriting-timeline', title: '时间线', desc: '多泳道事件区间' },
] as const

export function PlatformPage({ openView, collapse, activeKind }: PropsRuntime<'main'> & PlatformPageInjected) {
  return (
    <div data-sw="platform-page">
      <h2>创作平台</h2>
      <p>选择一视图，在右侧面板查看静态示意。</p>
      <div data-sw="platform-cards">
        {CARDS.map(card => (
          <button key={card.kind} type="button" data-sw="platform-card"
            data-active={card.kind === activeKind ? 'true' : 'false'}
            onClick={() => openView(card.kind)}>
            <strong>{card.title}</strong>
            <span>{card.desc}</span>
          </button>
        ))}
      </div>
      <button type="button" data-sw="platform-collapse" onClick={collapse}>收起右侧面板</button>
    </div>
  )
}
