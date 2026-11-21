/** 时间线面板：装配 ChartCanvas + timelineOption。 */
import { ChartCanvas } from './ChartCanvas.tsx'
import { PanelShell } from './PanelShell.tsx'
import { timelineOption } from '../charts/timeline.ts'

const OPTION = timelineOption()

export function Timeline() {
  return (
    <PanelShell title="时间线" subtitle="多泳道事件（静态示意）">
      <ChartCanvas option={OPTION} />
    </PanelShell>
  )
}
