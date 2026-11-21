/**
 * 时间线 option（纯函数）：custom series + time x 轴 + category y 轴泳道 + dataZoom。
 * 不用 timeline 组件——那是多帧动画控制器，不是事件时间轴。
 * 区间事件画成矩形条；renderItem 的返回对象走 ECharts 内建图元，不顶层 import zrender。
 * 阶段 1.5：数据由 service 快照注入；x 轴范围按数据自适应（不同作品日期不同）。
 */
import type { EChartsCoreOption } from 'echarts/core'
import type { TimelineData } from '../contract.ts'

interface BarItem {
  value: [number, number, number]
  name: string
}

/** renderItem 的形状由 ECharts 运行时注入；这里只声明用到的两个方法。 */
interface RenderItemApi {
  coord: (value: number, axisIndex: number) => number
  value: (dim: number) => number
}

/** 给 x 轴范围留一点前后余量，避免事件条贴边。 */
function axisRange(data: TimelineData): { min: string; max: string } {
  if (data.events.length === 0) return { min: '2026-01-01', max: '2026-02-01' }
  const times = data.events.flatMap(event => [Date.parse(event.start), Date.parse(event.end)])
  const pad = 3 * 24 * 60 * 60 * 1000
  const min = Math.min(...times) - pad
  const max = Math.max(...times) + pad
  return { min: new Date(min).toISOString().slice(0, 10), max: new Date(max).toISOString().slice(0, 10) }
}

export function timelineOption(data: TimelineData): EChartsCoreOption {
  const lanes = [...data.lanes]
  const range = axisRange(data)
  const barData: BarItem[] = data.events.map(event => ({
    value: [Date.parse(event.start), Date.parse(event.end), Math.max(lanes.indexOf(event.lane), 0)],
    name: event.title,
  }))

  return {
    title: { text: '时间线', subtext: `${data.events.length} 个事件 · ${lanes.length} 条泳道` },
    tooltip: {
      trigger: 'item',
      formatter: (params: { name?: string; value?: number[] }) => {
        const start = new Date(params.value?.[0] ?? 0).toISOString().slice(0, 10)
        const end = new Date(params.value?.[1] ?? 0).toISOString().slice(0, 10)
        return `${params.name ?? ''}<br>${start} → ${end}`
      },
    },
    grid: { left: 80, right: 30, top: 70, bottom: 70 },
    xAxis: { type: 'time', min: range.min, max: range.max },
    yAxis: { type: 'category', data: lanes, inverse: true },
    dataZoom: [{ type: 'slider', bottom: 10, height: 18 }],
    series: [
      {
        type: 'custom',
        encode: { x: [0, 1], y: 2 },
        data: barData,
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
