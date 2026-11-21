/**
 * 时间线 option（纯函数）：custom series + time x 轴 + category y 轴泳道 + dataZoom。
 * 不用 timeline 组件——那是多帧动画控制器，不是事件时间轴。
 * 区间事件画成矩形条；renderItem 的返回对象走 ECharts 内建图元，不顶层 import zrender。
 */
import type { EChartsCoreOption } from 'echarts/core'
import { events, lanes } from '../mock/events.ts'

interface BarItem {
  value: [number, number, number]
  name: string
}

/** renderItem 的形状由 ECharts 运行时注入；这里只声明用到的两个方法。 */
interface RenderItemApi {
  coord: (value: number, axisIndex: number) => number
  value: (dim: number) => number
}

export function timelineOption(): EChartsCoreOption {
  const data: BarItem[] = events.map(event => ({
    value: [Date.parse(event.start), Date.parse(event.end), lanes.indexOf(event.lane as typeof lanes[number])],
    name: event.title,
  }))

  return {
    title: { text: '时间线', subtext: '多泳道事件区间（静态示意）' },
    tooltip: {
      trigger: 'item',
      formatter: (params: { name?: string; value?: number[] }) => {
        const start = new Date(params.value?.[0] ?? 0).toISOString().slice(0, 10)
        const end = new Date(params.value?.[1] ?? 0).toISOString().slice(0, 10)
        return `${params.name ?? ''}<br>${start} → ${end}`
      },
    },
    grid: { left: 80, right: 30, top: 70, bottom: 70 },
    xAxis: { type: 'time', min: '2026-01-01', max: '2026-02-01' },
    yAxis: { type: 'category', data: [...lanes], inverse: true },
    dataZoom: [{ type: 'slider', bottom: 10, height: 18 }],
    series: [
      {
        type: 'custom',
        encode: { x: [0, 1], y: 2 },
        data,
        renderItem: (_params: unknown, api: RenderItemApi) => {
          const start = api.value(0)
          const end = api.value(1)
          const lane = api.value(2)
          const x0 = api.coord(start, 0)
          const x1 = api.coord(end, 0)
          const y = api.coord(lane, 1)
          return {
            type: 'rect',
            shape: { x: x0, y: y - 9, width: Math.max(x1 - x0, 2), height: 18, r: 3 },
            style: { fill: '#4e83fd', opacity: 0.85 },
          }
        },
      },
    ],
  }
}
