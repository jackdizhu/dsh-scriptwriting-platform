/**
 * 三块视图共用的外壳：标题 / 副标题 / 内容区 / 空态。
 * 静态阶段只接 props，不取上下文、不调 useTabInfo，便于后续直接渲染测试。
 */
import type { ReactNode } from 'react'

export interface PanelShellProps {
  title: string
  subtitle?: string
  children: ReactNode
  empty?: boolean
}

export function PanelShell({ title, subtitle, children, empty = false }: PanelShellProps) {
  return (
    <div data-sw="panel-shell">
      <header data-sw="panel-header">
        <h3>{title}</h3>
        {subtitle !== undefined && <span data-sw="panel-subtitle">{subtitle}</span>}
      </header>
      <div data-sw="panel-body">
        {empty ? <p data-sw="panel-empty">暂无数据</p> : children}
      </div>
    </div>
  )
}
