/**
 * 时间线静态数据（阶段 1）。
 * TODO(阶段 5)：由 dsh-scriptwriting-core 的 `TimelineEvent` 同名类型替换，
 * 字段保持一致以免返工；本文件不 import core（阶段 1 边界）。
 */
export interface TimelineEvent {
  id: string
  lane: string
  title: string
  start: string
  end: string
}

/** 泳道自上而下；序号即 yAxis 索引。 */
export const lanes = ['主线', '白塔城', '边境'] as const

export const events: readonly TimelineEvent[] = [
  { id: 'e1', lane: '主线', title: '晨雾港启程', start: '2026-01-03', end: '2026-01-05' },
  { id: 'e2', lane: '白塔城', title: '白塔会盟', start: '2026-01-08', end: '2026-01-12' },
  { id: 'e3', lane: '主线', title: '钟声遗址探查', start: '2026-01-15', end: '2026-01-19' },
  { id: 'e4', lane: '边境', title: '灰砂海岸之变', start: '2026-01-18', end: '2026-01-22' },
  { id: 'e5', lane: '白塔城', title: '低语林和谈', start: '2026-01-24', end: '2026-01-27' },
]
