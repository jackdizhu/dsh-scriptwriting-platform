/**
 * 从 shell 的 CSS 变量读色值，深浅主题都跟随（不写死颜色）。
 * 用 registerTheme 把变量映射成 ECharts 主题；缺失变量时给出中性回退。
 */
import { echarts } from './echarts.ts'

/** 主题 id，供 init 的第三参数引用。 */
export const THEME_ID = 'scriptwriting'

const DEFAULTS = {
  text: '#1f2329',
  sub: '#646a73',
  line: '#b7bcc4',
  surface: '#ffffff',
  accent: '#3370ff',
} as const

function readVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value === '' ? fallback : value
}

/** 读取当前 CSS 变量并（重新）注册主题；每次 init 前调用以跟随主题切换。 */
export function refreshTheme(): void {
  const text = readVar('--dsh-text-primary', DEFAULTS.text)
  const sub = readVar('--dsh-text-secondary', DEFAULTS.sub)
  const line = readVar('--dsh-border', DEFAULTS.line)
  const surface = readVar('--dsh-surface', DEFAULTS.surface)
  const accent = readVar('--dsh-accent', DEFAULTS.accent)
  echarts.registerTheme(THEME_ID, {
    color: [accent, '#7b68ee', '#00b96b', '#f5a623', '#e05252'],
    textStyle: { color: text },
    backgroundColor: surface,
    title: { textStyle: { color: text }, subtextStyle: { color: sub } },
    legend: { textStyle: { color: sub } },
    categoryAxis: {
      axisLine: { lineStyle: { color: line } },
      axisLabel: { color: sub },
      splitLine: { lineStyle: { color: line } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: line } },
      axisLabel: { color: sub },
      splitLine: { lineStyle: { color: line } },
    },
  })
}
