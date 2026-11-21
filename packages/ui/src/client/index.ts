/**
 * 浏览器半：注册三个右栏 tab 类型、一个主列页面、左栏「创建平台」行。
 * 决策 D1（β）：左栏行 id = main key = PANEL_ID，二者必须成对注册。
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
// Type-only: ctx.slots 的 Context merge 由 renderer 声明（ui-renderer/src/client/index.ts:41）。
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import { WorldMap } from './panels/WorldMap.tsx'
import { Relations } from './panels/Relations.tsx'
import { Timeline } from './panels/Timeline.tsx'
import { PlatformIcon } from './entries/PlatformIcon.tsx'
import { PlatformPage, type PlatformPageInjected } from './entries/PlatformPage.tsx'

/** 主列面板 id：同时是 `main` 的 key 与 `sidebar.panellist` 的行 id。 */
const PANEL_ID = 'scriptwriting' as MainPanelId

const TABS = [
  { id: 'dsh-scriptwriting-ui/worldmap', kind: 'scriptwriting-worldmap', title: '世界地图', Body: WorldMap, order: 10 },
  { id: 'dsh-scriptwriting-ui/relations', kind: 'scriptwriting-relations', title: '人物关系', Body: Relations, order: 20 },
  { id: 'dsh-scriptwriting-ui/timeline', kind: 'scriptwriting-timeline', title: '时间线', Body: Timeline, order: 30 },
] as const

/** 需要的浏览器服务：slot 注册表、右栏 tab 类型注册表、右栏导航面、主列选择状态。 */
export const inject = ['slots', 'sidebarRightTabs', 'sidebarRight', 'layout']

/** 上次打开的 kind；静态阶段仅在内存记（阶段 5 落持久化）。 */
let lastKind: string = TABS[0].kind

/** 当前是否已停在我们的视图；静态阶段只作主列页面的初始高亮，不做响应式（阶段 5 接 store）。 */
function currentKind(ctx: ClientContext): string | undefined {
  const active = ctx.sidebarRight.active()
  return active !== undefined && TABS.some(tab => tab.kind === active.kind) ? active.kind : undefined
}

/**
 * 注册三块静态视图的入口与承载位置。
 * @param ctx - 浏览器根上下文。
 */
export function apply(ctx: ClientContext): void {
  for (const tab of TABS) {
    ctx.effect(() => ctx.sidebarRightTabs.register({
      id: tab.id,
      kind: tab.kind,
      title: () => tab.title,
      guide: [{ id: tab.kind, order: tab.order, title: () => tab.title }],
    }), `scriptwriting-ui: ${tab.kind} type`)
    ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
      name: 'sidebar.right.pane.tab', key: tab.id,
    }, tab.Body))
    ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
      name: 'sidebar.right.pane.tab.title', key: tab.id,
    }, () => tab.title))
  }

  // ⑥ 主列页面：没有它，selectPanel(PANEL_ID) 会抛「not registered」。
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    inject: (): PlatformPageInjected => ({
      openView: (kind: string) => ctx.sidebarRight.openTab(kind),
      collapse: () => ctx.sidebarRight.toggleExpanded(),
      activeKind: currentKind(ctx),
    }),
  }, PlatformPage))

  // ⑤ 左栏插件按钮区的一行：id 与 main 的 key 相同，壳层据此选中面板。
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 20,
    label: () => '创建平台',
  }, PlatformIcon))

  // 进入该页时把右栏带到我们的视图；已停在我们某个视图上则不动。
  ctx.effect(() => ctx.layout.panelInfo.subscribe(() => {
    if (ctx.layout.panelInfo.getSnapshot().activePanelId !== PANEL_ID) return
    const kind = currentKind(ctx)
    if (kind !== undefined) lastKind = kind
    if (kind !== undefined && ctx.sidebarRight.isExpanded()) return
    ctx.sidebarRight.openTab(lastKind)
  }), 'scriptwriting-ui: panel entry')
}
