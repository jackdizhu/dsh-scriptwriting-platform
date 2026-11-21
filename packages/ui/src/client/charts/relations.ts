/**
 * 人物关系 option（纯函数）：graph + force 力导向自动避让。
 * 关系类型用 lineStyle.type + 线宽区分，与地图共用 graph 元素模型。
 * 阶段 1.5：数据由 service 快照注入，不再直接 import mock 常量。
 */
import type { EChartsCoreOption } from 'echarts/core'
import type { RelationKind, RelationsData } from '../contract.ts'

const STYLE: Record<RelationKind, { type: 'solid' | 'dashed' | 'dotted'; width: number }> = {
  ally: { type: 'solid', width: 2 },
  rival: { type: 'dashed', width: 2 },
  kin: { type: 'dotted', width: 3 },
}

export function relationsOption(data: RelationsData): EChartsCoreOption {
  return {
    title: { text: '人物关系', subtext: '实线同盟 / 虚线敌对 / 点线亲缘' },
    tooltip: { trigger: 'item' },
    legend: [{ data: ['同盟', '敌对', '亲缘'], top: 26 }],
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        force: { repulsion: 320, edgeLength: [90, 160] },
        label: { show: true, position: 'right', formatter: '{b}' },
        edgeLabel: { show: true, formatter: '{b}', fontSize: 10 },
        lineStyle: { color: 'source', curveness: 0.1, opacity: 0.8 },
        categories: [
          { name: '同盟圈' },
          { name: '对立圈' },
          { name: '中立圈' },
        ],
        data: data.characters.map(character => ({
          id: character.id,
          name: character.name,
          value: character.value,
          symbolSize: character.value,
          category: character.group,
        })),
        links: data.relations.map(relation => ({
          source: relation.source,
          target: relation.target,
          name: relation.label,
          lineStyle: STYLE[relation.kind],
        })),
      },
    ],
  }
}
