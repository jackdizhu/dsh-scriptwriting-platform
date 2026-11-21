/**
 * service 单例容器：把「具体实现」与「组件」解耦。
 *
 * 阶段 1.5：apply() 里 setService(new MockWorkbenchService(...))。
 * 阶段 5：换成 D5 的 @Remote client service（同一 WorkbenchService 接口），**组件不变**。
 * 这是 D5「浏览器只展示」的关键接缝：组件只认接口与快照，不认数据来源。
 */
import type { WorkbenchService, WorkbenchSnapshot } from './contract.ts'

let current: WorkbenchService | undefined
/** 初始空快照，setService 前组件读到它（渲染为空态，不崩）。 */
const EMPTY: WorkbenchSnapshot = { works: [], activeWork: null, view: null }

export function setService(service: WorkbenchService): void {
  current = service
}

export function getService(): WorkbenchService {
  if (current === undefined) {
    throw new Error('[scriptwriting] service not installed; apply() must call setService() first')
  }
  return current
}

/** 组件订阅入口：读快照（稳定引用）+ 订阅失效，符合 useSyncExternalStore 契约。 */
export function readSnapshot(): WorkbenchSnapshot {
  return current?.getSnapshot() ?? EMPTY
}

export function subscribeService(fn: () => void): () => void {
  return current?.subscribe(fn) ?? (() => {})
}
