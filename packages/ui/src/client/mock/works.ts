/**
 * 多作品 mock fixture（阶段 1.5，D3/D4）。
 *
 * TODO(阶段 5)：整个 mock/ 目录由真实 store + D5 `@Remote` service 替换；
 * 字段与 `contract.ts` / 未来 core 类型同形，替换时组件不动。
 * 当前是内存态：重启丢失、软删仅在本次会话生效——真实持久化在阶段 3/5 落地。
 */
import type { WorkMeta, WorkView } from '../contract.ts'

export interface WorkFixture {
  meta: WorkMeta
  view: WorkView
}

/** 三份作品，内容各不相同——切换作品时三视图数据随之变化，便于验收。 */
export const FIXTURES: readonly WorkFixture[] = [
  {
    meta: {
      id: 'work_mistport', title: '晨雾港的钟声',
      createdAt: Date.parse('2026-11-01T09:00:00Z'), updatedAt: Date.parse('2026-11-18T14:30:00Z'), order: 10,
    },
    view: {
      world: {
        places: [
          { id: 'harbor', name: '晨雾港', x: 120, y: 260, kind: 'port' },
          { id: 'capital', name: '白塔城', x: 340, y: 180, kind: 'city' },
          { id: 'ruin', name: '沉钟遗址', x: 520, y: 320, kind: 'ruin' },
          { id: 'shore', name: '灰砂海岸', x: 300, y: 430, kind: 'shore' },
          { id: 'grove', name: '低语林', x: 620, y: 160, kind: 'city' },
        ],
        routes: [
          { from: 'harbor', to: 'capital', name: '白塔驿道' },
          { from: 'capital', to: 'ruin', name: '钟声旧路' },
          { from: 'capital', to: 'shore', name: '南境商道' },
          { from: 'ruin', to: 'grove', name: '林间小径' },
          { from: 'harbor', to: 'shore', name: '海岸航线' },
        ],
      },
      relations: {
        characters: [
          { id: 'lin', name: '林砚', group: 0, value: 62 },
          { id: 'shen', name: '沈知白', group: 0, value: 48 },
          { id: 'mo', name: '墨鸢', group: 1, value: 55 },
          { id: 'wei', name: '魏无咎', group: 1, value: 40 },
          { id: 'su', name: '苏晚照', group: 2, value: 50 },
          { id: 'gu', name: '顾长风', group: 2, value: 35 },
        ],
        relations: [
          { source: 'lin', target: 'shen', kind: 'ally', label: '同门' },
          { source: 'lin', target: 'mo', kind: 'rival', label: '宿敌' },
          { source: 'mo', target: 'wei', kind: 'ally', label: '同盟' },
          { source: 'shen', target: 'su', kind: 'kin', label: '姐弟' },
          { source: 'su', target: 'gu', kind: 'ally', label: '旧识' },
          { source: 'wei', target: 'gu', kind: 'rival', label: '对立' },
        ],
      },
      timeline: {
        lanes: ['主线', '白塔城', '边境'],
        events: [
          { id: 'e1', lane: '主线', title: '晨雾港启程', start: '2026-01-03', end: '2026-01-05' },
          { id: 'e2', lane: '白塔城', title: '白塔会盟', start: '2026-01-08', end: '2026-01-12' },
          { id: 'e3', lane: '主线', title: '钟声遗址探查', start: '2026-01-15', end: '2026-01-19' },
          { id: 'e4', lane: '边境', title: '灰砂海岸之变', start: '2026-01-18', end: '2026-01-22' },
          { id: 'e5', lane: '白塔城', title: '低语林和谈', start: '2026-01-24', end: '2026-01-27' },
        ],
      },
    },
  },
  {
    meta: {
      id: 'work_ashfall', title: '灰烬之塔',
      createdAt: Date.parse('2026-11-05T10:20:00Z'), updatedAt: Date.parse('2026-11-17T08:10:00Z'), order: 20,
    },
    view: {
      world: {
        places: [
          { id: 'tower', name: '灰烬塔', x: 360, y: 150, kind: 'ruin' },
          { id: 'forge', name: '熔炉镇', x: 180, y: 300, kind: 'city' },
          { id: 'crystal', name: '晶簇洞', x: 540, y: 360, kind: 'shore' },
          { id: 'gate', name: '北境关', x: 620, y: 200, kind: 'port' },
        ],
        routes: [
          { from: 'forge', to: 'tower', name: '焦土路' },
          { from: 'tower', to: 'crystal', name: '晶脉小径' },
          { from: 'tower', to: 'gate', name: '北境驿道' },
        ],
      },
      relations: {
        characters: [
          { id: 'yan', name: '晏烽', group: 1, value: 58 },
          { id: 'ling', name: '凌霜', group: 0, value: 52 },
          { id: 'qi', name: '祁连', group: 2, value: 44 },
          { id: 'bai', name: '白烬', group: 1, value: 38 },
        ],
        relations: [
          { source: 'yan', target: 'bai', kind: 'ally', label: '同乡' },
          { source: 'yan', target: 'ling', kind: 'rival', label: '立场相左' },
          { source: 'ling', target: 'qi', kind: 'kin', label: '兄妹' },
        ],
      },
      timeline: {
        lanes: ['主线', '熔炉镇', '北境'],
        events: [
          { id: 'a1', lane: '主线', title: '灰烬塔苏醒', start: '2026-02-02', end: '2026-02-06' },
          { id: 'a2', lane: '熔炉镇', title: '熔炉停火', start: '2026-02-09', end: '2026-02-11' },
          { id: 'a3', lane: '北境', title: '关隘失守', start: '2026-02-14', end: '2026-02-18' },
        ],
      },
    },
  },
  {
    meta: {
      id: 'work_tide', title: '潮汐纪事',
      createdAt: Date.parse('2026-11-10T16:40:00Z'), updatedAt: Date.parse('2026-11-20T11:05:00Z'), order: 30,
    },
    view: {
      world: {
        places: [
          { id: 'reef', name: '珊瑚礁', x: 140, y: 380, kind: 'shore' },
          { id: 'lighthouse', name: '孤立灯塔', x: 400, y: 200, kind: 'city' },
          { id: 'deep', name: '深海裂谷', x: 600, y: 400, kind: 'ruin' },
        ],
        routes: [
          { from: 'reef', to: 'lighthouse', name: '潮汐水道' },
          { from: 'lighthouse', to: 'deep', name: '下潜航线' },
        ],
      },
      relations: {
        characters: [
          { id: 'su2', name: '苏澜', group: 0, value: 66 },
          { id: 'hai', name: '海生', group: 2, value: 42 },
          { id: 'mo2', name: '墨潮', group: 1, value: 50 },
        ],
        relations: [
          { source: 'su2', target: 'hai', kind: 'ally', label: '搭档' },
          { source: 'su2', target: 'mo2', kind: 'rival', label: '宿怨' },
        ],
      },
      timeline: {
        lanes: ['主线', '灯塔', '深海'],
        events: [
          { id: 't1', lane: '主线', title: '潮位异常', start: '2026-03-01', end: '2026-03-04' },
          { id: 't2', lane: '灯塔', title: '灯芯熄灭', start: '2026-03-06', end: '2026-03-08' },
          { id: 't3', lane: '深海', title: '裂谷回声', start: '2026-03-10', end: '2026-03-15' },
        ],
      },
    },
  },
]
