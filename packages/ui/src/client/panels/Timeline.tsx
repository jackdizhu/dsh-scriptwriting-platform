/**
 * 时间线面板：订阅当前作品 view 的事件数据 → option → ChartCanvas。
 */
import { useMemo } from 'react'
import { ChartCanvas } from './ChartCanvas.tsx'
import { PanelShell } from './PanelShell.tsx'
import { timelineOption } from '../charts/timeline.ts'
import { useWorkbench } from '../useWorkbench.ts'

export function Timeline() {
  const { view, activeWork } = useWorkbench()
  const data = view?.timeline
  const option = useMemo(() => data === undefined ? null : timelineOption(data), [data])

  return (
    <PanelShell title="时间线" subtitle={`${activeWork?.title ?? '未选择作品'} · 多泳道事件`} empty={data === undefined}>
      {option !== null && <ChartCanvas option={option} />}
    </PanelShell>
  )
}
