/**
 * 人物关系静态数据（阶段 1）。
 * TODO(阶段 5)：由 dsh-scriptwriting-core 的 `Character`/`Relation` 同名类型替换，
 * 字段保持一致以免返工；本文件不 import core（阶段 1 边界）。
 */
export interface Character {
  id: string
  name: string
  group: number
  value: number
}

export type RelationKind = 'ally' | 'rival' | 'kin'

export interface Relation {
  source: string
  target: string
  kind: RelationKind
  label: string
}

export const characters: readonly Character[] = [
  { id: 'lin', name: '林砚', group: 0, value: 62 },
  { id: 'shen', name: '沈知白', group: 0, value: 48 },
  { id: 'mo', name: '墨鸢', group: 1, value: 55 },
  { id: 'wei', name: '魏无咎', group: 1, value: 40 },
  { id: 'su', name: '苏晚照', group: 2, value: 50 },
  { id: 'gu', name: '顾长风', group: 2, value: 35 },
]

export const relations: readonly Relation[] = [
  { source: 'lin', target: 'shen', kind: 'ally', label: '同门' },
  { source: 'lin', target: 'mo', kind: 'rival', label: '宿敌' },
  { source: 'mo', target: 'wei', kind: 'ally', label: '同盟' },
  { source: 'shen', target: 'su', kind: 'kin', label: '姐弟' },
  { source: 'su', target: 'gu', kind: 'ally', label: '旧识' },
  { source: 'wei', target: 'gu', kind: 'rival', label: '对立' },
]
