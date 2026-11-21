/**
 * 浏览器半打包：复刻 harness lazy-CJS factory 契约的最小子集（决策 D2-A）。
 * 对照真源 packages/client/tsdown.client.ts:1148-1153（banner/intro/footer 三行）。
 */
import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsdown'

/** React 由页面模块表注入；其余一律内联——echarts 必须内联，模块表里没有它。 */
const EXTERNAL = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

/** Apache-2.0 4(d)：分发产物必须携带 NOTICE 归属。普通 tsdown 无 postBanner 钩子，并入 banner。 */
const NOTICE = readFileSync(new URL('./licenses/NOTICE.echarts.txt', import.meta.url), 'utf8')
  .trimEnd().split('\n').map(line => `/*! ${line} */`).join('\n')

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  format: 'cjs',
  platform: 'browser',
  outDir: 'lib',
  dts: false,
  sourcemap: true,
  // 构建链顺序：tsc(Node 半) → client types → tsdown。tsdown 默认清 lib，
  // 会把前两步产物删掉，故关闭；lib 的清理由 scripts/tsc.mjs 在链首完成。
  clean: false,
  external: EXTERNAL,
  // 内联的 zrender/echarts 源码含 246 处 process.env.NODE_ENV；浏览器没有 process
  // 全局，factory 执行时会抛 "process is not defined"（dsh-desktop web-boot 实测）。
  // 必须用 define 全局替换为生产常量（仅 build 时生效，src 里的 React 判断不受影响），
  // 顺带让开发期 assert/log 分支被常量折叠 + tree-shake。
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  outputOptions: {
    // harness 预设同样用 entryFileNames 固定为 .js（tsdown.client.ts:1135），
    // 否则 cjs 格式默认产出 client.cjs，与 exports["./client"] 不匹配。
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: "dsh-scriptwriting-ui", factory: (require) => {\n${NOTICE}`,
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    footer: 'return module.exports; } });',
  },
})
