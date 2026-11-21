/**
 * 人物关系面板：订阅当前作品 view 的关系数据 → option → ChartCanvas。
 */
import { useMemo } from 'react'
import { ChartCanvas } from './ChartCanvas.tsx'
import { PanelShell } from './PanelShell.tsx'
import { relationsOption } from '../charts/relations.ts'
import { useWorkbench } from '../useWorkbench.ts'

export function Relations() {
  const { view, activeWork } = useWorkbench()
  const data = view?.relations
  const option = useMemo(() => data === undefined ? null : relationsOption(data), [data])

  return (
    <PanelShell title="人物关系" subtitle={`${activeWork?.title ?? '未选择作品'} · 力导向关系图`} empty={data === undefined}>
      {option !== null && <ChartCanvas option={option} />}
    </PanelShell>
  )
}
