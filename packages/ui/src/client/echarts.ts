/**
 * ECharts 按需注册：只 use 三块视图用到的图表、组件与 renderer。
 * 全量入口会把 22 种图表打进来，体积是按需引入的数倍（决策 D2-A 的边界）。
 * zrender 不顶层 import（pnpm 下无符号链接且会形成双实例），图元一律用 echarts.graphic.*。
 */
import * as echarts from 'echarts/core'
import { GraphChart, CustomChart } from 'echarts/charts'
import { TooltipComponent, DataZoomComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  GraphChart,
  CustomChart,
  TooltipComponent,
  DataZoomComponent,
  GridComponent,
  CanvasRenderer,
])

export { echarts }
