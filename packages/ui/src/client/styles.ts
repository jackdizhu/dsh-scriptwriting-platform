/**
 * 内联样式常量（阶段 1.5）——项目不建 CSS 管线（实施文档 §3.7）。
 * 单一 accent，颜色尽量用 currentColor / 中性灰以跟随深浅主题；
 * accent 与 theme.ts 的默认蓝一致，主题变量由 ECharts 侧处理。
 *
 * 阶段 5：可改为读 shell 的 --dsh-* 变量（与 theme.ts readVar 同策略）。
 */
import type { CSSProperties } from 'react'

export const ACCENT = '#3370ff'

export const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 16, padding: 4, fontSize: 13 } satisfies CSSProperties,
  h2: { margin: 0, fontSize: 20, fontWeight: 600 } satisfies CSSProperties,
  sectionTitle: { margin: '0 0 8px', fontSize: 14, fontWeight: 600 } satisfies CSSProperties,
  muted: { color: '#646a73', fontSize: 12 } satisfies CSSProperties,
  row: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } satisfies CSSProperties,
  cardList: { display: 'flex', flexDirection: 'column', gap: 6 } satisfies CSSProperties,
  workItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    border: '1px solid #b7bcc4', borderRadius: 6,
  } satisfies CSSProperties,
  workItemActive: { borderColor: ACCENT, background: 'rgba(51,112,255,0.08)' } satisfies CSSProperties,
  workTitle: { flex: 1, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } satisfies CSSProperties,
  input: {
    flex: 1, minWidth: 120, padding: '6px 8px', border: '1px solid #b7bcc4',
    borderRadius: 4, font: 'inherit',
  } satisfies CSSProperties,
  button: {
    padding: '6px 12px', border: '1px solid #b7bcc4', borderRadius: 4,
    background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer',
  } satisfies CSSProperties,
  buttonPrimary: { borderColor: ACCENT, color: ACCENT } satisfies CSSProperties,
  buttonDanger: { borderColor: '#e05252', color: '#e05252' } satisfies CSSProperties,
  cards: { display: 'flex', gap: 10, flexWrap: 'wrap' } satisfies CSSProperties,
  viewCard: {
    flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'left',
    padding: 12, border: '1px solid #b7bcc4', borderRadius: 6,
    background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer',
  } satisfies CSSProperties,
  viewCardActive: { borderColor: ACCENT } satisfies CSSProperties,
  stat: { display: 'flex', gap: 16, flexWrap: 'wrap' } satisfies CSSProperties,
  divider: { height: 1, background: '#b7bcc4', opacity: 0.5 } satisfies CSSProperties,
} as const
