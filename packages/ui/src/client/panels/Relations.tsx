/** 人物关系面板：装配 ChartCanvas + relationsOption。 */
import { ChartCanvas } from './ChartCanvas.tsx'
import { PanelShell } from './PanelShell.tsx'
import { relationsOption } from '../charts/relations.ts'

const OPTION = relationsOption()

export function Relations() {
  return (
    <PanelShell title="人物关系" subtitle="力导向关系图（静态示意）">
      <ChartCanvas option={OPTION} />
    </PanelShell>
  )
}
