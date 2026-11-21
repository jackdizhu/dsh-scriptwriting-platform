/**
 * 世界地图静态数据（阶段 1）。
 * TODO(阶段 5)：由 dsh-scriptwriting-core 的 `WorldPlace`/`WorldRoute` 同名类型替换，
 * 字段保持一致以免返工；本文件不 import core（阶段 1 边界）。
 */
export interface WorldPlace {
  id: string
  name: string
  x: number
  y: number
  kind: 'city' | 'ruin' | 'port' | 'shore'
}

export interface WorldRoute {
  from: string
  to: string
  name: string
}

export const places: readonly WorldPlace[] = [
  { id: 'harbor', name: '晨雾港', x: 120, y: 260, kind: 'port' },
  { id: 'capital', name: '白塔城', x: 340, y: 180, kind: 'city' },
  { id: 'ruin', name: '沉钟遗址', x: 520, y: 320, kind: 'ruin' },
  { id: 'shore', name: '灰砂海岸', x: 300, y: 430, kind: 'shore' },
  { id: 'grove', name: '低语林', x: 620, y: 160, kind: 'city' },
]

export const routes: readonly WorldRoute[] = [
  { from: 'harbor', to: 'capital', name: '白塔驿道' },
  { from: 'capital', to: 'ruin', name: '钟声旧路' },
  { from: 'capital', to: 'shore', name: '南境商道' },
  { from: 'ruin', to: 'grove', name: '林间小径' },
  { from: 'harbor', to: 'shore', name: '海岸航线' },
]
