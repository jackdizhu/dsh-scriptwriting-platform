/** 世界地图面板：装配 ChartCanvas + worldOption；组件不含图表配置。 */
import { ChartCanvas } from './ChartCanvas.tsx'
import { PanelShell } from './PanelShell.tsx'
import { worldOption } from '../charts/world.ts'

const OPTION = worldOption()

export function WorldMap() {
  return (
    <PanelShell title="世界地图" subtitle="地点与路线（静态示意）">
      <ChartCanvas option={OPTION} />
    </PanelShell>
  )
}
