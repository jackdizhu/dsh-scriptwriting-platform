/**
 * 世界地图 option（纯函数，可单测）：graph + layout none，坐标来自传入的 view 数据。
 * 用 graph 而非 geo：虚构世界没有经纬度，geo 需先 registerMap(GeoJSON)。
 * 阶段 1.5：数据由 service 快照注入，不再直接 import mock 常量。
 */
import type { EChartsCoreOption } from 'echarts/core'
import type { PlaceKind, WorldData, WorldPlace } from '../contract.ts'

const KIND_SYMBOL: Record<PlaceKind, string> = {
  city: 'circle',
  ruin: 'diamond',
  port: 'triangle',
  shore: 'rect',
}

export function worldOption(data: WorldData): EChartsCoreOption {
  const byId = new Map(data.places.map(place => [place.id, place]))
  return {
    title: { text: '世界地图', subtext: '地点与路线' },
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        coordinateSystem: 'cartesian2d',
        xAxisIndex: 0,
        yAxisIndex: 0,
        label: { show: true, position: 'right', formatter: '{b}' },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 9,
        lineStyle: { color: 'source', curveness: 0.12, width: 1.6 },
        data: data.places.map((place: WorldPlace) => ({
          id: place.id,
          name: place.name,
          value: [place.x, place.y],
          symbol: KIND_SYMBOL[place.kind],
          symbolSize: 20,
        })),
        links: data.routes.flatMap(route => {
          const from = byId.get(route.from)
          const to = byId.get(route.to)
          if (from === undefined || to === undefined) return []
          return [{ source: route.from, target: route.to, name: route.name }]
        }),
      },
    ],
    xAxis: { type: 'value', min: 0, max: 720, show: false },
    yAxis: { type: 'value', min: 0, max: 500, show: false, inverse: true },
    grid: { left: 24, right: 24, top: 64, bottom: 24 },
  }
}
