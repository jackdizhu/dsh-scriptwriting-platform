/**
 * 组件订阅 workbench 快照的 hook。
 *
 * 单向数据流：service 是权威（Node 半在阶段 5；当前是 mock），
 * 组件通过 useSyncExternalStore 读快照 + 订阅失效，**只读不写**；
 * 所有写操作走 getService().<命令>()。这正是 D5 的浏览器角色。
 */
import { useSyncExternalStore } from 'react'
import type { WorkbenchSnapshot } from './contract.ts'
import { readSnapshot, subscribeService } from './store.ts'

export function useWorkbench(): WorkbenchSnapshot {
  return useSyncExternalStore(subscribeService, readSnapshot, readSnapshot)
}
