/**
 * Node 半：阶段 1 无宿主侧职责。浏览器半（src/client/）才是本包的实质内容，
 * 由 dsh.client 声明 + ./client 导出交给模块系统加载（决策 D2-A）。
 * TODO(阶段 5)：领域视图的数据订阅与 Model Experience 接入落在这里。
 */
export const name = 'dsh-scriptwriting-ui'
export const inject: readonly string[] = []

/** Node 半插件主体：阶段 1 为空操作，仅保证包可被 Loader 加载。 */
export function apply(): void {}
