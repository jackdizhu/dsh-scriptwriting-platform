/**
 * 世界地图面板：订阅当前作品 view 的世界数据 → option → ChartCanvas。
 * 组件只读快照；数据切换（换作品）由 service 驱动，这里不写状态。
 */
import { useMemo } from 'react'
import { ChartCanvas } from './ChartCanvas.tsx'
import { PanelShell } from './PanelShell.tsx'
import { worldOption } from '../charts/world.ts'
import { useWorkbench } from '../useWorkbench.ts'

export function WorldMap() {
  const { view, activeWork } = useWorkbench()
  const data = view?.world
  const option = useMemo(() => data === undefined ? null : worldOption(data), [data])

  return (
    <PanelShell title="世界地图" subtitle={`${activeWork?.title ?? '未选择作品'} · 地点与路线`} empty={data === undefined}>
      {option !== null && <ChartCanvas option={option} />}
    </PanelShell>
  )
}
