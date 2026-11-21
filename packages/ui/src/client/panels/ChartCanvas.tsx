/**
 * ECharts 生命周期封装：useEffect 内 init；ResizeObserver → resize()；
 * cleanup 里 dispose()（防重复开关 tab 累积 canvas 与全局监听）；
 * setOption(opt, { notMerge: true }) 防旧 series 残留。
 */
import { useEffect, useRef } from 'react'
import type { EChartsCoreOption } from 'echarts/core'
import { echarts } from '../echarts.ts'
import { refreshTheme, THEME_ID } from '../theme.ts'

export interface ChartCanvasProps {
  option: EChartsCoreOption
  height?: number
}

export function ChartCanvas({ option, height = 420 }: ChartCanvasProps) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = host.current
    if (node === null) return

    refreshTheme()
    const chart = echarts.init(node, THEME_ID)
    chart.setOption(option, { notMerge: true })

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(node)

    return () => {
      observer.disconnect()
      chart.dispose()
    }
  }, [option])

  return <div ref={host} data-sw="chart-canvas" style={{ width: '100%', height }} />
}
